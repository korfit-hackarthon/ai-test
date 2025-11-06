import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import db from '../db/drizzle';
import { questions, qaHistory } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const app = new Hono();

const createQuestionSchema = z.object({
  question: z.string().min(1),
  modelAnswer: z.string().min(1),
  reasoning: z.string().min(1),
});

const submitAnswerSchema = z.object({
  questionId: z.number(),
  userAnswer: z.string().min(1),
  aiModel: z.string(),
});

// 질문 목록 조회
app.get('/', async (c) => {
  const allQuestions = await db
    .select()
    .from(questions)
    .orderBy(desc(questions.createdAt));
  return c.json(allQuestions);
});

// 질문 상세 조회
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, id))
    .get();

  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }

  return c.json(question);
});

// 질문 등록
app.post('/', zValidator('json', createQuestionSchema), async (c) => {
  const data = c.req.valid('json');

  const result = await db
    .insert(questions)
    .values({
      question: data.question,
      modelAnswer: data.modelAnswer,
      reasoning: data.reasoning,
    })
    .returning();

  return c.json(result[0], 201);
});

// 질문 수정
app.put('/:id', zValidator('json', createQuestionSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  const result = await db
    .update(questions)
    .set({
      question: data.question,
      modelAnswer: data.modelAnswer,
      reasoning: data.reasoning,
      updatedAt: new Date(),
    })
    .where(eq(questions.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: 'Question not found' }, 404);
  }

  return c.json(result[0]);
});

// 질문 삭제
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  const result = await db
    .delete(questions)
    .where(eq(questions.id, id))
    .returning();

  if (result.length === 0) {
    return c.json({ error: 'Question not found' }, 404);
  }

  return c.json({ success: true });
});

// AI 답변 평가
app.post('/evaluate', zValidator('json', submitAnswerSchema), async (c) => {
  const { questionId, userAnswer, aiModel } = c.req.valid('json');

  // 질문 조회
  const question = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .get();

  if (!question) {
    return c.json({ error: 'Question not found' }, 404);
  }

  // OpenRouter를 통한 AI 평가
  const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const systemPrompt = `당신은 면접관입니다. 지원자의 답변을 평가하고 개선점을 제시합니다.

면접 질문: ${question.question}
모범답안: ${question.modelAnswer}
모범답안의 논리와 이유: ${question.reasoning}

지원자의 답변을 평가하여:
1. 모범답안과의 유사도를 0-100점으로 점수화하세요
2. 지원자가 더 나은 답변을 할 수 있도록 구체적인 힌트를 제공하세요
3. 답변에서 잘한 점과 개선이 필요한 점을 명확히 지적하세요

응답은 반드시 다음 JSON 형식으로 제공하세요:
{
  "score": <0-100 사이의 숫자>,
  "hints": "<구체적인 힌트와 피드백>",
  "strengths": "<잘한 점>",
  "improvements": "<개선이 필요한 점>"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: aiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `지원자의 답변: ${userAnswer}` },
      ],
      reasoning_effort: 'medium',
      max_tokens: 2000,
      temperature: 0.7,
    });

    let aiResponse = completion.choices[0]?.message?.content || '{}';

    // ```json``` 마크다운 코드 블록 제거
    aiResponse = aiResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const evaluation = JSON.parse(aiResponse);

    // QA 히스토리 저장
    const historyResult = await db
      .insert(qaHistory)
      .values({
        questionId,
        userAnswer,
        aiModel,
        aiResponse,
        score: evaluation.score || 0,
        hints: evaluation.hints || '',
      })
      .returning();

    return c.json({
      ...evaluation,
      historyId: historyResult[0]?.id || 0,
    });
  } catch (error) {
    console.error('AI evaluation error:', error);
    return c.json({ error: 'Failed to evaluate answer' }, 500);
  }
});

// QA 히스토리 조회
app.get('/history/:questionId', async (c) => {
  const questionId = parseInt(c.req.param('questionId'));

  const history = await db
    .select()
    .from(qaHistory)
    .where(eq(qaHistory.questionId, questionId))
    .orderBy(desc(qaHistory.createdAt));

  return c.json(history);
});

export default app;

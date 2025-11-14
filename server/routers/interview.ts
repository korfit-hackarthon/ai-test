import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { streamSSE } from 'hono/streaming';
import db from '../db/drizzle';
import {
  questions,
  interviewSets,
  interviewAnswers,
  interviewEvaluations,
  answerNotes,
} from '../db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import OpenAI from 'openai';

const app = new Hono();

const createSetSchema = z.object({
  jobType: z.enum(['marketing', 'sales', 'it']),
  level: z.enum(['intern', 'entry']),
  questionCount: z.number().min(1).max(10).default(3),
});

const submitAnswerSchema = z.object({
  setId: z.number(),
  questionId: z.number(),
  questionOrder: z.number(),
  userAnswer: z.string().min(1),
  enableFollowUp: z.boolean().optional(),
  aiModel: z.string().optional(),
});

const submitFollowUpSchema = z.object({
  answerId: z.number(),
  followUpAnswer: z.string().min(1),
});

// 면접 세트 생성 (질문 개수 선택 가능)
app.post('/sets', zValidator('json', createSetSchema), async (c) => {
  const { jobType, level, questionCount } = c.req.valid('json');

  try {
    // 면접 세트 생성
    const setResult = await db
      .insert(interviewSets)
      .values({
        jobType,
        level,
        status: 'in_progress',
      })
      .returning();

    const setId = setResult[0]?.id;
    if (!setId) {
      return c.json({ error: 'Failed to create interview set' }, 500);
    }

    // 질문 조합: 공통 40%, 직무 30%, 외국인 30% 비율로 선택
    const commonCount = Math.ceil(questionCount * 0.4);
    const jobCount = Math.ceil(questionCount * 0.3);
    const foreignerCount = questionCount - commonCount - jobCount;

    const commonQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.category, 'common'))
      .limit(20);

    const jobQuestions = await db
      .select()
      .from(questions)
      .where(and(eq(questions.category, 'job'), eq(questions.jobType, jobType)))
      .limit(20);

    const foreignerQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.category, 'foreigner'))
      .limit(20);

    // 랜덤 선택 (질문이 부족한 경우 대비)
    const selectedQuestions = [
      ...shuffleArray(commonQuestions).slice(
        0,
        Math.min(commonCount, commonQuestions.length)
      ),
      ...shuffleArray(jobQuestions).slice(
        0,
        Math.min(jobCount, jobQuestions.length)
      ),
      ...shuffleArray(foreignerQuestions).slice(
        0,
        Math.min(foreignerCount, foreignerQuestions.length)
      ),
    ].slice(0, questionCount);

    // 질문이 없으면 기본 질문 생성
    if (selectedQuestions.length === 0) {
      const defaultQuestions = [
        {
          id: 0,
          question: '자기소개를 해주세요.',
          category: 'common',
          order: 1,
        },
        {
          id: 0,
          question: '우리 회사에 지원한 동기는 무엇인가요?',
          category: 'common',
          order: 2,
        },
        {
          id: 0,
          question: '본인의 강점과 약점을 말씀해주세요.',
          category: 'common',
          order: 3,
        },
        {
          id: 0,
          question: '한국에서 일하고 싶은 이유는 무엇인가요?',
          category: 'foreigner',
          order: 4,
        },
        {
          id: 0,
          question: '5년 후 자신의 모습은 어떨 것 같나요?',
          category: 'common',
          order: 5,
        },
      ];

      return c.json({
        setId,
        questions: defaultQuestions,
      });
    }

    return c.json({
      setId,
      questions: selectedQuestions.map((q, index) => ({
        id: q.id,
        question: q.question,
        order: index + 1,
        category: q.category,
      })),
    });
  } catch (error) {
    console.error('Error creating interview set:', error);
    return c.json({ error: 'Failed to create interview set' }, 500);
  }
});

// 답변 제출 및 꼬리질문 생성 (스트리밍)
app.post('/answers', zValidator('json', submitAnswerSchema), async (c) => {
  const {
    setId,
    questionId,
    questionOrder,
    userAnswer,
    enableFollowUp,
    aiModel,
  } = c.req.valid('json');

  try {
    // 질문 조회 (기본 질문인 경우 ID가 없을 수 있음)
    const question = await db
      .select()
      .from(questions)
      .where(eq(questions.id, questionId))
      .get();

    // 질문이 없어도 계속 진행 (기본 질문 사용 시)
    let followUpQuestion = null;

    // 꼬리질문 생성 (활성화된 경우)
    if (enableFollowUp) {
      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const modelToUse = aiModel || 'google/gemini-2.5-flash-preview-09-2025';

      const prompt = question
        ? `당신은 한국 기업의 면접관입니다. 지원자의 답변을 듣고 압박 꼬리질문을 생성하세요.

원래 질문: ${question.question}
지원자 답변: ${userAnswer}

지원자의 답변에서 핵심 키워드를 파악하고, 그 내용을 더 깊이 파고들거나 구체적인 근거를 요구하는 압박 꼬리질문 1개를 생성하세요.
질문은 자연스럽고 실전 면접처럼 만들어주세요.

JSON 형식으로 응답:
{
  "followUpQuestion": "<꼬리질문>"
}`
        : `당신은 한국 기업의 면접관입니다. 지원자의 답변을 듣고 압박 꼬리질문을 생성하세요.

지원자 답변: ${userAnswer}

지원자의 답변에서 핵심 키워드를 파악하고, 그 내용을 더 깊이 파고들거나 구체적인 근거를 요구하는 압박 꼬리질문 1개를 생성하세요.
질문은 자연스럽고 실전 면접처럼 만들어주세요.

JSON 형식으로 응답:
{
  "followUpQuestion": "<꼬리질문>"
}`;

      const completion = await openai.chat.completions.create({
        model: modelToUse,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      followUpQuestion = parsed.followUpQuestion;
    }

    // 답변 저장
    const answerResult = await db
      .insert(interviewAnswers)
      .values({
        setId,
        questionId,
        questionOrder,
        userAnswer,
        followUpQuestion,
      })
      .returning();

    return c.json({
      answerId: answerResult[0]?.id || 0,
      followUpQuestion,
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return c.json({ error: 'Failed to submit answer' }, 500);
  }
});

// 꼬리질문 답변 제출 (스트리밍)
app.post(
  '/follow-up-answers',
  zValidator('json', submitFollowUpSchema),
  async (c) => {
    const { answerId, followUpAnswer } = c.req.valid('json');

    try {
      await db
        .update(interviewAnswers)
        .set({ followUpAnswer })
        .where(eq(interviewAnswers.id, answerId));

      return c.json({ success: true });
    } catch (error) {
      console.error('Error submitting follow-up answer:', error);
      return c.json({ error: 'Failed to submit follow-up answer' }, 500);
    }
  }
);

// 면접 완료 및 평가 생성 (스트리밍)
app.post('/sets/:id/complete', async (c) => {
  const setId = parseInt(c.req.param('id'));

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        data: JSON.stringify({ type: 'status', message: '면접 평가 시작...' }),
      });

      // 모든 답변 조회
      const answers = await db
        .select()
        .from(interviewAnswers)
        .where(eq(interviewAnswers.setId, setId))
        .orderBy(interviewAnswers.questionOrder);

      if (answers.length === 0) {
        await stream.writeSSE({
          data: JSON.stringify({ type: 'error', message: '답변이 없습니다.' }),
        });
        return;
      }

      // 질문 정보 조회
      const questionIds = answers.map((a) => a.questionId);
      const questionData = await db
        .select()
        .from(questions)
        .where(inArray(questions.id, questionIds));

      const questionMap = new Map(questionData.map((q) => [q.id, q]));

      // AI 평가 요청
      const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const evaluationPrompt = `당신은 한국 기업의 인사담당자입니다. 외국인 지원자의 면접 답변을 종합 평가하세요.

면접 답변:
${answers
  .map((a, i) => {
    const q = questionMap.get(a.questionId);
    return `
질문 ${i + 1}: ${q?.question}
답변: ${a.userAnswer}
${a.followUpQuestion ? `꼬리질문: ${a.followUpQuestion}\n꼬리답변: ${a.followUpAnswer || '(답변 없음)'}` : ''}
`;
  })
  .join('\n')}

다음 5가지 항목을 0-100점으로 평가하고, 종합 피드백을 제공하세요:
1. logic (논리성): 답변의 논리적 구조와 일관성
2. evidence (근거): 구체적인 사례와 근거 제시
3. jobUnderstanding (직무이해도): 지원 직무에 대한 이해도
4. formality (한국어 격식): 비즈니스 한국어 사용 적절성
5. completeness (완성도): 답변의 완성도와 충실성

각 답변에 대한 상세 피드백도 제공하세요.

JSON 형식으로 응답:
{
  "logic": <점수>,
  "evidence": <점수>,
  "jobUnderstanding": <점수>,
  "formality": <점수>,
  "completeness": <점수>,
  "overallFeedback": "<전체 종합 피드백>",
  "detailedFeedback": [
    {
      "questionOrder": 1,
      "feedback": "<질문 1에 대한 상세 피드백>",
      "improvements": "<개선 제안>"
    }
  ]
}`;

      await stream.writeSSE({
        data: JSON.stringify({ type: 'status', message: 'AI 평가 진행 중...' }),
      });

      const completion = await openai.chat.completions.create({
        model: 'google/gemini-2.5-flash-preview-09-2025',
        messages: [{ role: 'user', content: evaluationPrompt }],
        temperature: 0.7,
        max_tokens: 3000,
        stream: true,
      });

      let fullResponse = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          await stream.writeSSE({
            data: JSON.stringify({ type: 'chunk', content }),
          });
        }
      }

      // JSON 파싱
      const cleaned = fullResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      const evaluation = JSON.parse(cleaned);

      // 평가 저장
      const evalResult = await db
        .insert(interviewEvaluations)
        .values({
          setId,
          logic: evaluation.logic || 0,
          evidence: evaluation.evidence || 0,
          jobUnderstanding: evaluation.jobUnderstanding || 0,
          formality: evaluation.formality || 0,
          completeness: evaluation.completeness || 0,
          overallFeedback: evaluation.overallFeedback || '',
          detailedFeedback: JSON.stringify(evaluation.detailedFeedback || []),
        })
        .returning();

      // 면접 세트 완료 처리
      await db
        .update(interviewSets)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(interviewSets.id, setId));

      await stream.writeSSE({
        data: JSON.stringify({
          type: 'complete',
          evaluationId: evalResult[0]?.id || 0,
          evaluation,
        }),
      });
    } catch (error) {
      console.error('Error completing interview:', error);
      await stream.writeSSE({
        data: JSON.stringify({
          type: 'error',
          message: '평가 생성에 실패했습니다.',
        }),
      });
    }
  });
});

// 면접 세트 조회
app.get('/sets/:id', async (c) => {
  const setId = parseInt(c.req.param('id'));

  try {
    const set = await db
      .select()
      .from(interviewSets)
      .where(eq(interviewSets.id, setId))
      .get();

    if (!set) {
      return c.json({ error: 'Interview set not found' }, 404);
    }

    const answers = await db
      .select()
      .from(interviewAnswers)
      .where(eq(interviewAnswers.setId, setId))
      .orderBy(interviewAnswers.questionOrder);

    // 각 답변에 질문 정보 추가
    const answersWithQuestions = await Promise.all(
      answers.map(async (answer) => {
        const question = await db
          .select()
          .from(questions)
          .where(eq(questions.id, answer.questionId))
          .get();
        return {
          ...answer,
          question,
        };
      })
    );

    const evaluation = await db
      .select()
      .from(interviewEvaluations)
      .where(eq(interviewEvaluations.setId, setId))
      .get();

    return c.json({
      set,
      answers: answersWithQuestions,
      evaluation: evaluation
        ? {
            ...evaluation,
            detailedFeedback: JSON.parse(evaluation.detailedFeedback),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching interview set:', error);
    return c.json({ error: 'Failed to fetch interview set' }, 500);
  }
});

// 면접 세트 목록
app.get('/sets', async (c) => {
  try {
    const sets = await db
      .select()
      .from(interviewSets)
      .orderBy(desc(interviewSets.createdAt));

    return c.json(sets);
  } catch (error) {
    console.error('Error fetching interview sets:', error);
    return c.json({ error: 'Failed to fetch interview sets' }, 500);
  }
});

// Helper function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp!;
  }
  return shuffled;
}

export default app;

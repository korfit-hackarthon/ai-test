import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import db from '../db/drizzle';
import { answerNotes } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const app = new Hono();

const createNoteSchema = z.object({
  questionId: z.number(),
  initialAnswer: z.string().min(1),
  firstFeedback: z.string().optional(),
  secondFeedback: z.string().optional(),
  finalAnswer: z.string().optional(),
});

const updateNoteSchema = z.object({
  firstFeedback: z.string().optional(),
  secondFeedback: z.string().optional(),
  finalAnswer: z.string().optional(),
});

// 답변 노트 목록 조회
app.get('/', async (c) => {
  try {
    const notes = await db
      .select()
      .from(answerNotes)
      .orderBy(desc(answerNotes.updatedAt));

    return c.json(notes);
  } catch (error) {
    console.error('Error fetching answer notes:', error);
    return c.json({ error: 'Failed to fetch answer notes' }, 500);
  }
});

// 답변 노트 생성
app.post('/', zValidator('json', createNoteSchema), async (c) => {
  const data = c.req.valid('json');

  try {
    const result = await db
      .insert(answerNotes)
      .values({
        questionId: data.questionId,
        initialAnswer: data.initialAnswer,
        firstFeedback: data.firstFeedback || null,
        secondFeedback: data.secondFeedback || null,
        finalAnswer: data.finalAnswer || null,
      })
      .returning();

    return c.json(result[0], 201);
  } catch (error) {
    console.error('Error creating answer note:', error);
    return c.json({ error: 'Failed to create answer note' }, 500);
  }
});

// 답변 노트 수정
app.put('/:id', zValidator('json', updateNoteSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');

  try {
    const result = await db
      .update(answerNotes)
      .set({
        firstFeedback: data.firstFeedback,
        secondFeedback: data.secondFeedback,
        finalAnswer: data.finalAnswer,
        updatedAt: new Date(),
      })
      .where(eq(answerNotes.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Answer note not found' }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error('Error updating answer note:', error);
    return c.json({ error: 'Failed to update answer note' }, 500);
  }
});

// 답변 노트 삭제
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  try {
    const result = await db
      .delete(answerNotes)
      .where(eq(answerNotes.id, id))
      .returning();

    if (result.length === 0) {
      return c.json({ error: 'Answer note not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting answer note:', error);
    return c.json({ error: 'Failed to delete answer note' }, 500);
  }
});

export default app;


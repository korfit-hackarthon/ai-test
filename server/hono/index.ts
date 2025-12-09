import { Hono } from 'hono';
import { cors } from 'hono/cors';
import questionsRouter from '../routers/questions';
import interviewRouter from '../routers/interview';
import answerNotesRouter from '../routers/answer-notes';
import autoRecruitRouter from '../routers/auto-recruit';

const app = new Hono().basePath('/api');

app.use('*', cors());

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    production: process.env.NODE_ENV === 'production',
  });
});

app.route('/questions', questionsRouter);
app.route('/interview', interviewRouter);
app.route('/answer-notes', answerNotesRouter);
app.route('/auto-recruit', autoRecruitRouter);

export default app;

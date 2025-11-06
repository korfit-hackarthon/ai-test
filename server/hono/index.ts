import { Hono } from 'hono';
import { cors } from 'hono/cors';
import questionsRouter from '../routers/questions';

const app = new Hono().basePath('/api');

app.use('*', cors());

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    production: process.env.NODE_ENV === 'production',
  });
});

app.route('/questions', questionsRouter);

export default app;

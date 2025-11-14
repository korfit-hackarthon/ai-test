import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer(),
});

// 질문 카테고리 (공통/직무/외국인특화)
export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  category: text('category').notNull(), // 'common', 'job', 'foreigner'
  jobType: text('job_type'), // 'marketing', 'sales', 'it'
  level: text('level'), // 'intern', 'entry'
  modelAnswer: text('model_answer').notNull(),
  reasoning: text('reasoning').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

// 면접 세트
export const interviewSets = sqliteTable('interview_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobType: text('job_type').notNull(), // 'marketing', 'sales', 'it'
  level: text('level').notNull(), // 'intern', 'entry'
  status: text('status').notNull(), // 'in_progress', 'completed'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// 면접 답변 (꼬리질문 포함)
export const interviewAnswers = sqliteTable('interview_answers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setId: integer('set_id')
    .notNull()
    .references(() => interviewSets.id),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  questionOrder: integer('question_order').notNull(),
  userAnswer: text('user_answer').notNull(),
  followUpQuestion: text('follow_up_question'), // 꼬리질문
  followUpAnswer: text('follow_up_answer'), // 꼬리질문 답변
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

// 면접 평가 결과
export const interviewEvaluations = sqliteTable('interview_evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setId: integer('set_id')
    .notNull()
    .references(() => interviewSets.id),
  logic: integer('logic').notNull(), // 논리성 점수 (0-100)
  evidence: integer('evidence').notNull(), // 근거 점수
  jobUnderstanding: integer('job_understanding').notNull(), // 직무이해도
  formality: integer('formality').notNull(), // 한국어 격식
  completeness: integer('completeness').notNull(), // 완성도
  overallFeedback: text('overall_feedback').notNull(),
  detailedFeedback: text('detailed_feedback').notNull(), // JSON 형식
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

// 답변 노트 (유저가 저장한 최종 답변)
export const answerNotes = sqliteTable('answer_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  initialAnswer: text('initial_answer').notNull(),
  firstFeedback: text('first_feedback'),
  secondFeedback: text('second_feedback'),
  finalAnswer: text('final_answer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

export const qaHistory = sqliteTable('qa_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  userAnswer: text('user_answer').notNull(),
  aiModel: text('ai_model').notNull(),
  aiResponse: text('ai_response').notNull(),
  score: integer('score').notNull(),
  hints: text('hints').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(
    () => new Date()
  ),
});

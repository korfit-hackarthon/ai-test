import { Database } from 'bun:sqlite';

const dbPath = '/app/data/database.db';

try {
  const db = new Database(dbPath);

  // 모든 테이블 확인
  const tables = db
    .query("SELECT name FROM sqlite_master WHERE type='table'")
    .all();

  console.log(
    'Found tables:',
    tables.map((t) => t.name)
  );

  // questions 테이블이 있는지 확인
  const hasQuestionsTable = tables.some((t) => t.name === 'questions');

  if (!hasQuestionsTable) {
    console.log('Questions table missing - migration may have failed');
    process.exit(1); // 마이그레이션 실패
  }

  // questions 개수 확인
  const result = db.query('SELECT COUNT(*) as count FROM questions').get();
  const count = result?.count || 0;

  console.log(`Questions count: ${count}`);

  if (count === 0) {
    console.log('Database is empty, will run seed');
    process.exit(0); // 시드 실행 필요
  } else {
    console.log(`Database already has ${count} questions, skipping seed`);
    process.exit(1); // 시드 실행 불필요
  }
} catch (error) {
  console.log('Database check failed:', error.message);
  process.exit(1); // 마이그레이션 실패로 간주
}

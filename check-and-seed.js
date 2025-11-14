import { Database } from 'bun:sqlite';

const dbPath = '/app/data/database.db';

try {
  const db = new Database(dbPath);

  // questions 테이블이 있는지 확인
  const tables = db
    .query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='questions'"
    )
    .get();
  if (!tables) {
    console.log('Database not initialized, will run seed');
    process.exit(0); // 시드 실행 필요
  }

  // questions 개수 확인
  const result = db.query('SELECT COUNT(*) as count FROM questions').get();
  const count = result?.count || 0;

  if (count === 0) {
    console.log('Database is empty, will run seed');
    process.exit(0); // 시드 실행 필요
  } else {
    console.log(`Database already has ${count} questions, skipping seed`);
    process.exit(1); // 시드 실행 불필요
  }
} catch (error) {
  console.log('Database check failed, will run seed:', error.message);
  process.exit(0); // 시드 실행 필요
}

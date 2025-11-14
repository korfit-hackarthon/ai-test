import { Database } from 'bun:sqlite';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const isDev = process.env.NODE_ENV !== 'production';
const dbPath = isDev ? './database.db' : '/app/data/database.db';

const db = new Database(dbPath);

async function migrate() {
  console.log('🚀 마이그레이션 시작...');
  console.log(`📁 데이터베이스 경로: ${dbPath}`);

  const migrationsDir = join(import.meta.dir, 'migrations');
  const files = await readdir(migrationsDir);

  const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    console.log(`📝 실행 중: ${file}`);
    const filePath = join(migrationsDir, file);
    const sql = await Bun.file(filePath).text();

    // statement-breakpoint로 분리된 각 SQL 문을 실행
    const statements = sql.split('--> statement-breakpoint');

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          console.log(`🔧 실행: ${trimmed.substring(0, 50)}...`);
          db.exec(trimmed);
          console.log(`✅ SQL 실행 성공`);
        } catch (error) {
          console.log(
            `⚠️  ${file}의 문장 건너뛰기 (이미 존재할 수 있음):`,
            error
          );
        }
      }
    }
  }

  console.log('✅ 마이그레이션 완료!');
  db.close();
}

migrate().catch(console.error);

import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import * as schema from './schema';

const isDev = process.env.NODE_ENV !== 'production';
const dbPath = isDev ? './database.db' : '/app/data/database.db';

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

export default db;

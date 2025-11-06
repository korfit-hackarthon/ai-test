import { defineConfig } from 'drizzle-kit';

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema',
  out: './server/db/migrations',
  dbCredentials: {
    url: isDev ? './database.db' : '/app/data/database.db',
  },
});

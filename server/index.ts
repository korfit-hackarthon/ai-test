import { serve } from 'bun';
import index from '../public/index.html';
import { handler } from './orpc/init';
import app from './hono';

const server = serve({
  hostname: '0.0.0.0',
  port: 8000,
  idleTimeout: 255,

  routes: {
    '/*': index,
    '/rpc/*': async (req) => {
      const { matched, response } = await handler.handle(req, {
        prefix: '/rpc',
      });

      if (matched) {
        return response;
      }

      return new Response('Not found', { status: 404 });
    },
    '/api/*': async (req) => {
      const response = await app.fetch(req);
      return response;
    },

    '/health': () => {
      return new Response(
        '{"status": "ok", "production": ' +
          (process.env.NODE_ENV === 'production' ? 'true' : 'false') +
          '}',
        { status: 200 }
      );
    },
    '/public/*': async (req) => {
      let path = new URL(req.url).pathname;
      path = path.replace('/public', 'public');
      return new Response(Bun.file(`${path}`));
    },
  },

  development: process.env.NODE_ENV !== 'production' && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);

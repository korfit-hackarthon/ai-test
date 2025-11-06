import { ORPCError } from '@orpc/server';
import { verifyCredentials } from '../lib/auth';
import { getCookie } from '@orpc/server/helpers';
import { base } from '../context/base';
import { redis } from 'bun';


export const requireAuth = base.middleware(async ({ context, next }) => {
  const sessionId = getCookie(context.reqHeaders!, 'session');
  if (!sessionId) {
    throw new ORPCError('UNAUTHORIZED');
  }

  const session = await redis.get(`session:${sessionId}`);

  if (!session) {
    throw new ORPCError('UNAUTHORIZED');
  }

  return next({
    context: {
      session: JSON.parse(session),
    },
  });
});

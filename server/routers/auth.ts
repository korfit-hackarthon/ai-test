import { ORPCError } from '@orpc/server';
import { verifyCredentials } from 'server/lib/auth';
import { pub } from 'server/orpc/procedure';
import { z } from 'zod';
import { getCookie, setCookie } from '@orpc/server/helpers';
import { redis } from 'bun';

const login = pub
  .input(
    z.object({
      username: z.string().min(1, 'Username is required'),
      password: z.string().min(1, 'Password is required'),
    })
  )
  .handler(async ({ input, context }) => {
    const { username, password } = input;

    if (!verifyCredentials(username, password)) {
      throw new ORPCError('INVALID_CREDENTIALS');
    }

    const sessionId = crypto.randomUUID();

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({ role: 'admin', username })
    );
    await redis.expire(`session:${sessionId}`, 60 * 60 * 24 * 30);

    setCookie(context.resHeaders!, 'session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30,
    });
  });

const logout = pub.handler(async ({ context }) => {
  const sessionId = getCookie(context.reqHeaders!, 'session');

  if (!sessionId) {
    throw new ORPCError('UNAUTHORIZED');
  }

  await redis.del(`session:${sessionId}`);

  setCookie(context.resHeaders!, 'session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });
});

const getSession = pub
  .output(
    z.null().or(
      z.object({
        role: z.string(),
        username: z.string(),
      })
    )
  )
  .handler(async ({ context }) => {
    const sessionId = getCookie(context.reqHeaders!, 'session');

    if (!sessionId) {
      return null;
    }

    const session = await redis.get(`session:${sessionId}`);

    if (!session) {
      return null;
    }

    return JSON.parse(session);
  });

export const router = {
  login,
  logout,
  getSession,
};

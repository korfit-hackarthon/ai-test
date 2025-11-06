import type { RouterClient } from '@orpc/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { routers } from 'server/routers/index';

const link = new RPCLink({
  url: new URL('/rpc', window.location.origin).toString(),
});

export const orpc: RouterClient<typeof routers> = createORPCClient(link);

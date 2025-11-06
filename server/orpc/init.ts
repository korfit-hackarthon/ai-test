import { onError } from '@orpc/client';
import { RPCHandler } from '@orpc/server/fetch';
import {
  CORSPlugin,
  RequestHeadersPlugin,
  ResponseHeadersPlugin,
} from '@orpc/server/plugins';
import { routers } from 'server/routers';

export const handler = new RPCHandler(routers, {
  plugins: [
    new CORSPlugin(),
    new RequestHeadersPlugin(),
    new ResponseHeadersPlugin(),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

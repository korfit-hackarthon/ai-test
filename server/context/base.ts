import { os } from '@orpc/server';
import {
  type RequestHeadersPluginContext,
  type ResponseHeadersPluginContext,
} from '@orpc/server/plugins';

export type ORPCContext = RequestHeadersPluginContext &
  ResponseHeadersPluginContext;

export const base = os.$context<ORPCContext>();

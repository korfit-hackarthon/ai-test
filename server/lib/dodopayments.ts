import { redis } from 'bun';
import DodoPayments from 'dodopayments';

console.log('DODO_PAYMENTS_API_KEY:', Bun.env.DODO_PAYMENTS_API_KEY);

export const dodoPayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: 'test_mode',
});

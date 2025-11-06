import { requireAuth } from "server/middlewares/auth";
import { base } from "server/context/base";

export const pub = base

export const authed = base.use(requireAuth)
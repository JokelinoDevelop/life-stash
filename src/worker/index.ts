import { app } from "./app";
import type { Bindings } from "./core/env";
import { runFinancesSweep } from "./modules/finances/finances.cron";
import { runDailySweep } from "./modules/garage/cron";

export default {
  fetch: app.fetch,
  scheduled: (_controller, env, ctx) => {
    ctx.waitUntil(Promise.all([runDailySweep(env), runFinancesSweep(env)]));
  },
} satisfies ExportedHandler<Bindings>;

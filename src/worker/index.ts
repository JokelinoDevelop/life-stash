import { app } from "./app";
import type { Bindings } from "./core/env";
import { runDailySweep } from "./modules/garage/cron";

export default {
  fetch: app.fetch,
  scheduled: (_controller, env, ctx) => {
    ctx.waitUntil(runDailySweep(env));
  },
} satisfies ExportedHandler<Bindings>;

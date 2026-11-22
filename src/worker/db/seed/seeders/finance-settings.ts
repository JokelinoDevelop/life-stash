import { financeSettings } from "../../schema/finances";
import type { SeedContext } from "../context";
import { EXCHANGE_RATES } from "../fixtures/finances";
import type { Seeder } from "../seeder";

/** Finance defaults with exchange rates, so headline totals show in one currency. */
export const financeSettingsSeeder: Seeder = {
  name: "finance settings",
  run: async (ctx: SeedContext) => {
    await ctx.db.insert(financeSettings).values({
      exchangeRates: {
        base: EXCHANGE_RATES.base,
        rates: { ...EXCHANGE_RATES.rates },
      },
      householdId: ctx.householdId,
    });

    return { rates: Object.keys(EXCHANGE_RATES.rates).length };
  },
};

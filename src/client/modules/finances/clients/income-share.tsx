import type { Currency, MoneyTotal } from "@shared/domain/money";
import { useTranslation } from "react-i18next";

import { Panel } from "@/components/app/list-section";

import type { ClientListItem } from "./clients.queries";

const SHADES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
] as const;

const amountIn = (totals: readonly MoneyTotal[], currency: Currency) =>
  totals.find((total) => total.currency === currency)?.amountMinor ?? 0;

/** The currency most clients paid in (amounts are never converted); ties go to `preferred`. */
const shareCurrency = (
  clients: readonly ClientListItem[],
  preferred: Currency
): Currency => {
  const counts = new Map<Currency, number>();

  for (const total of clients.flatMap((client) => client.earnedThisYear)) {
    counts.set(total.currency, (counts.get(total.currency) ?? 0) + 1);
  }

  let best = preferred;

  for (const [currency, count] of counts) {
    if (count > (counts.get(best) ?? 0)) {
      best = currency;
    }
  }

  return best;
};

/** "Share of income": one stacked bar of this year's income per client, in one currency. */
export const IncomeShare = ({
  clients,
  preferred,
  year,
}: {
  clients: readonly ClientListItem[];
  preferred: Currency;
  year: number;
}) => {
  const { t } = useTranslation("finances");
  const currency = shareCurrency(clients, preferred);

  const shares: { amount: number; client: ClientListItem }[] = [];

  for (const client of clients) {
    const amount = amountIn(client.earnedThisYear, currency);

    if (amount > 0) {
      shares.push({ amount, client });
    }
  }

  shares.sort((a, b) => b.amount - a.amount);

  const total = shares.reduce((sum, share) => sum + share.amount, 0);

  if (total === 0) {
    return null;
  }

  const percent = (amount: number) => Math.round((amount / total) * 100);

  const label = shares
    .map((share) => `${share.client.name} ${percent(share.amount)}%`)
    .join(", ");

  return (
    <Panel title={t("clients.shareOfIncome", { year })}>
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className="flex h-2 gap-0.5 overflow-hidden rounded-full"
      >
        {shares.map((share, index) => (
          <span
            className={`grow-(--grow) ${SHADES[index % SHADES.length]}`}
            key={share.client.id}
            style={{ "--grow": share.amount }}
          />
        ))}
      </div>
      <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
        {shares.map((share, index) => (
          <li className="flex items-center gap-1.5" key={share.client.id}>
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${SHADES[index % SHADES.length]}`}
            />
            <span className="text-foreground">{share.client.name}</span>
            {percent(share.amount)}%
          </li>
        ))}
      </ul>
    </Panel>
  );
};

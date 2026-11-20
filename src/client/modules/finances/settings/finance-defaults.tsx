import {
  INVOICE_NUMBER_FORMATS,
  formatInvoiceNumber,
} from "@shared/domain/finances/invoices";
import type { InvoiceNumberFormat } from "@shared/domain/finances/invoices";
import { CURRENCIES } from "@shared/domain/money";
import type { Currency } from "@shared/domain/money";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ErrorState, LoadingState } from "@/components/app/states";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api, unwrap } from "@/lib/api";
import { useErrorMessage } from "@/lib/errors";
import { todayIso } from "@/lib/partial-date";
import { queryKeys } from "@/lib/query-keys";
import { usePreferences } from "@/lib/session";
import { SettingsSection } from "@/modules/settings/settings-section";

import {
  financeSettingsQuery,
  useUpdateFinanceSettings,
} from "./finance-settings.queries";

const TERMS = [0, 7, 14, 15, 30, 45, 60, 90] as const;

const isFormat = (value: string): value is InvoiceNumberFormat =>
  INVOICE_NUMBER_FORMATS.some((format) => format === value);

const isCurrency = (value: string): value is Currency =>
  CURRENCIES.some((code) => code === value);

const Row = ({
  children,
  id,
  label,
}: {
  children: React.ReactNode;
  id: string;
  label: string;
}) => (
  <div className="flex min-h-12 items-center justify-between gap-4 px-3 md:min-h-11">
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);

/** The main currency lives in user preferences; this saves it there (one toast). */
const useSaveCurrency = () => {
  const { t } = useTranslation("finances");
  const queryClient = useQueryClient();
  const errorMessage = useErrorMessage();

  const preferences = usePreferences();

  return useMutation({
    mutationFn: async (currency: Currency) => {
      if (preferences.data === undefined) {
        throw new Error("Preferences are not loaded yet");
      }

      return await unwrap(
        api.settings.preferences.$put({
          json: { ...preferences.data, currency },
        })
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.preferences });
      toast.success(t("defaults.saved"));
    },
  });
};

/** Settings › Finances › Defaults (4.1). */
export const FinanceDefaults = () => {
  const { t } = useTranslation("finances");
  const settings = useQuery(financeSettingsQuery);
  const preferences = usePreferences();
  const update = useUpdateFinanceSettings();
  const saveCurrency = useSaveCurrency();
  const year = Number(todayIso().slice(0, 4));

  let body: React.ReactNode = <LoadingState rows={4} variant="rows" />;

  if (settings.isError) {
    body = (
      <ErrorState
        className="m-3 md:m-3"
        error={settings.error}
        onRetry={() => {
          void settings.refetch();
        }}
      />
    );
  } else if (settings.data !== undefined) {
    const { data } = settings;

    const terms = [
      ...new Set([...TERMS, data.defaultPaymentTermsDays]),
    ].toSorted((a, b) => a - b);

    body = (
      <div className="divide-divider divide-y">
        <Row id="main-currency" label={t("defaults.currency")}>
          <Select
            onValueChange={(value) => {
              if (value !== null && isCurrency(value)) {
                saveCurrency.mutate(value);
              }
            }}
            value={preferences.data?.currency ?? null}
          >
            <SelectTrigger id="main-currency" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row id="payment-terms" label={t("defaults.terms")}>
          <Select
            items={terms.map((days) => ({
              label: t("defaults.termsDays", { count: days }),
              value: String(days),
            }))}
            onValueChange={(value) => {
              if (value !== null) {
                update.mutate({ defaultPaymentTermsDays: Number(value) });
              }
            }}
            value={String(data.defaultPaymentTermsDays)}
          >
            <SelectTrigger id="payment-terms" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {terms.map((days) => (
                <SelectItem key={days} value={String(days)}>
                  {t("defaults.termsDays", { count: days })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row id="invoice-numbers" label={t("defaults.numbers")}>
          <Select
            items={INVOICE_NUMBER_FORMATS.map((format) => ({
              label: formatInvoiceNumber(year, 1, format),
              value: format,
            }))}
            onValueChange={(value) => {
              if (value !== null && isFormat(value)) {
                update.mutate({ invoiceNumberFormat: value });
              }
            }}
            value={data.invoiceNumberFormat}
          >
            <SelectTrigger id="invoice-numbers" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVOICE_NUMBER_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {formatInvoiceNumber(year, 1, format)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row id="overdue-reminders" label={t("defaults.overdue")}>
          <Switch
            checked={data.overdueReminders}
            id="overdue-reminders"
            onCheckedChange={(checked) => {
              update.mutate({ overdueReminders: checked });
            }}
          />
        </Row>
      </div>
    );
  }

  return (
    <SettingsSection
      description={t("defaults.description")}
      flush
      title={t("defaults.title")}
    >
      {body}
    </SettingsSection>
  );
};

import { REMINDER_KINDS } from "@shared/domain/garage-kinds";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAppForm } from "@/components/form/form-hook";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { useFormat } from "@/lib/format";

import {
  catalogItemsQuery,
  catalogPackagesQuery,
} from "../../../catalog/catalog.queries";
import { itemTarget, packageTarget } from "./mapper";
import { reminderFormSchema } from "./schema";
import type { ReminderFormValues } from "./schema";

const useTargetOptions = () => {
  const { t } = useTranslation("garageReminders");
  const items = useQuery(catalogItemsQuery(false));
  const packages = useQuery(catalogPackagesQuery);

  return [
    { label: t("form.targetNone"), name: "", value: "none" },
    ...(packages.data?.packages ?? []).map((pkg) => ({
      label: `${t("form.packages")}: ${pkg.name}`,
      name: pkg.name,
      value: packageTarget(pkg.id),
    })),
    ...(items.data?.items ?? []).map((item) => ({
      label: `${t("form.items")}: ${item.name}`,
      name: item.name,
      value: itemTarget(item.id),
    })),
  ];
};

const useReminderForm = (
  defaultValues: ReminderFormValues,
  onSubmit: (values: ReminderFormValues) => Promise<void>
) =>
  useAppForm({
    defaultValues: {
      ...defaultValues,
      target: defaultValues.target === "" ? "none" : defaultValues.target,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        target: value.target === "none" ? "" : value.target,
      });
    },
    validators: { onSubmit: reminderFormSchema },
  });

type ReminderFormApi = ReturnType<typeof useReminderForm>;

const DueCard = ({ form }: { form: ReminderFormApi }) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.due")}</CardTitle>
        <CardDescription>{t("form.dueHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <form.AppField name="dueDate">
            {(field) => (
              <field.TextField label={t("form.dueDate")} optional type="date" />
            )}
          </form.AppField>
          <form.AppField name="dueOdometer">
            {(field) => (
              <field.TextField
                inputMode="numeric"
                label={t("form.dueOdometer")}
                optional
                suffix={tc(`units.${unit}`)}
              />
            )}
          </form.AppField>
        </div>
      </CardContent>
    </Card>
  );
};

const RecurringCard = ({ form }: { form: ReminderFormApi }) => {
  const { t } = useTranslation("garageReminders");
  const { t: tc } = useTranslation();
  const { unit } = useFormat();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("form.recurring")}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <form.AppField name="intervalMonths">
              {(field) => (
                <field.TextField
                  inputMode="numeric"
                  label={t("form.intervalMonths")}
                  optional
                />
              )}
            </form.AppField>
            <form.AppField name="intervalKm">
              {(field) => (
                <field.TextField
                  inputMode="numeric"
                  label={t("form.intervalKm")}
                  optional
                  suffix={tc(`units.${unit}`)}
                />
              )}
            </form.AppField>
          </div>
          <form.AppField name="notes">
            {(field) => (
              <field.TextareaField label={tc("fields.notes")} optional />
            )}
          </form.AppField>
        </FieldGroup>
      </CardContent>
    </Card>
  );
};

export const ReminderForm = ({
  defaultValues,
  onSubmit,
}: {
  defaultValues: ReminderFormValues;
  onSubmit: (values: ReminderFormValues) => Promise<void>;
}) => {
  const { t } = useTranslation("garageReminders");
  const targets = useTargetOptions();
  const autoTitles = new Set(targets.map((target) => target.name));

  const form = useReminderForm(defaultValues, onSubmit);

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <Card>
        <CardContent>
          <FieldGroup>
            <form.AppField name="kind">
              {(field) => (
                <field.SelectField
                  label={t("form.kind")}
                  options={REMINDER_KINDS.map((kind) => ({
                    label: t(`kinds.${kind}`),
                    value: kind,
                  }))}
                />
              )}
            </form.AppField>
            <form.Subscribe selector={(state) => state.values.kind}>
              {(kind) =>
                kind === "service" && (
                  <form.AppField
                    listeners={{
                      onChange: ({ value }) => {
                        const title = form.getFieldValue("title").trim();

                        const name =
                          targets.find((target) => target.value === value)
                            ?.name ?? "";

                        if (
                          name !== "" &&
                          (title === "" || autoTitles.has(title))
                        ) {
                          form.setFieldValue("title", name);
                        }
                      },
                    }}
                    name="target"
                  >
                    {(field) => (
                      <field.SelectField
                        label={t("form.target")}
                        optional
                        options={targets}
                      />
                    )}
                  </form.AppField>
                )
              }
            </form.Subscribe>
            <form.AppField name="title">
              {(field) => (
                <field.TextField
                  label={t("form.title")}
                  placeholder={t("form.titlePlaceholder")}
                />
              )}
            </form.AppField>
          </FieldGroup>
        </CardContent>
      </Card>
      <DueCard form={form} />
      <RecurringCard form={form} />
      <form.AppForm>
        <form.SubmitButton className="self-end" />
      </form.AppForm>
    </form>
  );
};

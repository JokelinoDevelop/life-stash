import { useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FieldErrors } from "@/components/form/field-errors";
import { Button } from "@/components/ui/button";

import {
  catalogItemsQuery,
  catalogPackagesQuery,
} from "../../../catalog/catalog.queries";
import { ItemPicker } from "./item-picker";
import { newVisitItem } from "./mapper";
import type { VisitFormItem } from "./schema";
import type { VisitFormApi } from "./use-visit-form";

const ItemRow = ({
  form,
  index,
  currency,
}: {
  form: VisitFormApi;
  index: number;
  currency: string;
}) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();

  return (
    <li className="flex items-start gap-2 py-2">
      <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_10rem]">
        <form.Subscribe
          selector={(state) => state.values.items[index]?.itemId ?? ""}
        >
          {(itemId) =>
            itemId === "" ? (
              <form.AppField name={`items[${index}].label`}>
                {(field) => <field.TextField label={t("form.customLabel")} />}
              </form.AppField>
            ) : (
              <form.Subscribe
                selector={(state) => state.values.items[index]?.label ?? ""}
              >
                {(label) => <p className="pt-1 font-medium sm:pt-8">{label}</p>}
              </form.Subscribe>
            )
          }
        </form.Subscribe>
        <form.AppField name={`items[${index}].cost`}>
          {(field) => (
            <field.TextField
              inputMode="decimal"
              label={t("form.itemCost")}
              optional
              suffix={currency}
            />
          )}
        </form.AppField>
      </div>
      <div className="pt-6">
        <form.Field mode="array" name="items">
          {(field) => (
            <Button
              aria-label={tc("actions.remove")}
              onClick={() => {
                field.removeValue(index);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          )}
        </form.Field>
      </div>
    </li>
  );
};

/** The "work done" list: rows from packages, catalog items or custom labels. */
export const ItemsEditor = ({ form }: { form: VisitFormApi }) => {
  const { t } = useTranslation("garageVisits");
  const items = useQuery(catalogItemsQuery(false));
  const packages = useQuery(catalogPackagesQuery);

  const names = new Map(
    (items.data?.items ?? []).map((item) => [item.id, item.name])
  );

  const itemOptions = (items.data?.items ?? []).map((item) => ({
    id: item.id,
    label: item.name,
  }));

  const packageOptions = (packages.data?.packages ?? []).map((pkg) => ({
    hint: pkg.itemIds.flatMap((id) => names.get(id) ?? []).join(", "),
    id: pkg.id,
    label: pkg.name,
  }));

  return (
    <form.Field mode="array" name="items">
      {(field) => {
        const present = new Set(field.state.value.map((item) => item.itemId));

        const add = (entries: VisitFormItem[]) => {
          for (const entry of entries) {
            field.pushValue(entry);
          }
        };

        const addPackage = (packageId: string) => {
          const pkg = packages.data?.packages.find(
            (candidate) => candidate.id === packageId
          );

          add(
            (pkg?.itemIds ?? []).flatMap((id) =>
              present.has(id)
                ? []
                : [newVisitItem({ itemId: id, label: names.get(id) ?? "" })]
            )
          );
        };

        return (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("form.items")}
            </legend>
            <form.Subscribe selector={(state) => state.values.currency}>
              {(currency) => (
                <ul className="flex flex-col divide-y">
                  {field.state.value.map((item, index) => (
                    <ItemRow
                      currency={currency}
                      form={form}
                      index={index}
                      key={item.key}
                    />
                  ))}
                </ul>
              )}
            </form.Subscribe>
            {field.state.value.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("form.noItemsYet")}
              </p>
            )}
            <FieldErrors
              errors={field.state.meta.errors}
              show={field.state.meta.errors.length > 0}
            />
            <div className="flex flex-wrap gap-2">
              <ItemPicker
                label={t("form.addFromPackage")}
                onPick={(option) => {
                  addPackage(option.id);
                }}
                options={packageOptions}
              />
              <ItemPicker
                label={t("form.addItem")}
                onPick={(option) => {
                  add([
                    newVisitItem({ itemId: option.id, label: option.label }),
                  ]);
                }}
                options={itemOptions.filter(
                  (option) => !present.has(option.id)
                )}
              />
              <Button
                onClick={() => {
                  add([newVisitItem({ itemId: "", label: "" })]);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus />
                {t("form.addCustom")}
              </Button>
            </div>
          </fieldset>
        );
      }}
    </form.Field>
  );
};

import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MotionList } from "@/components/app/list-section";
import { FieldErrors } from "@/components/form/field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

import { newVisitItem } from "./mapper";
import type { VisitFormApi } from "./use-visit-form";

/** One line: what was done, what it cost (optional) and remove. */
const ItemRow = ({
  currency,
  focus,
  form,
  index,
  onEnter,
  onRemove,
}: {
  currency: string;
  /** Focus the label once, right after the line was added. */
  focus: boolean;
  form: VisitFormApi;
  index: number;
  onEnter: () => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation("garageVisits");
  const { t: tc } = useTranslation();
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focus) {
      labelRef.current?.focus();
    }
  }, [focus]);

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <form.Field name={`items[${index}].label`}>
          {(field) => (
            <Input
              aria-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
              aria-label={t("form.customLabel")}
              autoCapitalize="sentences"
              className="min-w-0 flex-1"
              enterKeyHint="next"
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => {
                field.handleChange(event.target.value);
              }}
              onKeyDown={(event) => {
                // Enter adds the next line instead of submitting.
                if (
                  event.key === "Enter" &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  onEnter();
                }
              }}
              placeholder={t("form.customLabel")}
              ref={labelRef}
              value={field.state.value}
            />
          )}
        </form.Field>
        <form.Field name={`items[${index}].cost`}>
          {(field) => (
            <InputGroup className="w-28 shrink-0 sm:w-36">
              <InputGroupInput
                aria-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
                aria-label={t("form.itemCost")}
                inputMode="decimal"
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  field.handleChange(event.target.value);
                }}
                placeholder={t("form.itemCost")}
                value={field.state.value}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{currency}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          )}
        </form.Field>
        <Button
          aria-label={tc("actions.remove")}
          className="shrink-0"
          onClick={onRemove}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
      <form.Field name={`items[${index}].label`}>
        {(field) => (
          <FieldErrors
            errors={field.state.meta.errors}
            show={field.state.meta.isTouched}
          />
        )}
      </form.Field>
      <form.Field name={`items[${index}].cost`}>
        {(field) => (
          <FieldErrors
            errors={field.state.meta.errors}
            show={field.state.meta.isTouched}
          />
        )}
      </form.Field>
    </li>
  );
};

/** Moves focus to the label of line `index`, if it exists. */
const focusLine = (list: HTMLElement | null, index: number): boolean => {
  const input = list?.querySelector<HTMLInputElement>(
    `input[name="items[${index}].label"]`
  );

  input?.focus();

  return input !== null && input !== undefined;
};

const ItemLines = ({
  focusKey,
  form,
  items,
  onAdd,
  onRemove,
}: {
  focusKey: string | null;
  form: VisitFormApi;
  items: { key: string }[];
  onAdd: () => void;
  onRemove: (index: number) => void;
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={listRef}>
      <form.Subscribe selector={(state) => state.values.currency}>
        {(currency) => (
          <MotionList className="flex flex-col gap-2">
            {items.map((item, index) => (
              <ItemRow
                currency={currency}
                focus={focusKey === item.key}
                form={form}
                index={index}
                key={item.key}
                onEnter={() => {
                  if (!focusLine(listRef.current, index + 1)) {
                    onAdd();
                  }
                }}
                onRemove={() => {
                  onRemove(index);
                }}
              />
            ))}
          </MotionList>
        )}
      </form.Subscribe>
    </div>
  );
};

/** The "work done" list: lines you type, each with an optional cost. Enter adds the next line. */
export const ItemsEditor = ({ form }: { form: VisitFormApi }) => {
  const { t } = useTranslation("garageVisits");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  return (
    <form.Field mode="array" name="items">
      {(field) => {
        const add = () => {
          const item = newVisitItem("");
          setFocusKey(item.key);
          field.pushValue(item);
        };

        return (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("form.items")}
            </legend>
            <ItemLines
              focusKey={focusKey}
              form={form}
              items={field.state.value}
              onAdd={add}
              onRemove={(index) => {
                field.removeValue(index);
              }}
            />
            {field.state.value.length === 0 && (
              <p className="text-muted-foreground text-sm">
                {t("form.noItemsYet")}
              </p>
            )}
            <FieldErrors
              errors={field.state.meta.errors}
              show={field.state.meta.errors.length > 0}
            />
            <div>
              <Button onClick={add} size="sm" type="button" variant="outline">
                <Plus />
                {t("form.addLine")}
              </Button>
            </div>
          </fieldset>
        );
      }}
    </form.Field>
  );
};

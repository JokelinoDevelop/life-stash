---
name: new-form
description: Add or change a LifeStash create/edit form the house way — its own Zod schema.ts (string inputs, validation.* keys), mapper.ts (form values ⇄ API types via Hono RPC), TanStack Form via useAppForm, shown in a FormDialog, strings in en + mk. Use whenever you build or modify a form, a field, or a create/edit dialog in src/client.
---

# New form

Reference implementation: `src/client/modules/finances/categories/` — `forms/category-form/{schema.ts,mapper.ts,category-form.tsx}`, `category-dialog.tsx`, `categories.mutations.ts`. Read them before writing. UI rules: `docs/DESIGN-LANGUAGE.md` ("Forms and dialogs").

## Layout

```
src/client/modules/<module>/<feature>/
├─ forms/<thing>-form/
│  ├─ schema.ts        Zod schema + FormValues type (this form only)
│  ├─ mapper.ts        defaults, response → values, values → request
│  └─ <thing>-form.tsx the fields, inside DialogForm
├─ <thing>-dialog.tsx  FormDialog + loading/error + create vs edit
└─ <feature>.mutations.ts
```

One schema and one mapper per form. Never share them between forms, and never import a worker DTO or schema into the client.

## 1. `schema.ts`

- Every input is a **string** (numbers, amounts, km, dates included); the mapper parses them.
- Build from `@/lib/form-schemas`: `requiredText(max)`, `optionalText`, `requiredInteger`, `optionalInteger`, `requiredAmount`, `optionalAmount`, `optionalYear`, `isoDateField`, `partialDateField`. Enums from `@shared/domain` are fine.
- Custom messages are `validation.*` keys from `common.json` (add new keys to **both** `en/common.json` and `mk/common.json`).
- Export `<thing>FormSchema` and `type <Thing>FormValues = z.infer<…>`.

## 2. `mapper.ts`

- Request types come from Hono RPC, not hand-written: `type CreateBody = InferRequestType<typeof api.<module>.<things>.$post>["json"];`
- Export `<thing>FormDefaults(...)`, `<thing>ToFormValues(response)`, `<thing>FormToCreateRequest(values)`, `<thing>FormToUpdateRequest(values)`.
- Conversion lives here and only here: `parseInteger`, `parseAmount` (→ integer minor units), `emptyToNull`, `.trim()`; distance via `displayToKm` from the user's unit; never store miles or decimals.
- Pure functions; add a `mapper.test.ts` when the mapping has logic (units, money, partial dates).

## 3. `<thing>-form.tsx`

```tsx
const form = useAppForm({
  defaultValues,
  onSubmit: async ({ value }) => { await onSubmit(value); },
  validators: { onSubmit: <thing>FormSchema },
});

return (
  <DialogForm
    footer={<form.AppForm><form.FormFooter onCancel={onCancel} /></form.AppForm>}
    onSubmit={() => { void form.handleSubmit(); }}
  >
    <FormSection>
      <FieldGroup>
        <form.AppField name="name">
          {(field) => <field.TextField autoFocus label={t("…")} />}
        </form.AppField>
      </FieldGroup>
    </FormSection>
  </DialogForm>
);
```

- Props: `defaultValues`, `onCancel`, `onSubmit(values) => Promise<void>`. The form knows nothing about the API.
- Field components: `TextField`, `TextareaField`, `SelectField`, `DateField`, `PartialDateField`, `SwitchField` (via `form.AppField`); money with `AmountInput`; optional groups with `FormDisclosure`. Use shadcn/`components/ui` as-is; add a variant there if a design needs one.
- Split groups with `FormSection` (title optional); put two short fields side by side with a grid when it reads better on desktop. `FormNotice` for a context strip at the top.
- Phones: first field `autoFocus`; numeric fields get `inputMode`.

## 4. `<thing>-dialog.tsx`

- Wrap in `FormDialog` (`title`, optional `crumb`, `size="lg"` for long forms). It handles desktop dialog vs phone sheet, ⌘↵ submit and the unsaved-changes confirm.
- Create vs edit: edit loads via the query and shows `FormSkeleton` while pending, `ErrorState` with retry on failure.
- Dialogs open from the URL (`?dialog=…&id=…`) through the module's dialog host (`EntryDialogHost` for Garage, `FinanceDialogHost` for Finances); add the new dialog there, not a new page.
- Submit with `mutation.mutateAsync(mapper(values))` and close on success; the `useAppMutation` `success` string is the toast. Mutations that change data the user may regret get a confirm (`useConfirm`) or an Undo toast.
- Server field errors (`domainError(code, { field })`) show on the matching field — follow how existing forms surface `errors.*`.

## 5. Text

All labels, placeholders, titles and toasts go through i18next in the feature's namespace, in **both** `en` and `mk`. Follow the copy rules: creating is "Add …", plain words the user sees.

## Done when

- [ ] Own `schema.ts` (strings, `validation.*`) and `mapper.ts` (RPC-inferred types, all conversion)
- [ ] Form rendered in `DialogForm` inside `FormDialog`, opened via the dialog host
- [ ] Loading/error states for edit; toast on success
- [ ] Every string in `en` and `mk`
- [ ] If it needs a new or changed endpoint, done with the `new-endpoint` skill
- [ ] `pnpm check` passes

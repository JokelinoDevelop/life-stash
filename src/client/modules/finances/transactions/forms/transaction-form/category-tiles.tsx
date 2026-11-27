import { withForm } from "@/components/form/form-hook";

import { CategoryIcon } from "../../../categories/category-icon";
import { useCategoryName } from "../../../categories/category-label";
import { CATEGORY_TILE, CategoryPicker } from "./category-picker";
import { frequentCategories, noOptions } from "./frequent-categories";
import { TRANSACTION_FORM_TEMPLATE as TEMPLATE } from "./mapper";

const TILE_COUNT = 8;

/**
 * Phones: the kind's most used categories as one row of pills that scrolls sideways
 * (tinted icon and the full name), then "More…" for the rest. A pick from "More…" comes
 * first, so it stays in view.
 */
export const CategoryTiles = withForm({
  defaultValues: TEMPLATE,
  props: { optionsFor: noOptions },
  render: function CategoryTilesRender({ form, optionsFor }) {
    const nameOf = useCategoryName();

    return (
      <form.Subscribe
        selector={(state) => ({
          categoryId: state.values.categoryId,
          kind: state.values.kind,
        })}
      >
        {({ categoryId, kind }) => {
          const options = optionsFor(kind, categoryId);
          const top = frequentCategories(options, TILE_COUNT);
          const picked = options.find((category) => category.id === categoryId);

          const tiles =
            picked === undefined || top.some((tile) => tile.id === picked.id)
              ? top
              : [picked, ...top.slice(0, TILE_COUNT - 1)];

          return (
            <div className="-mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4">
              {tiles.map((category) => (
                <button
                  aria-pressed={category.id === categoryId}
                  className={CATEGORY_TILE}
                  key={category.id}
                  onClick={() => {
                    form.setFieldValue("categoryId", category.id);
                  }}
                  type="button"
                >
                  <CategoryIcon
                    className="size-7 rounded-full max-md:size-7 max-md:rounded-full"
                    name={category.icon}
                  />
                  {nameOf(category)}
                </button>
              ))}
              <form.Field name="categoryId">
                {(field) => (
                  <CategoryPicker
                    categories={options}
                    invalid={false}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    trigger="tile"
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>
          );
        }}
      </form.Subscribe>
    );
  },
});

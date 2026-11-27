import { withForm } from "@/components/form/form-hook";

import { CategoryIcon } from "../../../categories/category-icon";
import { useCategoryName } from "../../../categories/category-label";
import { CATEGORY_TILE, CategoryPicker } from "./category-picker";
import { frequentCategories, noOptions } from "./frequent-categories";
import { TRANSACTION_FORM_TEMPLATE as TEMPLATE } from "./mapper";

const TILE_COUNT = 7;

/**
 * Phones: the kind's categories as a grid of tiles (tinted icon over the name), the most
 * used first and "More…" for the rest. A pick from "More…" takes the last tile.
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
              : [...top.slice(0, TILE_COUNT - 1), picked];

          return (
            <div className="grid grid-cols-4 gap-2">
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
                  <CategoryIcon name={category.icon} />
                  <span className="max-w-full truncate px-1">
                    {nameOf(category)}
                  </span>
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

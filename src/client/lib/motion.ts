import { useAutoAnimate } from "@formkit/auto-animate/react";

/**
 * Animates a list container's children: new rows fade in, removed rows fade
 * out and the rest slide into place. Respects `prefers-reduced-motion`.
 * Put the returned ref on the `<ul>` whose direct children are the rows.
 */
export const useListMotion = <T extends HTMLElement = HTMLUListElement>() => {
  const [ref] = useAutoAnimate<T>({ duration: 150, easing: "ease-out" });

  return ref;
};

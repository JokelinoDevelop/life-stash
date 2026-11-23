import { useRef, useState } from "react";
import type { PointerEvent } from "react";

import { haptic } from "@/lib/haptics";
import { scrubIndex } from "@/lib/scrub";

/**
 * Tap or drag across a bar chart to read one column (a month); pair it with
 * `ScrubRange` for the keyboard. `selected` is null until the user picks a column, so the
 * chart can show its default readout (e.g. the current month) meanwhile.
 */
export const useScrub = (count: number, last: number) => {
  const [selected, setSelected] = useState<number | null>(null);
  const dragging = useRef(false);

  const pick = (next: number) => {
    setSelected((current) => {
      if (current !== next) {
        haptic("tick");
      }

      return next;
    });
  };

  const fromPointer = (event: PointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    pick(
      Math.min(last, scrubIndex(event.clientX - box.left, box.width, count))
    );
  };

  const bind = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      fromPointer(event);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      if (dragging.current) {
        fromPointer(event);
      }
    },
    onPointerUp: () => {
      dragging.current = false;
    },
    onPointerCancel: () => {
      dragging.current = false;
    },
  };

  return { handleSelect: setSelected, bind, selected };
};

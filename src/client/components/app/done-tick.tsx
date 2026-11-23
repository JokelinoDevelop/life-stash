import { Check } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { doneTickCount, subscribeDoneTick } from "@/lib/done-tick";

/** How long the tick stays up (its CSS animation is the same length). */
const SHOW_MS = 900;

/** The overlay for `showDoneTick`; reduced motion shows the check without animating it. */
export const DoneTickHost = () => {
  const current = useSyncExternalStore(subscribeDoneTick, doneTickCount);
  const [finished, setFinished] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFinished(current);
    }, SHOW_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [current]);

  if (current <= finished) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-60 flex items-center justify-center"
      key={current}
    >
      <span className="animate-done-tick bg-success flex size-20 items-center justify-center rounded-full text-white shadow-lg">
        <Check className="animate-done-check size-10" strokeWidth={3} />
      </span>
    </div>
  );
};

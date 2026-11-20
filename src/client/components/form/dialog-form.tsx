import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A form laid out for a dialog: a scrolling body and a pinned footer.
 * ⌘↵ / Ctrl+↵ submits from anywhere inside, including open selects and pickers.
 */
/** Popups that portal out of the dialog but still belong to its form. */
const PORTALLED_POPUPS =
  "[data-slot=select-content], [data-slot=popover-content], [data-slot=dropdown-menu-content]";

export const DialogForm = ({
  children,
  footer,
  onSubmit,
}: {
  children: ReactNode;
  footer: ReactNode;
  onSubmit: () => void;
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const latestSubmit = useRef(onSubmit);

  useEffect(() => {
    latestSubmit.current = onSubmit;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const form = formRef.current;
      const { target } = event;

      const isSubmitKey =
        event.key === "Enter" && (event.metaKey || event.ctrlKey);

      if (form === null || !isSubmitKey || !(target instanceof Element)) {
        return;
      }

      // Inside this form's dialog, or an open select/picker it owns (they portal out).
      const dialog = form.closest("[role=dialog]") ?? form;

      const inside =
        dialog.contains(target) || target.closest(PORTALLED_POPUPS) !== null;

      if (inside) {
        event.preventDefault();
        latestSubmit.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      ref={formRef}
    >
      <div className="divide-divider min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain">
        {children}
      </div>
      {footer}
    </form>
  );
};

/** A group of fields in a dialog form; groups are split by hairlines. */
export const FormSection = ({
  children,
  className,
  description,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
}) => (
  <section
    className={cn(
      "flex flex-col gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-5",
      className
    )}
  >
    {title !== undefined && (
      <div className="flex flex-col gap-0.5">
        <h3 className="text-subtle-foreground text-xs font-medium">{title}</h3>
        {description !== undefined && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
    )}
    {children}
  </section>
);

/** A quiet strip at the top of a dialog form, e.g. "Completes: Oil change". */
export const FormNotice = ({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: ReactNode;
}) => (
  <div className="bg-background text-subtle-foreground flex items-center gap-2 px-4 py-2.5 text-xs md:px-6 [&_svg]:size-3.5 [&_svg]:shrink-0">
    {icon}
    <span className="min-w-0">{children}</span>
  </div>
);

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Desktop: a 44px bar at the top of the content panel (crumb › title, actions).
 * Phones: a top row (back or `mobileTop`, actions) above a large title.
 */
export const PageHeader = ({
  actions,
  back,
  description,
  desktopTitle,
  hideMobileTitle = false,
  mobileTop,
  title,
}: {
  actions?: ReactNode;
  back?: ReactNode;
  description?: ReactNode;
  /** Bar title on desktop when it differs from the phone title. */
  desktopTitle?: ReactNode;
  hideMobileTitle?: boolean;
  mobileTop?: ReactNode;
  title: ReactNode;
}) => (
  <>
    <header className="border-divider bg-card sticky top-0 z-20 hidden h-11 items-center gap-1.5 rounded-t-lg border-b pr-3 pl-5 md:flex">
      {back !== undefined && (
        <>
          {back}
          <ChevronRight
            aria-hidden="true"
            className="text-muted-foreground/60 size-3.5 shrink-0"
          />
        </>
      )}
      <h1 className="truncate text-sm font-medium">{desktopTitle ?? title}</h1>
      {actions !== undefined && (
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
        </div>
      )}
    </header>
    <header className="mb-5 flex flex-col gap-2 md:hidden">
      {(back !== undefined ||
        mobileTop !== undefined ||
        actions !== undefined) && (
        <div className="-mx-1 flex min-h-11 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center">{mobileTop ?? back}</div>
          {actions !== undefined && (
            <div className="flex shrink-0 items-center gap-1">{actions}</div>
          )}
        </div>
      )}
      {!hideMobileTitle && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description !== undefined && (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          )}
        </div>
      )}
    </header>
  </>
);

/** Padded, full-width content for form and settings pages (the desktop panel has no padding). */
export const PageContent = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6 md:px-7 md:py-6">{children}</div>
);

/**
 * Content made of list sections: inset boxes on phones, full-bleed bands on
 * desktop. Children without `data-bleed` get a desktop margin.
 */
export const PageStack = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col gap-6 md:gap-0 md:[&>:not([data-bleed])]:mx-5 md:[&>:not([data-bleed])]:my-4">
    {children}
  </div>
);

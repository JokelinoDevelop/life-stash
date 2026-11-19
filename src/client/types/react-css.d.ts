import "react";

declare module "react" {
  /** Allow CSS custom properties (e.g. `--bar`) for data-driven sizes. */
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

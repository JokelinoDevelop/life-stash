import { PageSkeleton } from "./page-skeleton";

/** Shown in the content panel when a route takes long to load: a header and list sections. */
export const RoutePending = () => <PageSkeleton rows={4} sections={2} />;

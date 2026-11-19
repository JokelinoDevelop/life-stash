import { LoadingState } from "./states";

/** Shown in the content panel when a route takes long to load. */
export const RoutePending = () => (
  <div className="md:pt-11">
    <LoadingState rows={4} sections={2} />
  </div>
);

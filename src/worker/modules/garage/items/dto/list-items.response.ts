export interface ListItemsResponse {
  items: {
    id: string;
    name: string;
    archivedAt: string | null;
    /** Service lines logged with this item, across all cars. */
    timesDone: number;
    /** Date of the most recent visit that included it (`YYYY-MM-DD`). */
    lastDoneOn: string | null;
  }[];
}

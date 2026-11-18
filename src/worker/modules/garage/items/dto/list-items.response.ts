export interface ListItemsResponse {
  items: { id: string; name: string; archivedAt: string | null }[];
}

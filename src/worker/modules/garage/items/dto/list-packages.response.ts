export interface ListPackagesResponse {
  packages: {
    id: string;
    name: string;
    notes: string | null;
    itemIds: string[];
  }[];
}

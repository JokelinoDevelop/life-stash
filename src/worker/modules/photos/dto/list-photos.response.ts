export interface ListPhotosResponse {
  photos: {
    id: string;
    url: string;
    contentType: string;
    createdAt: string;
    fileName: string | null;
    /** An invoice PDF the app generated when issuing; it can't be removed. */
    generated: boolean;
    sizeBytes: number;
  }[];
}

export interface ListPhotosResponse {
  photos: {
    id: string;
    url: string;
    contentType: string;
    createdAt: string;
    fileName: string | null;
    sizeBytes: number;
  }[];
}

export interface StatusResponse {
  setupRequired: boolean;
  user: { id: string; displayName: string; isAdmin: boolean } | null;
}

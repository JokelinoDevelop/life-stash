export interface GetCredentialsResponse {
  email: string | null;
  hasPassword: boolean;
  passkeyCount: number;
  /** True right after signing in; credentials can then change without the current password. */
  recentlySignedIn: boolean;
}

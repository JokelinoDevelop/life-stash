export interface CreateInviteResponse {
  id: string;
  /** Shown once: the link is `/invite/<token>`. */
  token: string;
  expiresAt: string;
}

import type { InviteView } from "../admin.service";

export interface ListInvitesResponse {
  invites: {
    id: string;
    name: string | null;
    joinsYourHousehold: boolean;
    expiresAt: string;
    createdAt: string;
  }[];
}

export const toListInvitesResponse = (
  rows: readonly InviteView[]
): ListInvitesResponse => ({
  invites: rows.map((row) => ({
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    id: row.id,
    joinsYourHousehold: row.joinsYourHousehold,
    name: row.name,
  })),
});

import type { AccountView } from "../admin.service";

export interface ListUsersResponse {
  users: {
    id: string;
    displayName: string;
    email: string | null;
    householdName: string;
    inYourHousehold: boolean;
    isAdmin: boolean;
    isYou: boolean;
    disabled: boolean;
    createdAt: string;
  }[];
}

export const toListUsersResponse = (
  rows: readonly AccountView[]
): ListUsersResponse => ({
  users: rows.map((row) => ({
    createdAt: row.createdAt,
    disabled: row.disabledAt !== null,
    displayName: row.displayName,
    email: row.email,
    householdName: row.householdName,
    id: row.id,
    inYourHousehold: row.inYourHousehold,
    isAdmin: row.isAdmin,
    isYou: row.isYou,
  })),
});

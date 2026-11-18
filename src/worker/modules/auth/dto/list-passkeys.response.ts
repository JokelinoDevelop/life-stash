export interface PasskeyDto {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ListPasskeysResponse {
  passkeys: PasskeyDto[];
}

export const toPasskeyDto = (row: {
  id: string;
  deviceName: string;
  createdAt: string;
  lastUsedAt: string | null;
}): PasskeyDto => ({
  createdAt: row.createdAt,
  deviceName: row.deviceName,
  id: row.id,
  lastUsedAt: row.lastUsedAt,
});

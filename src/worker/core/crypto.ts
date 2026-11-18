const encoder = new TextEncoder();

export const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

export const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return Uint8Array.from(atob(padded), (char) => char.codePointAt(0) ?? 0);
};

export const randomBytes = (length: number): Uint8Array =>
  crypto.getRandomValues(new Uint8Array(length));

/** 256-bit random token, base64url encoded. */
export const randomToken = (): string => toBase64Url(randomBytes(32));

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_GROUP_LENGTH = 4;
const CODE_GROUPS = 3;

/** Human-friendly recovery code like `K7QM-2XHD-9PWA` (~60 bits of entropy). */
export const generateRecoveryCode = (): string => {
  const bytes = randomBytes(CODE_GROUP_LENGTH * CODE_GROUPS);

  const chars = [...bytes].map(
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]
  );

  const groups: string[] = [];

  for (let index = 0; index < chars.length; index += CODE_GROUP_LENGTH) {
    groups.push(chars.slice(index, index + CODE_GROUP_LENGTH).join(""));
  }

  return groups.join("-");
};

/** Normalises user input so `k7qm 2xhd 9pwa` matches `K7QM-2XHD-9PWA`. */
export const normalizeRecoveryCode = (input: string): string => {
  const compact = input.toUpperCase().replaceAll(/[^A-Z0-9]/gu, "");
  const groups = compact.match(/.{1,4}/gu) ?? [];

  return groups.join("-");
};

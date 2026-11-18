import { fromBase64Url, randomBytes, toBase64Url } from "./crypto";

/** Cloudflare Workers caps PBKDF2 at 100,000 iterations. */
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const SCHEME = "pbkdf2-sha256";

const encoder = new TextEncoder();

const derive = async (
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number
): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { hash: "SHA-256", name: "PBKDF2", iterations, salt },
    key,
    KEY_BITS
  );

  return new Uint8Array(bits);
};

/** Compares in constant time so the comparison doesn't leak how many bytes matched. */
const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (const [index, byte] of a.entries()) {
    // Bitwise XOR/OR is the point here: it accumulates differences without branching.
    // oxlint-disable-next-line no-bitwise
    difference |= byte ^ (b[index] ?? 0);
  }

  return difference === 0;
};

/** Returns `pbkdf2-sha256$<iterations>$<salt>$<hash>` (base64url parts). */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = new Uint8Array(randomBytes(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);

  return [
    SCHEME,
    String(ITERATIONS),
    toBase64Url(salt),
    toBase64Url(hash),
  ].join("$");
};

export const verifyPassword = async (
  password: string,
  stored: string
): Promise<boolean> => {
  const [scheme, iterations, salt, hash] = stored.split("$");

  if (
    scheme !== SCHEME ||
    iterations === undefined ||
    salt === undefined ||
    hash === undefined
  ) {
    return false;
  }

  const expected = fromBase64Url(hash);

  const actual = await derive(
    password,
    fromBase64Url(salt),
    Number(iterations)
  );

  return timingSafeEqual(actual, expected);
};

/**
 * A well-formed hash that matches no password. It is checked when the email is unknown, so the
 * response takes as long as for a known email and doesn't reveal which emails have accounts.
 */
export const DUMMY_PASSWORD_HASH =
  "pbkdf2-sha256$100000$m3ZZzcMKB1iDXoeqWQKWgA$FJm7u-73SwP-IB5KQ7Mhqv6V2NTpE0h0-ioX-vYBA4s";

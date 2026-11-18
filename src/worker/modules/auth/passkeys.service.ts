import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";

import { fromBase64Url, toBase64Url } from "../../core/crypto";
import type { Db } from "../../core/db";
import { badRequest, unauthorized } from "../../core/errors";
import { passkeys } from "../../db/schema/core";
import type { RelyingParty } from "./relying-party";

const uuidBytes = (uuid: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new TextEncoder().encode(uuid));

export const registrationOptions = async (
  rp: RelyingParty,
  user: { id: string; name: string },
  existingCredentialIds: string[]
) =>
  await generateRegistrationOptions({
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "preferred",
    },
    excludeCredentials: existingCredentialIds.map((id) => ({ id })),
    rpID: rp.rpID,
    rpName: rp.rpName,
    userDisplayName: user.name,
    userID: uuidBytes(user.id),
    userName: user.name,
  });

export const verifyRegistration = async (
  rp: RelyingParty,
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<WebAuthnCredential> => {
  const result = await verifyRegistrationResponse({
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
    requireUserVerification: false,
    expectedChallenge,
    response,
  }).catch(() => null);

  if (result?.verified !== true) {
    throw badRequest("Passkey could not be verified");
  }

  return result.registrationInfo.credential;
};

export const passkeyRow = (
  credential: WebAuthnCredential,
  input: { userId: string; deviceName: string }
) => ({
  counter: credential.counter,
  deviceName: input.deviceName,
  id: credential.id,
  publicKey: toBase64Url(credential.publicKey),
  transports: credential.transports?.join(",") ?? null,
  userId: input.userId,
});

export const authenticationOptions = async (rp: RelyingParty) =>
  await generateAuthenticationOptions({
    allowCredentials: [],
    rpID: rp.rpID,
    userVerification: "preferred",
  });

/** Verifies a login assertion and returns the user id of the passkey owner. */
export const verifyAuthentication = async (
  db: Db,
  rp: RelyingParty,
  response: AuthenticationResponseJSON,
  expectedChallenge: string
): Promise<string> => {
  const [stored] = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.id, response.id))
    .limit(1);

  if (!stored) {
    throw unauthorized();
  }

  const result = await verifyAuthenticationResponse({
    credential: {
      counter: stored.counter,
      id: stored.id,
      publicKey: fromBase64Url(stored.publicKey),
      transports: stored.transports?.split(","),
    },
    expectedOrigin: rp.origin,
    expectedRPID: rp.rpID,
    requireUserVerification: false,
    expectedChallenge,
    response,
  }).catch(() => null);

  if (result?.verified !== true) {
    throw unauthorized();
  }

  await db
    .update(passkeys)
    .set({
      counter: result.authenticationInfo.newCounter,
      lastUsedAt: new Date().toISOString(),
    })
    .where(eq(passkeys.id, stored.id));

  return stored.userId;
};

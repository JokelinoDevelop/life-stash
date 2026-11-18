import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  WebAuthnError,
} from "@simplewebauthn/browser";

import { api, unwrap } from "./api";

export type PasskeyFailure = "cancelled" | "unsupported" | "failed";

export class PasskeyError extends Error {
  override readonly name = "PasskeyError";
  readonly reason: PasskeyFailure;

  constructor(reason: PasskeyFailure) {
    super(reason);
    this.reason = reason;
  }
}

const toPasskeyError = (error: unknown): Error => {
  if (
    error instanceof WebAuthnError &&
    error.code === "ERROR_CEREMONY_ABORTED"
  ) {
    return new PasskeyError("cancelled");
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return new PasskeyError("cancelled");
  }

  return error instanceof Error ? error : new PasskeyError("failed");
};

/**
 * Drops WebAuthn extensions: the server sends none, and their JSON-serialised types do not line
 * up with the browser library's types.
 */
const withoutExtensions = <T extends { extensions?: unknown }>({
  extensions: _extensions,
  ...rest
}: T): Omit<T, "extensions"> => rest;

const assertSupported = () => {
  if (!browserSupportsWebAuthn()) {
    throw new PasskeyError("unsupported");
  }
};

/** A readable default name for the passkey, e.g. "Android · Chrome". */
export const guessDeviceName = (): string => {
  const agent = navigator.userAgent;

  const platform =
    [
      ["Android", "Android"],
      ["iPhone", "iPhone"],
      ["iPad", "iPad"],
      ["Mac OS", "Mac"],
      ["Windows", "Windows"],
      ["Linux", "Linux"],
    ].find(([needle]) => agent.includes(needle ?? ""))?.[1] ?? "Device";

  const browser =
    [
      ["Edg/", "Edge"],
      ["Firefox/", "Firefox"],
      ["Chrome/", "Chrome"],
      ["Safari/", "Safari"],
    ].find(([needle]) => agent.includes(needle ?? ""))?.[1] ?? "Browser";

  return `${platform} · ${browser}`;
};

export const setupWithPasskey = async (
  displayName: string
): Promise<string[]> => {
  assertSupported();

  const { challengeId, options } = await unwrap(
    api.auth.setup.options.$post({ json: { displayName } })
  );

  const response = await startRegistration({
    optionsJSON: withoutExtensions(options),
  }).catch((error: unknown) => {
    throw toPasskeyError(error);
  });

  const { recoveryCodes } = await unwrap(
    api.auth.setup.verify.$post({
      json: {
        deviceName: guessDeviceName(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        challengeId,
        displayName,
        response,
      },
    })
  );

  return recoveryCodes;
};

export const signInWithPasskey = async (): Promise<void> => {
  assertSupported();
  const { challengeId, options } = await unwrap(api.auth.login.options.$post());

  const response = await startAuthentication({
    optionsJSON: withoutExtensions(options),
  }).catch((error: unknown) => {
    throw toPasskeyError(error);
  });

  await unwrap(
    api.auth.login.verify.$post({ json: { challengeId, response } })
  );
};

export const addPasskey = async (): Promise<void> => {
  assertSupported();

  const { challengeId, options } = await unwrap(
    api.account.passkeys.options.$post()
  );

  const response = await startRegistration({
    optionsJSON: withoutExtensions(options),
  }).catch((error: unknown) => {
    throw toPasskeyError(error);
  });

  await unwrap(
    api.account.passkeys.verify.$post({
      json: { deviceName: guessDeviceName(), challengeId, response },
    })
  );
};

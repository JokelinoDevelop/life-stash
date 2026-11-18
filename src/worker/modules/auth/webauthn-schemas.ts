import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { z } from "zod";

const base64Url = z.string().min(1).max(8192);

const TRANSPORTS = [
  "ble",
  "cable",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
] as const;

type Transport = (typeof TRANSPORTS)[number];

const isTransport = (value: string): value is Transport =>
  TRANSPORTS.some((transport) => transport === value);

/** Browsers may report transports this server does not know yet; keep only known ones. */
const transports = z
  .array(z.string().max(32))
  .max(10)
  .transform((values) => values.filter(isTransport));

const extensionResults = z.object({
  appid: z.boolean().optional(),
  credProps: z.object({ rk: z.boolean().optional() }).optional(),
  hmacCreateSecret: z.boolean().optional(),
});

const credentialEnvelope = {
  authenticatorAttachment: z.enum(["cross-platform", "platform"]).optional(),
  clientExtensionResults: extensionResults,
  id: base64Url,
  rawId: base64Url,
  type: z.literal("public-key"),
};

/** Browser registration response; SimpleWebAuthn performs the cryptographic checks. */
export const registrationResponseSchema = z.object({
  ...credentialEnvelope,
  response: z.object({
    attestationObject: base64Url,
    authenticatorData: base64Url.optional(),
    clientDataJSON: base64Url,
    publicKey: base64Url.optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    transports: transports.optional(),
  }),
}) satisfies z.ZodType<RegistrationResponseJSON>;

/** Browser authentication response; SimpleWebAuthn performs the cryptographic checks. */
export const authenticationResponseSchema = z.object({
  ...credentialEnvelope,
  response: z.object({
    authenticatorData: base64Url,
    clientDataJSON: base64Url,
    signature: base64Url,
    userHandle: base64Url.optional(),
  }),
}) satisfies z.ZodType<AuthenticationResponseJSON>;

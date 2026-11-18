import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";

export interface AddPasskeyOptionsResponse {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

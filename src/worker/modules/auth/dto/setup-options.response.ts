import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";

export interface SetupOptionsResponse {
  challengeId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

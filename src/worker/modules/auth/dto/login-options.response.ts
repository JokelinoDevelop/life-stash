import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/server";

export interface LoginOptionsResponse {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

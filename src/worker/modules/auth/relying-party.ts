export interface RelyingParty {
  rpID: string;
  rpName: string;
  origin: string;
}

/** The relying party is derived from the request so dev, preview and prod all work. */
export const relyingPartyFor = (requestUrl: string): RelyingParty => {
  const url = new URL(requestUrl);

  return { origin: url.origin, rpID: url.hostname, rpName: "LifeStash" };
};

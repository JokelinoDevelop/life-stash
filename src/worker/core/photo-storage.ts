import { AwsClient } from "aws4fetch";

import type { Bindings } from "./env";

export interface SignedUrlOptions {
  expiresInSeconds: number;
  /** Extra signed query parameters, e.g. `response-content-disposition`. */
  params?: Readonly<Record<string, string>>;
  /**
   * Headers the request must send exactly (signed), e.g. an upload's `content-type` and
   * `content-length`, so the file can't be swapped for another type or size.
   */
  headers?: Readonly<Record<string, string>>;
}

export interface PhotoStorage {
  signedUrl: (
    method: "GET" | "PUT",
    key: string,
    options: SignedUrlOptions
  ) => Promise<string>;
  remove: (key: string) => Promise<void>;
}

interface B2Config {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
}

const readB2Config = (env: Bindings): B2Config | null => {
  const config: B2Config = {
    accessKeyId: env.B2_KEY_ID ?? "",
    bucket: env.B2_BUCKET ?? "",
    endpoint: (env.B2_ENDPOINT ?? "").replace(/\/$/u, ""),
    region: env.B2_REGION ?? "",
    secretAccessKey: env.B2_APP_KEY ?? "",
  };

  return Object.values(config).every((value) => value !== "") ? config : null;
};

export const isPhotoStorageConfigured = (env: Bindings): boolean =>
  readB2Config(env) !== null;

/** Backblaze B2 through its S3-compatible API; null when not configured. */
export const photoStorageFor = (env: Bindings): PhotoStorage | null => {
  const config = readB2Config(env);

  if (!config) {
    return null;
  }

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    region: config.region,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
  });

  const objectUrl = (key: string) => {
    const segments = key.split("/");

    // `.` and `..` would be resolved by the URL and reach outside the key's folder.
    if (segments.some((part) => part === "" || part === "." || part === "..")) {
      throw new Error("Invalid object key");
    }

    const path = segments.map(encodeURIComponent).join("/");

    return `${config.endpoint}/${config.bucket}/${path}`;
  };

  return {
    remove: async (key) => {
      const response = await client.fetch(objectUrl(key), { method: "DELETE" });

      if (!response.ok && response.status !== 404) {
        throw new Error(`B2 delete failed with ${response.status}`);
      }
    },
    signedUrl: async (
      method,
      key,
      { expiresInSeconds, headers, params = {} }
    ) => {
      const url = new URL(objectUrl(key));
      url.searchParams.set("X-Amz-Expires", String(expiresInSeconds));

      for (const [name, value] of Object.entries(params)) {
        url.searchParams.set(name, value);
      }

      const signed = await client.sign(url.toString(), {
        aws: { allHeaders: headers !== undefined, signQuery: true },
        headers,
        method,
      });

      return signed.url;
    },
  };
};

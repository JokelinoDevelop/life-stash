/**
 * Prepares the local Garage container (docker-compose.yml) for photo and
 * attachment uploads, then points `.dev.vars` at it. Safe to run again.
 *
 *   pnpm storage:up      start Garage
 *   pnpm storage:setup   this script
 *
 * The key below only exists in the throwaway dev container.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import { AwsClient } from "aws4fetch";

const ENDPOINT = "http://localhost:3900";
const REGION = "garage";
const BUCKET = "lifestash-dev";
const KEY_NAME = "lifestash-dev";
const KEY_ID = "GKdde3edd98b07cc986f8fbaf4";
const KEY_SECRET =
  "1f64ed96e66726d44c60f59b75d082b16d1774ee4159e44f6336ab7970029090";
const APP_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];
const DEV_VARS = ".dev.vars";
const DEV_VARS_EXAMPLE = ".dev.vars.example";
const READY_ATTEMPTS = 30;
const READY_DELAY_MS = 500;

const garage = (...args: string[]): string =>
  execFileSync(
    "docker",
    ["compose", "exec", "-T", "garage", "/garage", ...args],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

/** Runs a command whose "already exists" failure means the work is done. */
const garageIdempotent = (...args: string[]) => {
  try {
    garage(...args);
  } catch (error) {
    const stderr = String((error as { stderr?: unknown }).stderr ?? error);

    if (!/already exists|already in use/iu.test(stderr)) {
      throw error;
    }
  }
};

const waitForGarage = async () => {
  for (let attempt = 0; attempt < READY_ATTEMPTS; attempt += 1) {
    try {
      garage("status");

      return;
    } catch {
      await sleep(READY_DELAY_MS);
    }
  }

  throw new Error("Garage is not running. Start it with `pnpm storage:up`.");
};

const assignLayout = () => {
  if (!garage("status").includes("NO ROLE ASSIGNED")) {
    return;
  }

  const [nodeId] = garage("node", "id", "-q").trim().split("@");

  if (nodeId === undefined || nodeId === "") {
    throw new Error("Could not read the Garage node id.");
  }

  garage("layout", "assign", "-z", "dev", "-c", "1G", nodeId);
  garage("layout", "apply", "--version", "1");
};

const CORS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
    ${APP_ORIGINS.map((origin) => `<AllowedOrigin>${origin}</AllowedOrigin>`).join("\n    ")}
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>content-type</AllowedHeader>
    <ExposeHeader>etag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

/** Browsers upload straight to the bucket, so it must allow the dev origin. */
const putCors = async () => {
  const client = new AwsClient({
    accessKeyId: KEY_ID,
    region: REGION,
    secretAccessKey: KEY_SECRET,
    service: "s3",
  });

  const response = await client.fetch(`${ENDPOINT}/${BUCKET}?cors`, {
    body: CORS_XML,
    headers: {
      "content-md5": createHash("md5").update(CORS_XML).digest("base64"),
      "content-type": "application/xml",
    },
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(
      `Setting CORS failed (${response.status}): ${await response.text()}`
    );
  }
};

const STORAGE_VARS: Record<string, string> = {
  B2_APP_KEY: KEY_SECRET,
  B2_BUCKET: BUCKET,
  B2_ENDPOINT: ENDPOINT,
  B2_KEY_ID: KEY_ID,
  B2_REGION: REGION,
};

/** Sets the B2_* lines in .dev.vars (created from the example if missing). */
const writeDevVars = () => {
  const source = existsSync(DEV_VARS) ? DEV_VARS : DEV_VARS_EXAMPLE;
  const lines = readFileSync(source, "utf8").split("\n");
  const seen = new Set<string>();

  const updated = lines.map((line) => {
    const name = line.split("=", 1)[0]?.trim() ?? "";
    const value = STORAGE_VARS[name];

    if (value === undefined) {
      return line;
    }

    seen.add(name);

    return `${name}=${value}`;
  });

  for (const [name, value] of Object.entries(STORAGE_VARS)) {
    if (!seen.has(name)) {
      updated.push(`${name}=${value}`);
    }
  }

  writeFileSync(DEV_VARS, updated.join("\n"));
};

await waitForGarage();
assignLayout();
garageIdempotent("key", "import", "--yes", "-n", KEY_NAME, KEY_ID, KEY_SECRET);
garageIdempotent("bucket", "create", BUCKET);
garage(
  "bucket",
  "allow",
  "--read",
  "--write",
  "--owner",
  BUCKET,
  "--key",
  KEY_NAME
);
await putCors();
writeDevVars();

console.log(
  `Garage is ready: bucket "${BUCKET}" at ${ENDPOINT}. .dev.vars now points at it; restart \`pnpm dev\`.`
);

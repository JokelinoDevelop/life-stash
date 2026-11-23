/**
 * Ships a new version to Cloudflare in one go. Stops at the first failure.
 *
 *   pnpm release            asks patch / minor / major
 *   pnpm release minor      bump without asking
 *   pnpm release --dry-run  checks and builds the next version; changes nothing
 *
 * Steps: main is clean and matches origin → shows what changed → pnpm check → bumps the version
 * (commit + tag vX.Y.Z) → build → remote D1 migrations → wrangler deploy → confirms
 * /api/version reports the new version → pushes main and the tag.
 *
 * If the build or deploy fails, the version commit and tag are undone. Migrations that already
 * ran stay applied (they are additive; the next release skips them).
 *
 * Set LIFESTASH_URL to check a custom domain instead of the URL wrangler prints.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { setTimeout as sleep } from "node:timers/promises";

import { BUMPS, isBump, nextVersion, parseBumpAnswer } from "./release-version";
import type { Bump } from "./release-version";

const MAIN = "main";
const DB = "lifestash";
const MAX_NOTES = 30;
const VERIFY_ATTEMPTS = 10;
const VERIFY_DELAY_MS = 3000;

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const bumpArg = args.find((arg) => !arg.startsWith("--"));

const bold = (text: string) => `\u001B[1m${text}\u001B[0m`;
const dim = (text: string) => `\u001B[2m${text}\u001B[0m`;
const red = (text: string) => `\u001B[31m${text}\u001B[0m`;
const green = (text: string) => `\u001B[32m${text}\u001B[0m`;
const yellow = (text: string) => `\u001B[33m${text}\u001B[0m`;

const step = (text: string) => {
  console.log(`\n${bold(`▸ ${text}`)}`);
};

class ReleaseError extends Error {}

const fail = (message: string): never => {
  throw new ReleaseError(message);
};

/** Runs a command quietly and returns its trimmed output. */
const read = (command: string, commandArgs: string[]): string =>
  execFileSync(command, commandArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

/** Runs a command in the foreground (it can prompt); optionally echoes and returns its output. */
const run = async (
  command: string,
  commandArgs: string[],
  { capture = false } = {}
): Promise<string> =>
  await new Promise((resolve, reject) => {
    console.log(dim(`$ ${command} ${commandArgs.join(" ")}`));
    const child = spawn(command, commandArgs, {
      stdio: ["inherit", capture ? "pipe" : "inherit", "inherit"],
    });
    let output = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(
          new ReleaseError(
            `${command} ${commandArgs.join(" ")} exited with ${code}`
          )
        );
      }
    });
  });

const readVersion = (): string =>
  (JSON.parse(readFileSync("package.json", "utf8")) as { version: string })
    .version;

/** Rewrites only the version line so the file's formatting stays as it is. */
const writeVersion = (from: string, to: string) => {
  const text = readFileSync("package.json", "utf8");
  const updated = text.replace(`"version": "${from}"`, `"version": "${to}"`);

  if (updated === text) {
    fail("Couldn't find the version line in package.json");
  }

  writeFileSync("package.json", updated);
};

const ask = async (question: string): Promise<string> => {
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return (await prompt.question(question)).trim().toLowerCase();
  } finally {
    prompt.close();
  }
};

const chooseBump = async (): Promise<Bump> => {
  if (bumpArg !== undefined) {
    return isBump(bumpArg)
      ? bumpArg
      : fail(`Unknown bump "${bumpArg}" (use ${BUMPS.join(", ")})`);
  }

  const answer = await ask("Bump patch, minor or major? [patch] ");

  return parseBumpAnswer(answer) ?? fail(`Unknown bump "${answer}"`);
};

/** main, nothing uncommitted, and exactly what is on origin. In a dry run these only warn. */
const preflight = () => {
  step("Checking the repository");
  const problems: string[] = [];

  const branch = read("git", ["branch", "--show-current"]);

  if (branch !== MAIN) {
    problems.push(`on "${branch}", not ${MAIN}`);
  }

  if (read("git", ["status", "--porcelain"]) !== "") {
    problems.push("there are uncommitted changes");
  }

  read("git", ["fetch", "--quiet", "--tags", "origin", MAIN]);

  if (
    read("git", ["rev-parse", "HEAD"]) !==
    read("git", ["rev-parse", `origin/${MAIN}`])
  ) {
    problems.push(
      `HEAD is not the same as origin/${MAIN} (pull or push first)`
    );
  }

  if (problems.length === 0) {
    console.log(green("✓ clean main, in sync with origin"));

    return;
  }

  if (!dryRun) {
    fail(`Can't release: ${problems.join("; ")}`);
  }

  for (const problem of problems) {
    console.log(yellow(`! ${problem} (ignored in a dry run)`));
  }
};

const lastTag = (): string | null => {
  try {
    return read("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"]);
  } catch {
    return null;
  }
};

const releaseNotes = (since: string | null): string =>
  read("git", [
    "log",
    "--no-merges",
    "--pretty=format:- %s",
    `--max-count=${MAX_NOTES}`,
    ...(since === null ? [] : [`${since}..HEAD`]),
  ]);

const liveUrl = (deployOutput: string): string | null => {
  const fromEnv = process.env.LIFESTASH_URL;

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return deployOutput.match(/https:\/\/\S+\.workers\.dev/)?.[0] ?? null;
};

const verify = async (url: string, version: string) => {
  step(`Checking ${url}/api/version`);

  for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/version`);
      const body = (await response.json()) as { version?: string };

      if (body.version === version) {
        console.log(green(`✓ live: ${version}`));

        return true;
      }

      console.log(dim(`still ${body.version ?? "?"}, waiting…`));
    } catch {
      console.log(dim("not reachable yet, waiting…"));
    }

    await sleep(VERIFY_DELAY_MS);
  }

  return false;
};

const main = async () => {
  preflight();

  const current = readVersion();
  const since = lastTag();

  step(`Changes since ${since ?? "the first commit"}`);
  const notes = releaseNotes(since);
  console.log(notes === "" ? dim("(no commits)") : notes);

  if (!dryRun) {
    step("Migrations not yet applied to production");
    await run("pnpm", [
      "exec",
      "wrangler",
      "d1",
      "migrations",
      "list",
      DB,
      "--remote",
    ]);
  }

  const bump = await chooseBump();
  const version =
    nextVersion(current, bump) ??
    fail(`package.json version "${current}" is not X.Y.Z`);
  const tag = `v${version}`;

  if (!dryRun) {
    const answer = await ask(
      `\nRelease ${bold(tag)} (from ${current})? [y/N] `
    );

    if (answer !== "y" && answer !== "yes") {
      fail("Cancelled");
    }
  }

  step("pnpm check");
  await run("pnpm", ["check"]);

  if (dryRun) {
    step(`Building ${tag} (dry run)`);
    writeVersion(current, version);

    try {
      await run("pnpm", ["build"]);
    } finally {
      writeVersion(version, current);
    }

    console.log(
      green(`\n✓ Dry run passed: ${tag} would build. Nothing was changed.`)
    );

    return;
  }

  step(`Bumping to ${tag}`);
  writeVersion(current, version);
  read("git", ["commit", "--quiet", "-am", `Release ${tag}`]);
  read("git", ["tag", "-a", tag, "-m", `${tag}\n\n${notes}`]);

  let deployed = false;

  try {
    step("Building");
    await run("pnpm", ["build"]);

    step("Applying migrations to production D1");
    await run("pnpm", [
      "exec",
      "wrangler",
      "d1",
      "migrations",
      "apply",
      DB,
      "--remote",
    ]);

    step("Deploying");
    const output = await run("pnpm", ["exec", "wrangler", "deploy"], {
      capture: true,
    });
    deployed = true;

    const url = liveUrl(output);

    if (url === null) {
      console.log(
        yellow("! Couldn't find the live URL; set LIFESTASH_URL to check it.")
      );
    } else if (!(await verify(url, version))) {
      console.log(
        yellow(`! ${url} doesn't report ${version} yet; check it by hand.`)
      );
    }
  } finally {
    if (!deployed) {
      console.log(yellow(`\nUndoing the ${tag} commit and tag.`));
      read("git", ["tag", "-d", tag]);
      read("git", ["reset", "--hard", "HEAD~1"]);
    }
  }

  step("Pushing main and the tag");

  try {
    read("git", ["push", "--quiet", "--follow-tags", "origin", MAIN]);
  } catch {
    // Production already runs the new version: keep the local commit and tag and say how to sync.
    fail(
      `${tag} is live, but pushing to origin failed. Push it by hand: git push --follow-tags origin ${MAIN}`
    );
  }

  console.log(green(`\n✓ Released ${tag}`));
};

try {
  await main();
} catch (error) {
  console.error(
    red(`\n✗ ${error instanceof Error ? error.message : String(error)}`)
  );
  process.exitCode = 1;
}

export type Bump = "patch" | "minor" | "major";

export const BUMPS: readonly Bump[] = ["patch", "minor", "major"];

export const isBump = (value: string): value is Bump =>
  BUMPS.some((bump) => bump === value);

/** The next X.Y.Z after `current`; null when `current` isn't plain X.Y.Z. */
export const nextVersion = (current: string, bump: Bump): string | null => {
  if (!/^\d+\.\d+\.\d+$/.test(current)) {
    return null;
  }

  const [major = 0, minor = 0, patch = 0] = current.split(".").map(Number);

  if (bump === "major") {
    return `${major + 1}.0.0`;
  }

  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
};

/** A typed answer to "patch, minor or major?": empty means patch, any prefix works ("mi"). */
export const parseBumpAnswer = (answer: string): Bump | null => {
  const normalised = answer.trim().toLowerCase();

  if (normalised === "") {
    return "patch";
  }

  return BUMPS.find((bump) => bump.startsWith(normalised)) ?? null;
};

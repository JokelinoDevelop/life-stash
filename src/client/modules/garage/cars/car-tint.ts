import type { Tint } from "@/components/app/tint";

/** Hero tints for cars without a photo (no neutral slate). */
const HERO_TINTS = [
  "blue",
  "teal",
  "purple",
  "green",
  "orange",
  "pink",
  "amber",
] as const satisfies readonly Tint[];

/** A stable tint per car name, so a car keeps its colour across visits. */
export const carTint = (name: string): Tint => {
  let hash = 0;

  for (const char of name.trim().toLocaleLowerCase()) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 1_000_003;
  }

  return HERO_TINTS[hash % HERO_TINTS.length] ?? "blue";
};

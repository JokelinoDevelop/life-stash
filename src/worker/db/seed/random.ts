/**
 * Deterministic pseudo-random numbers, so the same seed always produces the same data set.
 * Park–Miller "minimal standard" generator: plain arithmetic, exact in doubles.
 */
const MODULUS = 2_147_483_647;
const MULTIPLIER = 48_271;

export interface Random {
  /** A float in [0, 1). */
  next: () => number;
  /** An integer in [min, max], both inclusive. */
  int: (min: number, max: number) => number;
  /** A float in [min, max). */
  between: (min: number, max: number) => number;
  /** `value` nudged by up to ±`ratio` (0.1 → ±10%). */
  jitter: (value: number, ratio: number) => number;
  chance: (probability: number) => boolean;
  pick: <T>(list: readonly T[]) => T;
}

export const createRandom = (seed: number): Random => {
  let state = Math.abs(Math.trunc(seed)) % MODULUS || 1;

  const next = () => {
    state = (state * MULTIPLIER) % MODULUS;

    return (state - 1) / (MODULUS - 1);
  };

  const between = (min: number, max: number) => min + next() * (max - min);

  return {
    between,
    next,
    chance: (probability) => next() < probability,
    int: (min, max) => Math.floor(between(min, max + 1)),
    jitter: (value, ratio) => value * between(1 - ratio, 1 + ratio),
    pick: (list) => {
      const item = list[Math.floor(next() * list.length)];

      if (item === undefined) {
        throw new Error("Cannot pick from an empty list");
      }

      return item;
    },
  };
};

/** Days the weight chart can show: a month, three months, a year. */
export const WEIGHT_RANGES = ["30", "90", "365"] as const;

export type WeightRange = (typeof WEIGHT_RANGES)[number];

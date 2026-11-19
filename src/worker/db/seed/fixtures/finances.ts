import type { Currency } from "@shared/domain/money";

/** A spending habit the ledger seeder repeats over the last year. Amounts are major units. */
export interface LedgerHabit {
  category: string;
  currency: Currency;
  /** Descriptions to pick from, e.g. shop names. */
  descriptions: readonly string[];
  amount: number;
  /** ± share the amount varies by. */
  spread: number;
  /** `monthly` on `day`, or `timesPerMonth` on random days. */
  schedule: { monthly: number } | { timesPerMonth: number };
}

export const LEDGER_HABITS: readonly LedgerHabit[] = [
  {
    amount: 18_000,
    category: "Rent",
    currency: "MKD",
    descriptions: ["Rent"],
    schedule: { monthly: 1 },
    spread: 0,
  },
  {
    amount: 1900,
    category: "Groceries",
    currency: "MKD",
    descriptions: ["Tinex", "Vero", "Ramstore", "Stokomak", "Green market"],
    schedule: { timesPerMonth: 7 },
    spread: 0.6,
  },
  {
    amount: 3400,
    category: "Utilities",
    currency: "MKD",
    descriptions: ["EVN electricity"],
    schedule: { monthly: 18 },
    spread: 0.35,
  },
  {
    amount: 900,
    category: "Utilities",
    currency: "MKD",
    descriptions: ["Vodovod water"],
    schedule: { monthly: 12 },
    spread: 0.2,
  },
  {
    amount: 1499,
    category: "Utilities",
    currency: "MKD",
    descriptions: ["A1 internet"],
    schedule: { monthly: 5 },
    spread: 0,
  },
  {
    amount: 1300,
    category: "Eating out",
    currency: "MKD",
    descriptions: ["Dinner with team", "Pizza Bastion", "Lunch", "Coffee"],
    schedule: { timesPerMonth: 4 },
    spread: 0.6,
  },
  {
    amount: 15,
    category: "Subscriptions",
    currency: "EUR",
    descriptions: ["Figma"],
    schedule: { monthly: 15 },
    spread: 0,
  },
  {
    amount: 11.99,
    category: "Subscriptions",
    currency: "EUR",
    descriptions: ["Spotify"],
    schedule: { monthly: 9 },
    spread: 0,
  },
  {
    amount: 650,
    category: "Transport",
    currency: "MKD",
    descriptions: ["Taxi", "Bus card top-up"],
    schedule: { timesPerMonth: 2 },
    spread: 0.4,
  },
  {
    amount: 2500,
    category: "Shopping",
    currency: "MKD",
    descriptions: ["Clothes", "Home goods", "Books"],
    schedule: { timesPerMonth: 1 },
    spread: 0.7,
  },
  {
    amount: 1800,
    category: "Health",
    currency: "MKD",
    descriptions: ["Pharmacy", "Dentist"],
    schedule: { timesPerMonth: 0.5 },
    spread: 0.6,
  },
];

/** One-off spending, as days back from today. */
export const LEDGER_ONE_OFFS: readonly {
  daysAgo: number;
  category: string;
  currency: Currency;
  description: string;
  amount: number;
  notes?: string;
}[] = [
  {
    amount: 312.3,
    category: "Travel",
    currency: "EUR",
    daysAgo: 13,
    description: "Flights to Vienna",
  },
  {
    amount: 286,
    category: "Travel",
    currency: "EUR",
    daysAgo: 150,
    description: "Hotel in Ohrid",
    notes: "Three nights, July long weekend",
  },
  {
    amount: 74.5,
    category: "Travel",
    currency: "EUR",
    daysAgo: 230,
    description: "Train to Thessaloniki",
  },
];

/** Freelance income that isn't invoiced (small jobs paid directly). */
export const LEDGER_FREELANCE: readonly {
  daysAgo: number;
  description: string;
  amount: number;
}[] = [
  { amount: 180, daysAgo: 5, description: "Logo refresh" },
  { amount: 800, daysAgo: 16, description: "Code review session" },
  { amount: 350, daysAgo: 95, description: "Landing page fixes" },
  { amount: 420, daysAgo: 200, description: "Workshop" },
];

/** Salary from the employer, booked monthly. */
export const LEDGER_SALARY = {
  amount: 120_000,
  currency: "MKD",
  day: 25,
  description: "Salary ACME d.o.o.",
} as const;

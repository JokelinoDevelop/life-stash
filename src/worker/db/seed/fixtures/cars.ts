import type { CarFixture } from "./types";

/** Package names from the starter catalog. */
const OIL_SERVICE = "Oil service";
const BIG_SERVICE = "Big service";

const GOLF_SHOP = "Auto Centar Kisela Voda";
const CLIO_SHOP = "Renault Servis";

/**
 * The demo garage. Each car shows off different states of the app:
 * - Golf: long, busy history; overdue oil service, insurance due within a week.
 * - Clio: lighter use; registration overdue, spark plugs due soon, a service paid in EUR,
 *   and no odometer reading for 7 weeks (triggers the odometer nudge).
 * - Octavia: just bought, nothing logged yet (empty states).
 * - Punto: sold years ago, archived.
 */
export const CAR_FIXTURES: CarFixture[] = [
  {
    key: "golf",
    details: {
      color: "Deep black pearl",
      fuelType: "diesel",
      make: "Volkswagen",
      model: "Golf 7 1.6 TDI",
      name: "Golf",
      notes: "Bought from a private seller; full service book.",
      plate: "SK 4821 AB",
      vin: "WVWZZZAUZGW123456",
      year: 2016,
    },
    currency: "MKD",
    purchase: {
      monthsAgo: 79,
      odometerKm: 98_400,
      precision: "month",
      price: { amount: 640_000, currency: "MKD" },
    },
    kmPerYear: 16_000,
    maintenance: [
      {
        everyKm: 15_000,
        everyMonths: 12,
        labour: 1200,
        nextDueInDays: -9,
        package: OIL_SERVICE,
        shop: GOLF_SHOP,
      },
      {
        everyKm: 120_000,
        everyMonths: 60,
        labour: 6500,
        nextDueInDays: 610,
        package: BIG_SERVICE,
        shop: GOLF_SHOP,
      },
    ],
    visits: [
      {
        kind: "repair",
        labour: 1800,
        items: ["Brake pads (front)", "Brake discs", "Brake fluid"],
        monthsAgo: 31,
        notes: "Grinding noise from the front left wheel.",
        shop: "Brake Pro",
      },
      {
        kind: "repair",
        labour: 7000,
        custom: [
          { cost: 18_500, label: "Clutch kit", notes: "LuK, with flywheel" },
        ],
        monthsAgo: 22,
        shop: GOLF_SHOP,
      },
      {
        blankTotal: true,
        kind: "maintenance",
        items: ["Battery"],
        monthsAgo: 14,
        notes: "Replaced it myself.",
      },
      {
        kind: "maintenance",
        labour: 1200,
        custom: [
          {
            cost: 21_600,
            label: "Tyres",
            notes: "Michelin CrossClimate 2, 205/55 R16",
          },
        ],
        monthsAgo: 4,
        shop: "Gume Centar",
      },
    ],
    previousOwner: [
      {
        items: ["Engine oil", "Oil filter", "Air filter"],
        odometerKm: 61_200,
        yearsBeforePurchase: 2,
      },
      {
        items: ["Engine oil", "Oil filter", "Cabin filter", "Wiper blades"],
        notes: "Stamp in the service book.",
        odometerKm: 82_900,
        yearsBeforePurchase: 1,
      },
    ],
    renewals: [
      {
        amount: 10_400,
        kind: "insurance",
        nextDueInDays: 6,
        notes: "MTPL + glass cover",
        title: "Insurance",
      },
      {
        amount: 3900,
        kind: "registration",
        nextDueInDays: 47,
        title: "Registration",
      },
    ],
    fuel: {
      fillEveryKm: 700,
      litresPer100Km: 5.4,
      logsOdometer: true,
      months: 24,
      pricePerLitre: 74,
    },
    extras: [
      {
        amount: 160,
        category: "tolls",
        notes: "Skopje–Ohrid",
        timesPerYear: 6,
      },
      {
        amount: 120,
        category: "parking",
        notes: "City centre",
        timesPerYear: 10,
      },
      { amount: 350, category: "other", notes: "Car wash", timesPerYear: 5 },
    ],
    readings: { count: 9, everyWeeks: 8, lastWeeksAgo: 1 },
    reminders: [
      {
        dueInDays: 12,
        item: "Tyres",
        kind: "other",
        title: "Swap to winter tyres",
      },
    ],
  },
  {
    key: "clio",
    details: {
      color: "Flame red",
      fuelType: "petrol",
      make: "Renault",
      model: "Clio V 1.0 TCe",
      name: "Clio",
      plate: "SK 7310 CD",
      year: 2020,
    },
    currency: "MKD",
    purchase: {
      monthsAgo: 74,
      odometerKm: 15,
      precision: "day",
      price: { amount: 14_900, currency: "EUR" },
    },
    kmPerYear: 9000,
    maintenance: [
      {
        everyKm: 15_000,
        everyMonths: 12,
        labour: 1000,
        nextDueInDays: 140,
        package: OIL_SERVICE,
        shop: CLIO_SHOP,
      },
      {
        everyKm: 60_000,
        everyMonths: 48,
        item: "Spark plugs",
        labour: 800,
        nextDueInDays: 25,
        shop: CLIO_SHOP,
      },
    ],
    visits: [
      {
        kind: "repair",
        labour: 1200,
        items: ["Brake pads (front)"],
        monthsAgo: 20,
        shop: "Brake Pro",
      },
      {
        currency: "EUR",
        kind: "maintenance",
        labour: 25,
        custom: [
          { cost: 18, label: "Wiper blades" },
          { cost: 22, label: "Cabin filter" },
        ],
        monthsAgo: 16,
        notes: "On holiday in Thessaloniki.",
        shop: "Kinetic Auto",
      },
    ],
    renewals: [
      {
        amount: 7800,
        kind: "insurance",
        nextDueInDays: 120,
        title: "Insurance",
      },
      {
        amount: 3100,
        kind: "registration",
        nextDueInDays: -3,
        title: "Registration",
      },
    ],
    fuel: {
      fillEveryKm: 450,
      litresPer100Km: 6.1,
      logsOdometer: false,
      months: 12,
      pricePerLitre: 82,
    },
    readings: { count: 6, everyWeeks: 12, lastWeeksAgo: 7 },
    reminders: [
      { dueInKm: 800, kind: "other", title: "Check tyre pressure and tread" },
    ],
  },
  {
    key: "octavia",
    details: {
      color: "Moon white",
      fuelType: "diesel",
      make: "Škoda",
      model: "Octavia Combi 2.0 TDI",
      name: "Octavia",
      plate: "SK 1095 EF",
      year: 2021,
    },
    currency: "MKD",
    purchase: {
      monthsAgo: 0,
      odometerKm: 84_200,
      precision: "day",
      price: { amount: 1_150_000, currency: "MKD" },
    },
    kmPerYear: 20_000,
  },
  {
    key: "punto",
    details: {
      color: "Silver",
      fuelType: "lpg",
      make: "Fiat",
      model: "Grande Punto 1.4",
      name: "Punto",
      plate: "SK 2210 GH",
      year: 2007,
    },
    currency: "MKD",
    purchase: { monthsAgo: 170, odometerKm: 34_000, precision: "year" },
    sold: { monthsAgo: 88 },
    kmPerYear: 12_000,
    maintenance: [
      {
        everyKm: 15_000,
        everyMonths: 12,
        labour: 800,
        nextDueInDays: 90,
        package: OIL_SERVICE,
        shop: "Servis Bojan",
      },
    ],
    renewals: [
      { amount: 6200, kind: "insurance", nextDueInDays: 0, title: "Insurance" },
      {
        amount: 2800,
        kind: "registration",
        nextDueInDays: 0,
        title: "Registration",
      },
    ],
    fuel: {
      fillEveryKm: 500,
      litresPer100Km: 8.5,
      logsOdometer: true,
      months: 12,
      pricePerLitre: 38,
    },
  },
];

/**
 * Typical parts prices in MKD (major units) for catalog items, used when a visit line is just an
 * item name. Names must match the starter catalog in `modules/auth/catalog-seed.ts`.
 */
export const ITEM_PRICES_MKD = {
  "Air filter": 750,
  Battery: 6900,
  "Brake discs": 5200,
  "Brake fluid": 900,
  "Brake pads (front)": 2800,
  "Brake pads (rear)": 2400,
  "Cabin filter": 650,
  Coolant: 1100,
  "Engine oil": 2600,
  "Fuel filter": 1400,
  "Gearbox oil": 2200,
  "Oil filter": 550,
  "Spark plugs": 1800,
  "Tensioner and idler rollers": 4300,
  "Timing belt": 3900,
  Tyres: 21_600,
  "Water pump": 4800,
  "Wiper blades": 900,
} as const satisfies Record<string, number>;

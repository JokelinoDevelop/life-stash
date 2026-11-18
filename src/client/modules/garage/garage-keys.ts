/** Query keys for the Garage module. Every garage mutation invalidates `garageKeys.all`. */
export const garageKeys = {
  all: ["garage"] as const,
  car: (carId: string) => ["garage", "cars", carId] as const,
  carOverview: (carId: string) =>
    ["garage", "cars", carId, "overview"] as const,
  cars: (includeArchived: boolean) =>
    ["garage", "cars", "list", { includeArchived }] as const,
};

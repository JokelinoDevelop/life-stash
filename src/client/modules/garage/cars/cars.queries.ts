import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { api, unwrap } from "@/lib/api";

import { garageKeys } from "../garage-keys";

export const carsQuery = (includeArchived: boolean) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.cars.$get({
          query: { includeArchived: includeArchived ? "true" : "false" },
        })
      ),
    queryKey: garageKeys.cars(includeArchived),
  });

export const carQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(api.garage.cars[":carId"].$get({ param: { carId } })),
    queryKey: garageKeys.car(carId),
  });

export const carOverviewQuery = (carId: string) =>
  queryOptions({
    queryFn: async () =>
      await unwrap(
        api.garage.cars[":carId"].overview.$get({ param: { carId } })
      ),
    queryKey: garageKeys.carOverview(carId),
  });

/** Invalidates all Garage data after a mutation. Cheap at this scale and never stale. */
export const useInvalidateGarage = () => {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: garageKeys.all });
  };
};

export const useArchiveCar = (carId: string) => {
  const invalidate = useInvalidateGarage();

  return useMutation({
    mutationFn: async (soldDate: string | null) =>
      await unwrap(
        api.garage.cars[":carId"].archive.$post({
          json: { soldDate },
          param: { carId },
        })
      ),
    onSuccess: invalidate,
  });
};

export const useUnarchiveCar = (carId: string) => {
  const invalidate = useInvalidateGarage();

  return useMutation({
    mutationFn: async () =>
      await unwrap(
        api.garage.cars[":carId"].unarchive.$post({ param: { carId } })
      ),
    onSuccess: invalidate,
  });
};

export const useDeleteCar = (carId: string) => {
  const invalidate = useInvalidateGarage();

  return useMutation({
    mutationFn: async () =>
      await unwrap(api.garage.cars[":carId"].$delete({ param: { carId } })),
    onSuccess: invalidate,
  });
};

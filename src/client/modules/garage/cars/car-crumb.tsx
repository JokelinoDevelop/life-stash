import { useQuery } from "@tanstack/react-query";

import { CarMonogram } from "./car-monogram";
import { carQuery } from "./cars.queries";

/** Car monogram and name for a dialog crumb ("Golf › New expense"). */
export const CarCrumb = ({ carId }: { carId: string }) => {
  const car = useQuery(carQuery(carId));

  if (car.data === undefined) {
    return null;
  }

  return (
    <>
      <CarMonogram name={car.data.car.name} size="sm" />
      <span className="truncate">{car.data.car.name}</span>
    </>
  );
};

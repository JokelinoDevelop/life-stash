import { CarMonogram } from "./car-monogram";

/** Monogram, name and model line under the page bar (both breakpoints). */
export const CarHeading = ({
  car,
}: {
  car: {
    make: string | null;
    model: string | null;
    name: string;
    plate: string | null;
    year: number | null;
  };
}) => {
  const model = [car.year, car.make, car.model]
    .filter((part) => part !== null)
    .join(" ");

  return (
    <div className="flex items-center gap-3 md:px-7 md:pt-6">
      <CarMonogram className="md:hidden" name={car.name} size="lg" />
      <CarMonogram className="hidden md:flex" name={car.name} />
      <div className="min-w-0">
        <p className="truncate text-xl font-semibold tracking-tight md:text-lg">
          {car.name}
        </p>
        <p className="text-muted-foreground truncate text-sm tabular-nums">
          {[model, car.plate]
            .filter((part) => part !== null && part !== "")
            .join(" · ")}
        </p>
      </div>
    </div>
  );
};

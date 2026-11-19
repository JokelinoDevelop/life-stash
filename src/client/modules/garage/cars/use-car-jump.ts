import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { isDialogOpen, isEditable } from "@/hooks/use-hotkey";

import { carsQuery } from "./cars.queries";

/** How long after "g" a digit still counts as part of the sequence. */
const SEQUENCE_MS = 1200;

/** "G then 1–9" opens that car (in the order of the car list). */
export const useCarJump = (): void => {
  const navigate = useNavigate();
  const cars = useQuery(carsQuery(false));
  const startedAt = useRef(0);
  const list = cars.data?.cars;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modified = event.metaKey || event.ctrlKey || event.altKey;

      if (modified || isEditable(event.target) || isDialogOpen()) {
        return;
      }

      if (event.key.toLowerCase() === "g") {
        startedAt.current = Date.now();

        return;
      }

      const recent = Date.now() - startedAt.current < SEQUENCE_MS;
      const car = list?.[Number(event.key) - 1];
      startedAt.current = 0;

      if (recent && /^[1-9]$/u.test(event.key) && car !== undefined) {
        event.preventDefault();
        void navigate({ params: { carId: car.id }, to: "/garage/cars/$carId" });
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [list, navigate]);
};

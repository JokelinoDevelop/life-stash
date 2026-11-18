import { useTranslation } from "react-i18next";

import { FieldError } from "@/components/ui/field";

const VALIDATION_KEYS = [
  "validation.required",
  "validation.number",
  "validation.positive",
  "validation.date",
  "validation.year",
  "validation.tooLong",
] as const;

type ValidationKey = (typeof VALIDATION_KEYS)[number];

const isValidationKey = (value: string): value is ValidationKey =>
  VALIDATION_KEYS.some((key) => key === value);

interface FieldIssue {
  message?: string;
}

const messageOf = (error: unknown): string | undefined => {
  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return undefined;
};

/** Renders field errors; form schemas use `validation.*` keys which are translated here. */
export const FieldErrors = ({
  errors,
  show,
}: {
  errors: unknown[];
  show: boolean;
}) => {
  const { t } = useTranslation();

  if (!show) {
    return null;
  }

  const issues: FieldIssue[] = errors.map((error) => {
    const message = messageOf(error);

    return {
      message:
        message !== undefined && isValidationKey(message)
          ? t(message)
          : message,
    };
  });

  return <FieldError errors={issues} />;
};

/** A formatted amount split so the currency can be styled apart from the figure. */
export interface MoneyPart {
  kind: "currency" | "figure";
  text: string;
}

/**
 * Splits `Intl.NumberFormat#formatToParts` output into the currency (symbol or
 * code) and the figure around it, merging everything else (digits, group and
 * decimal separators, minus sign) into figure runs. The spaces next to the
 * currency belong to it, so styling it smaller never leaves a wide gap.
 */
export const splitMoneyParts = (
  parts: readonly Intl.NumberFormatPart[]
): MoneyPart[] => {
  const result: MoneyPart[] = [];

  for (const part of parts) {
    const isSpace = part.type === "literal" && part.value.trim() === "";
    const previous = result.at(-1);
    const followsCurrency = isSpace && previous?.kind === "currency";

    const kind: MoneyPart["kind"] =
      part.type === "currency" || followsCurrency ? "currency" : "figure";

    if (previous !== undefined && previous.kind === kind) {
      previous.text += part.value;
    } else {
      result.push({ kind, text: part.value });
    }
  }

  // A space just before a trailing currency ("1.170 ден.") joins the currency.
  for (let index = 1; index < result.length; index += 1) {
    const part = result[index];
    const before = result[index - 1];

    if (part?.kind === "currency" && before?.kind === "figure") {
      const trimmed = before.text.trimEnd();
      const space = before.text.slice(trimmed.length);

      if (space !== "") {
        before.text = trimmed;
        part.text = `${space}${part.text}`;
      }
    }
  }

  return result.filter((part) => part.text !== "");
};

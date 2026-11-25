import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Choice<T extends string> {
  label: string;
  value: T;
}

/** A compact select for a settings row: picking saves at once (no Save button). */
export const ChoiceSelect = <T extends string>({
  choices,
  disabled = false,
  id,
  onChange,
  value,
}: {
  choices: readonly Choice<T>[];
  disabled?: boolean;
  id: string;
  onChange: (value: T) => void;
  value: T | undefined;
}) => (
  <Select
    disabled={disabled}
    items={choices}
    onValueChange={(next) => {
      const picked = choices.find((choice) => choice.value === next);

      if (picked !== undefined && picked.value !== value) {
        onChange(picked.value);
      }
    }}
    value={value ?? null}
  >
    <SelectTrigger id={id} size="sm">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {choices.map((choice) => (
        <SelectItem key={choice.value} value={choice.value}>
          {choice.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

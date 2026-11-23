/**
 * The keyboard and screen-reader side of a scrubbable bar chart: a visually
 * hidden range input over the bars (arrow keys pick a month, the value text
 * reads it out). Pointer scrubbing is handled by `useScrub` on the chart.
 */
export const ScrubRange = ({
  label,
  last,
  onChange,
  value,
  valueText,
}: {
  label: string;
  /** Index of the last month that can be picked. */
  last: number;
  onChange: (index: number) => void;
  value: number;
  valueText: string;
}) => (
  <input
    aria-label={label}
    aria-valuetext={valueText}
    className="sr-only"
    max={last}
    min={0}
    onChange={(event) => {
      onChange(Number(event.target.value));
    }}
    step={1}
    type="range"
    value={value}
  />
);

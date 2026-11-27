const WIDTH = 48;
const HEIGHT = 16;

/** A tiny trend line (no axes), scaled to its own highest value. */
export const Sparkline = ({
  className,
  label,
  values,
}: {
  className?: string;
  label: string;
  values: readonly number[];
}) => {
  const highest = Math.max(1, ...values);
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0;

  const points = values
    .map(
      (value, index) =>
        `${(index * step).toFixed(1)},${(HEIGHT - 1 - (value / highest) * (HEIGHT - 2)).toFixed(1)}`
    )
    .join(" ");

  return (
    <svg
      aria-label={label}
      className={className}
      height={HEIGHT}
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
    >
      <polyline
        fill="none"
        points={points}
        stroke="var(--chart-1)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

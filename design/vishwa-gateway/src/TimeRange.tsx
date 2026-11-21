import { ChevronDown } from "lucide-react";
import "./time-range.css";

export const timeRanges = ["7D", "30D", "3M", "6M", "1Y", "All"] as const;
export type TimeRange = (typeof timeRanges)[number];

export function timeRangeLabel(range: TimeRange) {
  return {
    "7D": "Last 7 days",
    "30D": "Last 30 days",
    "3M": "Last 3 months",
    "6M": "Last 6 months",
    "1Y": "Last year",
    All: "All time",
  }[range];
}

// Calendar boundaries are UTC. Keep the available source history intact; wider
// ranges include existing records and never extrapolate additional traffic.
export function timeRangeStart(range: TimeRange, endDate: number) {
  if (range === "All") return Number.NEGATIVE_INFINITY;
  const end = new Date(endDate);
  const start = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (range === "7D" || range === "30D") return start - (range === "7D" ? 6 : 29) * 86_400_000;
  const months = range === "3M" ? 3 : range === "6M" ? 6 : 12;
  const monthStart = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - months, 1));
  const monthEnd = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return Date.UTC(
    monthStart.getUTCFullYear(),
    monthStart.getUTCMonth(),
    Math.min(end.getUTCDate(), monthEnd),
  );
}

export function TimeRangeSelect({
  value,
  onChange,
  label,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  label: string;
}) {
  return (
    <label className="cw-time-range">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as TimeRange)}
      >
        {timeRanges.map((range) => (
          <option key={range} value={range}>
            {range}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  );
}

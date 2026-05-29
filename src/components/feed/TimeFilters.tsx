"use client";
import { TIME_FILTERS } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";
import type { TimeFilter } from "@/types/feed";

interface TimeFiltersProps {
  active: TimeFilter;
  onChange: (f: TimeFilter) => void;
}

const filterWrapperStyle: React.CSSProperties = {
  display: "flex", gap: "6px", overflowX: "auto",
  padding: "0 16px", marginBottom: "14px",
};

export function TimeFilters({ active, onChange }: TimeFiltersProps) {
  return (
    <div style={filterWrapperStyle}>
      {TIME_FILTERS.map(({ value, label }) => (
        <Chip key={value} $active={active === value} onClick={() => onChange(value as TimeFilter)}>
          {label}
        </Chip>
      ))}
    </div>
  );
}

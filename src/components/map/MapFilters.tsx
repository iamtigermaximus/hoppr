"use client";
import styled from "styled-components";
import { Chip } from "@/components/ui/Chip";
import { Faders, X } from "@phosphor-icons/react";

const VENUE_TYPES = [
  { key: "PUB", label: "Pubs" },
  { key: "CLUB", label: "Clubs" },
  { key: "COCKTAIL_LOUNGE", label: "Cocktails" },
  { key: "SPORTS_BAR", label: "Sports" },
  { key: "KARAOKE_BAR", label: "Karaoke" },
  { key: "WINE_BAR", label: "Wine" },
  { key: "BREWERY_TAPROOM", label: "Brewery" },
  { key: "LIVE_MUSIC", label: "Live Music" },
];

const CROWD_FILTERS = [
  { key: "BUSY", label: "Busy Now", levels: ["BUSY", "PACKED", "AT_CAPACITY"] },
  { key: "QUIET", label: "Quiet Gems", levels: ["QUIET", "GETTING_BUSY"] },
];

export interface MapFilterState {
  types: string[];
  openNow: boolean;
  hasEvents: boolean;
  crowdFilter: string | null; // "BUSY" | "QUIET" | null
}

interface MapFiltersProps {
  value: MapFilterState;
  onChange: (state: MapFilterState) => void;
}

const FiltersBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  padding: 8px 12px;
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1px solid #262626;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterLabel = styled.span`
  color: #737373;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  margin-right: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background: #333;
  flex-shrink: 0;
  margin: 0 2px;
`;

const ToggleChip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  background: ${({ $active }) => ($active ? "#7c3aed" : "#1a1a1a")};
  color: ${({ $active }) => ($active ? "#fff" : "#a3a3a3")};
  border: 1px solid ${({ $active }) => ($active ? "#7c3aed" : "#262626")};
  transition: all 0.15s;
  &:hover {
    border-color: ${({ $active }) => ($active ? "#7c3aed" : "#525252")};
  }
`;

const hasAnyFilter = (state: MapFilterState) =>
  state.types.length > 0 || state.openNow || state.hasEvents || state.crowdFilter !== null;

export function MapFilters({ value, onChange }: MapFiltersProps) {
  const toggleType = (key: string) => {
    const next = value.types.includes(key)
      ? value.types.filter((t) => t !== key)
      : [...value.types, key];
    onChange({ ...value, types: next });
  };

  const toggleOpenNow = () => {
    onChange({ ...value, openNow: !value.openNow });
  };

  const toggleHasEvents = () => {
    onChange({ ...value, hasEvents: !value.hasEvents });
  };

  const toggleCrowdFilter = (key: string) => {
    const next = value.crowdFilter === key ? null : key;
    onChange({ ...value, crowdFilter: next });
  };

  const clearAll = () => {
    onChange({ types: [], openNow: false, hasEvents: false, crowdFilter: null });
  };

  return (
    <FiltersBar>
      <FilterLabel>
        <Faders size={12} /> Filters
      </FilterLabel>

      {VENUE_TYPES.map((t) => (
        <Chip key={t.key} $active={value.types.includes(t.key)} onClick={() => toggleType(t.key)} type="button">
          {t.label}
        </Chip>
      ))}

      <Divider />

      <ToggleChip $active={value.openNow} onClick={toggleOpenNow}>
        Open Now
      </ToggleChip>

      <ToggleChip $active={value.hasEvents} onClick={toggleHasEvents}>
        Events Tonight
      </ToggleChip>

      <Divider />

      {CROWD_FILTERS.map((c) => (
        <ToggleChip key={c.key} $active={value.crowdFilter === c.key} onClick={() => toggleCrowdFilter(c.key)}>
          {c.label}
        </ToggleChip>
      ))}

      {hasAnyFilter(value) && (
        <ToggleChip $active={false} onClick={clearAll} style={{ color: "#ef4444" }}>
          <X size={11} /> Clear
        </ToggleChip>
      )}
    </FiltersBar>
  );
}

/** Return the composite crowd level thresholds for the given crowd filter key, or null. */
export function getCrowdLevelThresholds(filter: string | null): { minScore: number; maxScore?: number } | null {
  if (filter === "BUSY") return { minScore: 30 };
  if (filter === "QUIET") return { minScore: 0, maxScore: 29 };
  return null;
}

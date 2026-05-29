"use client";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Users, Heart, MusicNotes, Clock, Microphone, Pen, BeerBottle } from "@phosphor-icons/react";
import { CATEGORIES } from "@/lib/constants";

const Grid = styled.div`
  display: flex; gap: 8px;
  overflow-x: auto;
  padding: 0 16px;

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    overflow-x: visible;
    padding: 0;
  }
`;

const CategoryCard = styled.div`
  min-width: 76px; height: 76px;
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 6px; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  &:hover { border-color: #7c3aed44; background: #1e1e1e; }

  @media (min-width: 768px) {
    min-width: unset; height: 88px;
  }
`;

const iconMap: Record<string, any> = {
  Users, Heart, MusicNotes, Clock, Microphone, Pen, BeerBottle,
};

export function CategoryGrid() {
  const router = useRouter();

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <SectionHeader title="Browse categories" />
      <Grid>
        {CATEGORIES.map((cat) => {
          const IconComponent = iconMap[cat.icon] || Users;
          return (
            <CategoryCard key={cat.key} onClick={() => router.push(`/discover`)}>
              <IconComponent size={22} color="#737373" weight="regular" />
              <div style={{ color: "#737373", fontSize: "10px", fontWeight: 500 }}>{cat.label}</div>
            </CategoryCard>
          );
        })}
      </Grid>
    </div>
  );
}

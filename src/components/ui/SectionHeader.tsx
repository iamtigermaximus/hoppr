"use client";
import styled from "styled-components";

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 16px;
`;

const Title = styled.span`color: var(--color-text-primary, #fff); font-weight: 700; font-size: 14px;`;
const SeeAll = styled.span`
  color: #7c3aed; font-size: 11px; font-weight: 500; cursor: pointer;
  &:hover { text-decoration: underline; }
`;

export function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <Row>
      <Title>{title}</Title>
      {onSeeAll && <SeeAll onClick={onSeeAll}>See all →</SeeAll>}
    </Row>
  );
}

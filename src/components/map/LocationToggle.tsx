"use client";
import styled from "styled-components";
import { Broadcast } from "@phosphor-icons/react";

const ToggleContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;

  @media (max-width: 480px) {
    top: 8px;
    right: 8px;
  }
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid
    ${({ $active }) =>
      $active ? "#10b981" : "rgba(255,255,255,0.1)"};
  background: ${({ $active }) =>
    $active
      ? "rgba(16,185,129,0.15)"
      : "rgba(10,10,10,0.85)"};
  color: ${({ $active }) => ($active ? "#10b981" : "#a3a3a3")};
  backdrop-filter: blur(8px);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;

  &:hover {
    background: ${({ $active }) =>
      $active
        ? "rgba(16,185,129,0.2)"
        : "rgba(20,20,20,0.9)"};
  }

  @media (max-width: 480px) {
    padding: 6px 10px;
    font-size: 10px;
  }
`;

const StatusText = styled.div`
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 10px;
  color: #a3a3a3;
  text-align: center;
  max-width: 200px;
`;

interface LocationToggleProps {
  isSharing: boolean;
  presenceCount: number;
  onToggle: () => void;
}

export default function LocationToggle({
  isSharing,
  presenceCount,
  onToggle,
}: LocationToggleProps) {
  return (
    <ToggleContainer>
      <ToggleButton $active={isSharing} onClick={onToggle}>
        {isSharing ? (
          <>
            <Broadcast size={14} weight="fill" />
            Sharing Location
          </>
        ) : (
          <>
            <Broadcast size={14} />
            Share Location
          </>
        )}
      </ToggleButton>
      {isSharing && (
        <StatusText>
          {presenceCount > 0
            ? `${presenceCount} people nearby`
            : "You're contributing crowd data"}
        </StatusText>
      )}
    </ToggleContainer>
  );
}

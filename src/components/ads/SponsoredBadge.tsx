"use client";
import styled from "styled-components";
import { Megaphone } from "@phosphor-icons/react";

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #a78bfa;
  background: rgba(124, 58, 237, 0.12);
  padding: 2px 6px;
  border-radius: 3px;
`;

export default function SponsoredBadge() {
  return (
    <Wrapper>
      <Megaphone size={10} weight="fill" />
      Sponsored
    </Wrapper>
  );
}

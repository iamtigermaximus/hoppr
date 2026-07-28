"use client";

import { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";

interface BenefitItem {
  item: string;
  discountedPrice: number;
  originalPrice: number;
  description?: string;
}

interface ActivationTimerProps {
  expiresAt: string;
  barName: string;
  promoTitle: string;
  benefits: BenefitItem[];
  onExpire: () => void;
}

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 1; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const TimerRing = styled.div`
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 3px solid #7c3aed;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 1s ease-in-out infinite;
  margin-bottom: 24px;
  position: relative;
`;

const RingGlow = styled.div`
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid rgba(124, 58, 237, 0.3);
  animation: ${pulse} 1s ease-in-out 0.3s infinite;
`;

const TimerText = styled.div`
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  font-variant-numeric: tabular-nums;
`;

const VenueName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #7c3aed;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
`;

const PromoTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 20px 0;
  text-align: center;
`;

const Instruction = styled.p`
  color: #a3a3a3;
  font-size: 13px;
  margin-bottom: 20px;
  text-align: center;
`;

const BenefitsList = styled.div`
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BenefitItemCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BenefitInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const BenefitName = styled.span`
  color: #fff;
  font-size: 14px;
  font-weight: 600;
`;

const BenefitDesc = styled.span`
  color: #737373;
  font-size: 11px;
  margin-top: 2px;
`;

const BenefitPrice = styled.div`
  text-align: right;
`;

const DiscountedPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #10b981;
`;

const OriginalPrice = styled.div`
  font-size: 12px;
  color: #737373;
  text-decoration: line-through;
`;

const ActivationTimer = ({
  expiresAt,
  barName,
  promoTitle,
  benefits,
  onExpire,
}: ActivationTimerProps) => {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpired = useRef(false);

  useEffect(() => {
    const expiryTime = new Date(expiresAt).getTime();

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((expiryTime - Date.now()) / 1000),
      );
      setSecondsLeft(remaining);

      if (remaining <= 0 && !hasExpired.current) {
        hasExpired.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        onExpire();
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 250);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [expiresAt, onExpire]);

  return (
    <Overlay>
      <TimerRing>
        <RingGlow />
        <TimerText>{secondsLeft}</TimerText>
      </TimerRing>

      <VenueName>{barName}</VenueName>
      <PromoTitle>{promoTitle}</PromoTitle>

      <Instruction>
        Show this screen to your bartender
      </Instruction>

      {benefits.length > 0 && (
        <BenefitsList>
          {benefits.map((b, i) => (
            <BenefitItemCard key={i}>
              <BenefitInfo>
                <BenefitName>{b.item}</BenefitName>
                {b.description && (
                  <BenefitDesc>{b.description}</BenefitDesc>
                )}
              </BenefitInfo>
              <BenefitPrice>
                <DiscountedPrice>{b.discountedPrice}€</DiscountedPrice>
                <OriginalPrice>{b.originalPrice}€</OriginalPrice>
              </BenefitPrice>
            </BenefitItemCard>
          ))}
        </BenefitsList>
      )}
    </Overlay>
  );
};

export default ActivationTimer;

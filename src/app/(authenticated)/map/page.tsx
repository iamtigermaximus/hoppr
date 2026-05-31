"use client";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";

const HeatMap = dynamic(
  () =>
    import("@/components/map/HeatMap").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#737373",
          fontSize: "14px",
        }}
      >
        Loading map...
      </div>
    ),
  },
);

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 56px - 56px);
  max-width: 100%;

  @media (min-width: 768px) {
    height: calc(100dvh - 56px);
  }
`;

const Header = styled.div`
  padding: 12px 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-weight: 800;
  font-size: 18px;
  color: var(--color-text-primary, #fff);
  margin: 0;
`;

const Subtitle = styled.span`
  font-size: 11px;
  color: #737373;
  font-weight: 500;
`;

const MapArea = styled.div`
  flex: 1;
  padding: 0 8px 8px;

  @media (min-width: 768px) {
    padding: 0 16px 16px;
  }
`;

export default function MapPage() {
  const { lat, lng } = useGeolocation();

  return (
    <PageWrapper>
      <Header>
        <div>
          <Title>Crowd Heat Map</Title>
          <Subtitle>See which venues are busy right now</Subtitle>
        </div>
      </Header>
      <MapArea>
        <HeatMap userLat={lat} userLng={lng} />
      </MapArea>
    </PageWrapper>
  );
}

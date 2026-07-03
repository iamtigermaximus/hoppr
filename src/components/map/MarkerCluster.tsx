"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { VenueCrowdScore } from "@/hooks/useCrowdScores";

// Dark-theme cluster overrides injected as a style tag
const CLUSTER_STYLES = `
  .marker-cluster div {
    background: rgba(124, 58, 237, 0.85) !important;
    border: 2px solid rgba(167, 139, 250, 0.6) !important;
    color: #fff !important;
    font-family: system-ui, sans-serif;
    font-weight: 700;
    font-size: 14px;
  }
  .marker-cluster-small div { background: rgba(16, 185, 129, 0.8) !important; border-color: rgba(52, 211, 153, 0.5) !important; }
  .marker-cluster-medium div { background: rgba(245, 158, 11, 0.85) !important; border-color: rgba(251, 191, 36, 0.6) !important; }
  .marker-cluster-large div { background: rgba(239, 68, 68, 0.8) !important; border-color: rgba(248, 113, 113, 0.5) !important; }
  .venue-cluster-tooltip {
    background: rgba(10, 10, 10, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
    color: #fff !important;
    font-size: 12px !important;
    padding: 6px 10px !important;
    box-shadow: none !important;
  }
  .venue-cluster-tooltip::before {
    border-top-color: rgba(10, 10, 10, 0.95) !important;
  }
`;

interface MarkerClusterProps {
  venues: VenueCrowdScore[];
}

/**
 * Imperative wrapper around L.markerClusterGroup for react-leaflet v5.
 * Creates circle markers in a cluster group that auto-aggregates at low zoom.
 */
export default function MarkerCluster({ venues }: MarkerClusterProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const prevVenueIds = useRef<Set<string>>(new Set());

  // Inject dark-theme cluster styles once
  useEffect(() => {
    const styleId = "markercluster-dark-theme";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = CLUSTER_STYLES;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, []);

  // Create cluster group on mount
  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      // Show a preview of clustered venues on hover
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let sizeClass = "marker-cluster-small";
        if (count >= 10) sizeClass = "marker-cluster-medium";
        if (count >= 30) sizeClass = "marker-cluster-large";

        // Build a short preview of venue names inside this cluster (max 3)
        const children = cluster.getAllChildMarkers();
        const names = children
          .slice(0, 3)
          .map((m: any) => m._venueName || "")
          .filter(Boolean);
        const preview = names.length > 0
          ? names.join(", ") + (count > 3 ? ` +${count - 3} more` : "")
          : `${count} venue${count !== 1 ? "s" : ""}`;

        return L.divIcon({
          html: `<div title="${preview.replace(/"/g, "&quot;")}"><span>${count}</span></div>`,
          className: `marker-cluster ${sizeClass}`,
          iconSize: L.point(40, 40),
        });
      },
    });

    map.addLayer(group);
    clusterGroupRef.current = group;

    return () => {
      map.removeLayer(group);
      group.clearLayers();
    };
  }, [map]);

  // Sync markers whenever venues change
  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    const currentIds = new Set(venues.map((v) => v.id));

    // Clear and rebuild markers (simplest approach for <200 venues)
    group.clearLayers();

    venues.forEach((venue) => {
      if (venue.lat == null || venue.lng == null) return;

      // Compute color and size from crowd level
      const level = venue.computedLevel || venue.crowdLevel;
      const colorMap: Record<string, string> = {
        QUIET: "#10b981",
        GETTING_BUSY: "#f59e0b",
        BUSY: "#f97316",
        PACKED: "#ef4444",
        AT_CAPACITY: "#991b1b",
      };
      const fillColor = colorMap[level ?? ""] || "#525252";
      const radius = 8 + (venue.compositeScore / 100) * 10; // 8-18px

      // Use L.marker with a divIcon circle so tooltips work inside the cluster group
      const markerIcon = L.divIcon({
        className: "venue-map-marker",
        html: `<div style="
          width: ${radius * 2}px;
          height: ${radius * 2}px;
          background: ${fillColor};
          border: 2px solid ${fillColor};
          border-radius: 50%;
          opacity: 0.85;
          box-shadow: 0 0 6px ${fillColor}66;
        "></div>`,
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });

      const marker = L.marker([venue.lat, venue.lng], { icon: markerIcon });

      // Store venue name on the marker instance for cluster hover previews
      (marker as any)._venueName = venue.name;

      // Tooltip with venue name and crowd info
      const tooltipText = `<div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
        <strong>${venue.name}</strong><br/>
        <span style="color: #a3a3a3">${level ? level.replace(/_/g, " ") : "Unknown"}</span>
        ${venue.distance != null ? ` &middot; ${venue.distance < 1 ? `${(venue.distance * 1000).toFixed(0)}m` : `${venue.distance.toFixed(1)}km`}` : ""}
      </div>`;

      marker.bindTooltip(tooltipText, {
        direction: "top",
        offset: [0, -radius],
        opacity: 0.9,
        className: "venue-cluster-tooltip",
      });

      // Click navigates to venue detail
      marker.on("click", () => {
        window.location.href = `/venues/${venue.id}`;
      });

      group.addLayer(marker);
    });

    prevVenueIds.current = currentIds;
  }, [venues]);

  return null;
}

"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { MapContact } from "@/lib/map-contacts";
// Fix leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Pin color: founding member (green), multi-state (purple), broker (violet), agent (blue)
function pinColor(c: MapContact) {
  if (c.foundingMemberStatus === "Approved") return "#10b981";
  if (c.multiState) return "#a855f7";
  if (c.role.trim().toLowerCase() === "broker") return "#7c3aed";
  return "#5375FF";
}

function makeIcon(contact: MapContact) {
  const color = pinColor(contact);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="16" height="24">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${color}" stroke="white" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [16, 24],
    iconAnchor: [8, 24],
    popupAnchor: [0, -24],
  });
}

function FitBounds({ contacts }: { contacts: MapContact[] }) {
  const map = useMap();
  useEffect(() => {
    if (contacts.length === 0) return;
    const bounds = L.latLngBounds(contacts.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [contacts, map]);
  return null;
}

export default function LeafletMap({
  contacts,
  onSelect,
}: {
  contacts: MapContact[];
  onSelect: (c: MapContact) => void;
}) {
  return (
    <MapContainer
      center={[39, -98]}
      zoom={4}
      style={{ height: "100%", width: "100%", background: "#e8e0d8" }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds contacts={contacts} />
      {contacts.map((c, i) => (
        <Marker
          key={i}
          position={[c.lat, c.lng]}
          icon={makeIcon(c)}
          eventHandlers={{ click: () => onSelect(c) }}
        />
      ))}
    </MapContainer>
  );
}

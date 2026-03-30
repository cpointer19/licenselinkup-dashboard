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

// Pin fill = role (blue=Agent, violet=Broker). Rings = status modifiers.
function makeIcon(contact: MapContact) {
  const isBroker = contact.role.trim().toLowerCase() === "broker";
  const fill = isBroker ? "#7c3aed" : "#5375FF";
  const isFounding = contact.foundingMemberStatus === "Approved";
  const isMulti = contact.multiState;

  // Outer ring color: green for founding, purple for multi-state, white default
  const ringColor = isFounding ? "#10b981" : isMulti ? "#a855f7" : "white";
  const ringWidth = isFounding || isMulti ? 2.5 : 1.5;

  // Larger pin if it has a ring so the ring is visible
  const size = isFounding || isMulti ? 20 : 16;
  const height = isFounding || isMulti ? 30 : 24;
  const scale = size / 16;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${height}">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24S24 21 24 12C24 5.373 18.627 0 12 0z" fill="${fill}" stroke="${ringColor}" stroke-width="${ringWidth}"/>
    <circle cx="12" cy="12" r="4.5" fill="white"/>
    ${isFounding && isMulti ? `<circle cx="12" cy="12" r="7.5" fill="none" stroke="#a855f7" stroke-width="1.2"/>` : ""}
  </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
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

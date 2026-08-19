"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const tacticalIcon = L.divIcon({
  className: "custom-drone-icon",
  html: `<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_12px_#10b981] animate-pulse"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapProps {
  units: Record<string, any>;
}

export default function TacticalMap({ units }: MapProps) {
  const defaultPos: [number, number] = [9.0765, 7.3986];
  const primaryUnit = Object.values(units)[0];
  const activePosition: [number, number] = primaryUnit?.gps || defaultPos;

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-zinc-800 relative z-0">
      <MapContainer
        center={defaultPos}
        zoom={16}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[450px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapUpdater center={activePosition} />
        {Object.entries(units).map(([id, unit]: [string, any]) => (
          <Marker key={id} position={unit.gps} icon={tacticalIcon}>
            <Popup className="bg-zinc-900 text-zinc-100 text-xs">
              <span className="font-bold">{id.toUpperCase()}</span>
              <br />
              Status: {unit.status}
              <br />
              Battery: {unit.battery}%
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
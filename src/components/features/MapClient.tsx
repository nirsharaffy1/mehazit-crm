"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

interface Marker {
  id: string;
  name: string;
  address: string;
  city: string;
  domain: string | null;
  lat: number | null;
  lng: number | null;
  managerName: string | null;
  days: number | null;
}

function markerColor(days: number | null): string {
  if (days === null) return "#6b7280";   // gray — no assignment
  if (days < 0) return "#ef4444";       // red — overdue
  if (days <= 7) return "#f59e0b";      // amber — urgent
  return "#10b981";                      // green — ok
}

const ISRAEL_CENTER: [number, number] = [31.8, 34.85];

export default function MapClient({ markers }: { markers: Marker[] }) {
  const plotted = markers.filter((m) => m.lat !== null && m.lng !== null) as (Marker & { lat: number; lng: number })[];

  return (
    <div className="rounded-xl overflow-hidden border border-line" style={{ height: 520 }}>
      <MapContainer
        center={plotted.length > 0 ? [plotted[0].lat, plotted[0].lng] : ISRAEL_CENTER}
        zoom={plotted.length > 0 ? 10 : 8}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {plotted.map((m) => (
          <CircleMarker
            key={m.id}
            center={[m.lat, m.lng]}
            radius={11}
            pathOptions={{
              color: markerColor(m.days),
              fillColor: markerColor(m.days),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ direction: "rtl", minWidth: 160 }}>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{m.name}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>{m.address}, {m.city}</p>
                {m.domain && <p style={{ fontSize: 12, color: "#6b7280" }}>תחום {m.domain}</p>}
                {m.managerName && <p style={{ fontSize: 12, marginTop: 4 }}>מנהל: {m.managerName}</p>}
                {m.days !== null && (
                  <p style={{ fontSize: 12, fontWeight: 600, color: markerColor(m.days), marginTop: 2 }}>
                    {m.days < 0 ? `חרג ב-${Math.abs(m.days)} ימים` : `${m.days} ימים נשאר`}
                  </p>
                )}
                <a
                  href={`/complexes/${m.id}`}
                  style={{ display: "block", marginTop: 6, fontSize: 12, color: "#c6a15b", textDecoration: "underline" }}
                >
                  פתח מתחם ←
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="flex items-center gap-4 px-4 py-2 bg-offwhite dark:bg-dark-soft border-t border-line text-xs text-dark/50 dark:text-cream/50 flex-wrap">
        {[
          { color: "#10b981", label: "בסדר" },
          { color: "#f59e0b", label: "דחוף (≤7 ימים)" },
          { color: "#ef4444", label: "חריגה" },
          { color: "#6b7280", label: "לא מוקצה" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span style={{ background: color }} className="inline-block w-3 h-3 rounded-full" />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

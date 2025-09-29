'use client';

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { BUILDINGS } from '@/lib/buildings';
import type { Building } from '@/lib/types';
import COORDS from '@/lib/coords';

// --- Kleine Hilfskomponenten -------------------------------------------------

function AbbrMarker({ b }: { b: Building }) {
  const icon = React.useMemo(
    () =>
      L.divIcon({
        html: `<div class="px-2 py-1 rounded-lg shadow bg-white border text-xs font-bold">${b.abbr}</div>`,
        className: 'leaflet-div-icon zhaw-abbr',
      }),
    [b.abbr]
  );
  if (typeof b.lat !== 'number' || typeof b.lon !== 'number') return null;
  return (
    <Marker position={[b.lat, b.lon]} icon={icon}>
      <Popup>
        <div className="text-sm">
          <div className="font-semibold">
            {b.abbr} · {b.name}
          </div>
          {b.dept && <div className="text-slate-600">{b.dept}</div>}
          <div className="text-slate-600">{b.address}</div>
        </div>
      </Popup>
    </Marker>
  );
}

function FitToAll({ buildings }: { buildings: Building[] }) {
  const map = useMap();
  React.useEffect(() => {
    const pts = buildings.filter(
      (b) => typeof b.lat === 'number' && typeof b.lon === 'number'
    );
    if (pts.length > 0) {
      const bounds = L.latLngBounds(
        pts.map((b) => [b.lat as number, b.lon as number] as [number, number])
      );
      map.fitBounds(bounds.pad(0.1));
    }
  }, [buildings, map]);
  return null;
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.flyTo(center, 18, { duration: 0.8 });
  }, [center, map]);
  return null;
}

// --- Hauptkarte --------------------------------------------------------------

export default function Map({ focus }: { focus: Building | null }) {
  // A) Initial: Buildings mit statischen Koordinaten aus COORDS anreichern (sofortige Labels)
  const initial = React.useMemo<Building[]>(
    () =>
      BUILDINGS.map((b) =>
        COORDS[b.abbr]
          ? { ...b, lat: COORDS[b.abbr].lat, lon: COORDS[b.abbr].lon }
          : b
      ),
    []
  );

  const [buildings, setBuildings] = React.useState<Building[]>(initial);
  const [center, setCenter] = React.useState<[number, number] | null>(null);

  // B) Optionaler Fallback: fehlende Koordinaten im Hintergrund geokodieren (sanft gedrosselt)
  React.useEffect(() => {
    let cancelled = false;

    async function fillMissing() {
      // sammle Kandidaten ohne Koordinaten
      const missing = buildings.filter(
        (b) => !(typeof b.lat === 'number' && typeof b.lon === 'number')
      );
      if (missing.length === 0) return;

      const updated = [...buildings];
      for (const b of missing) {
        try {
          const r = await fetch(`/api/geocode?q=${encodeURIComponent(b.address)}`);
          const j = await r.json();
          if (j && typeof j.lat === 'number' && typeof j.lon === 'number') {
            const idx = updated.findIndex((x) => x.abbr === b.abbr);
            if (idx >= 0) updated[idx] = { ...updated[idx], lat: j.lat, lon: j.lon };
          }
        } catch {
          // ignore
        }
        // Fair-use: Nominatim nicht stressen
        await new Promise((res) => setTimeout(res, 300));
        if (cancelled) return;
      }
      if (!cancelled) setBuildings(updated);
    }

    fillMissing();
    return () => {
      cancelled = true;
    };
    // bewusst nur beim ersten Mount ausführen, damit wir nicht in Schleifen laufen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // C) Suche/Fokus: zentriere auf selektiertes Gebäude
  React.useEffect(() => {
    if (!focus) return;

    const withCoords = buildings.find((x) => x.abbr === focus.abbr);
    if (withCoords && typeof withCoords.lat === 'number' && typeof withCoords.lon === 'number') {
      setCenter([withCoords.lat, withCoords.lon]);
      return;
    }

    // Falls im State noch keine Koordinaten: einmal nachladen
    fetch(`/api/geocode?q=${encodeURIComponent(focus.address)}`)
      .then((r) => r.json())
      .then(({ lat, lon }) => {
        if (typeof lat === 'number' && typeof lon === 'number') {
          setBuildings((prev) =>
            prev.map((b) => (b.abbr === focus.abbr ? { ...b, lat, lon } : b))
          );
          setCenter([lat, lon]);
        }
      })
      .catch(() => {});
  }, [focus, buildings]);

  return (
    <MapContainer center={[47.498, 8.723]} zoom={14} className="h-screen w-screen">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
      />
      <FitToAll buildings={buildings} />
      <FlyTo center={center} />
      {buildings.map((b) => (
        <AbbrMarker key={b.abbr} b={b} />
      ))}
    </MapContainer>
  );
}

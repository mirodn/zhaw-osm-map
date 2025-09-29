'use client';
import dynamic from 'next/dynamic';
import React from 'react';
import SearchBar from '@/components/SearchBar';
import { BUILDINGS } from '@/lib/buildings';
import type { Building } from '@/lib/types';

const Map = dynamic(() => import('@/components/Map'), { ssr: false });

export default function Page() {
  const [focus, setFocus] = React.useState<Building | null>(null);

  // A) Nur bei normalem Seitenaufruf (?b=MW berücksichtigen), nicht bei Reload
  React.useEffect(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = nav?.type === 'reload';

    const sp = new URLSearchParams(window.location.search);
    const abbr = (sp.get('b') || '').toUpperCase();

    if (isReload) {
      // Reload: Übersicht zeigen → Param ggf. entfernen
      if (abbr) {
        sp.delete('b');
        const qs = sp.toString();
        window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
      }
      return; // focus bleibt null → Map zeigt FitToAll
    }

    // Direkter Aufruf mit Deep-Link (z. B. geteilter Link): einmalig übernehmen
    if (abbr) {
      const b = BUILDINGS.find((x) => x.abbr.toUpperCase() === abbr);
      if (b) setFocus(b);
    }
  }, []);

  // B) Bei Auswahl per Suche weiterhin Deep-Link setzen (für Share),
  //    aber beim Reload wird er wie oben entfernt → immer Übersicht
  const onSelect = (b: Building) => {
    setFocus(b);
    const sp = new URLSearchParams(window.location.search);
    sp.set('b', b.abbr);
    window.history.replaceState(null, '', `?${sp.toString()}`);
  };

  return (
    <div className="relative h-screen w-screen">
      <Map focus={focus} />
      <SearchBar onSelect={onSelect} />
      <div className="absolute bottom-3 right-3 text-xs text-slate-600 bg-white/80 rounded px-2 py-1 shadow">
        Daten: OpenStreetMap contributors · ZHAW Gebäude-Liste
      </div>
    </div>
  );
}

'use client';
import React, { forwardRef, useImperativeHandle } from 'react';
import Fuse from 'fuse.js';
import { BUILDINGS } from '@/lib/buildings';
import type { Building } from '@/lib/types';

const fuse = new Fuse<Building>(BUILDINGS, {
  keys: ['abbr', 'name', 'dept', 'address'],
  includeScore: true,
  threshold: 0.3,
});

type Props = { onSelect: (b: Building) => void; };

export default forwardRef(function SearchBar({ onSelect }: Props, ref) {
  const [q, setQ] = React.useState('');
  const [results, setResults] = React.useState<Building[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  React.useEffect(() => {
    if (!q) { setResults([]); return; }
    const r = fuse.search(q).slice(0, 8).map(x => x.item);
    setResults(r);
  }, [q]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] w-[min(720px,90vw)]">
      <div className="rounded-2xl shadow-lg bg-white ring-1 ring-slate-200">
        <input
          ref={inputRef}
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Suche Gebäude… (z.B. MW, TH, MU)"
          className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
        />
        {results.length > 0 && (
          <ul className="max-h-72 overflow-auto">
            {results.map((b) => (
              <li key={b.abbr}
                  className="px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                  onClick={() => { onSelect(b); setQ(''); setResults([]); }}>
                <span className="font-semibold mr-2">{b.abbr}</span>
                <span>{b.name}</span>
                <span className="text-slate-500 ml-2">{b.address}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

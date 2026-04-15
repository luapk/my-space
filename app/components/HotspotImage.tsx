'use client';

import { Pick } from '@/lib/catalogue';

type Hotspot = { sku: string; bbox: [number, number, number, number] };

export default function HotspotImage({
  url, hotspots, picks, active, setActive, onAdd, basket,
}: {
  url: string;
  hotspots: Hotspot[];
  picks: Pick[];
  active: number | null;
  setActive: (n: number | null) => void;
  onAdd: (sku: string) => void;
  basket: string[];
}) {
  return (
    <div className="relative border-2 border-black bg-white p-2">
      <div className="relative">
        <img src={url} alt="rendered" className="w-full aspect-[4/3] object-cover block"/>
        {hotspots.map((h, i) => {
          const pick = picks.find(p => p.product.sku === h.sku);
          if (!pick) return null;
          const cx = (h.bbox[0] + h.bbox[2] / 2) * 100;
          const cy = (h.bbox[1] + h.bbox[3] / 2) * 100;
          const isActive = active === i;
          return (
            <button
              key={i}
              onClick={() => setActive(isActive ? null : i)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cx}%`, top: `${cy}%` }}
              aria-label={pick.product.name}
            >
              <div className="hotspot-ring relative w-7 h-7 rounded-full flex items-center justify-center"
                   style={{ background: '#FFDB00', border: '2px solid #0A0A0A' }}>
                <span className="f-mono text-[11px] font-bold">{i + 1}</span>
              </div>
            </button>
          );
        })}
        {active !== null && hotspots[active] && (() => {
          const h = hotspots[active];
          const pick = picks.find(p => p.product.sku === h.sku);
          if (!pick) return null;
          const cx = (h.bbox[0] + h.bbox[2] / 2) * 100;
          const top = (h.bbox[1] + h.bbox[3]) * 100;
          const inBasket = basket.includes(h.sku);
          return (
            <div className="absolute z-20 -translate-x-1/2"
                 style={{ left: `${cx}%`, top: `${Math.min(top + 1, 72)}%`, minWidth: '200px', maxWidth: '240px' }}>
              <div className="bg-white border-2 border-black p-3 shadow-lg">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="f-mono text-[9px] tracking-widest" style={{ color: '#0051BA' }}>{pick.product.sku}</span>
                  <button onClick={() => setActive(null)} className="f-mono text-[10px] opacity-60">✕</button>
                </div>
                <div className="f-display italic text-lg leading-tight mb-1">{pick.product.name}</div>
                <div className="f-mono text-[10px] opacity-70 mb-2">
                  {pick.product.w}×{pick.product.d}×{pick.product.h}cm
                </div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="f-display italic text-2xl">£{pick.product.price}</span>
                </div>
                <button onClick={() => onAdd(h.sku)}
                        disabled={inBasket}
                        className="w-full py-2 f-mono text-[10px] tracking-widest border-2 border-black"
                        style={{ background: inBasket ? '#F5F1E8' : '#FFDB00', opacity: inBasket ? 0.6 : 1 }}>
                  {inBasket ? '✓ ADDED' : 'ADD TO BASKET'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
      <div className="f-mono text-[10px] tracking-widest mt-2 opacity-60 px-1 flex justify-between">
        <span>AFTER · NANO BANANA 2</span>
        {hotspots.length > 0 && <span>{hotspots.length} HOTSPOTS</span>}
      </div>
    </div>
  );
}

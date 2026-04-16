'use client';

import { useState } from 'react';
import { CATALOGUE, solveLayout, snapToRatio, Scene, Layout } from '@/lib/catalogue';
import HotspotImage from './components/HotspotImage';
import RoomModel, { Architecture } from './components/RoomModel';
import CameraCapture from './components/CameraCapture';

type Stage = 'upload' | 'camera' | 'analysing' | 'rendering' | 'scanning' | 'results' | 'error';
type Hotspot = { sku: string; bbox: [number, number, number, number]; confidence?: string; fallback?: boolean };
type Ratio = { name: string; value: number; css: string };

export default function Page() {
  const [stage, setStage] = useState<Stage>('upload');
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgData, setImgData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [ratio, setRatio] = useState<Ratio>({ name: '4:3', value: 4/3, css: '4 / 3' });
  const [scene, setScene] = useState<Scene | null>(null);
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [rendered, setRendered] = useState<{ url: string; base64: string; mediaType: string } | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
  const [basket, setBasket] = useState<string[]>([]);
  const [errMsg, setErrMsg] = useState('');
  const [progress, setProgress] = useState('');
  const [model, setModel] = useState('gemini-3.1-flash-image-preview');

  const handleImage = (dataUrl: string, base64: string, mediaType: string) => {
    setImgUrl(dataUrl);
    setImgData({ base64, mediaType });
    const img = new Image();
    img.onload = () => setRatio(snapToRatio(img.naturalWidth, img.naturalHeight));
    img.src = dataUrl;
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleImage(result, result.split(',')[1], file.type);
    };
    reader.readAsDataURL(file);
  };

  const onCameraCapture = (dataUrl: string, base64: string, mediaType: string) => {
    handleImage(dataUrl, base64, mediaType);
    setStage('upload');
  };

  const run = async () => {
    if (!imgData) return;
    setErrMsg('');
    setArchitecture(null);
    try {
      setStage('analysing');
      setProgress('Reading the room…');

      // Fire scene + architecture in parallel
      const [sceneRes, archRes] = await Promise.all([
        fetch('/api/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imgData),
        }),
        fetch('/api/architecture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(imgData),
        }),
      ]);

      const sceneData = await sceneRes.json();
      if (!sceneRes.ok) throw new Error(sceneData.error || 'Scene analysis failed');
      const s: Scene = sceneData.scene;
      setScene(s);
      const l = solveLayout(s);
      setLayout(l);

      // Architecture is non-critical — if it fails, we just don't show the 3D
      try {
        const archData = await archRes.json();
        if (archRes.ok && archData.architecture) {
          setArchitecture(archData.architecture);
        }
      } catch {}

      setStage('rendering');
      setProgress('Rendering the new space with Nano Banana 2…');
      const rRes = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...imgData, scene: s, layout: l, model, aspectRatio: ratio.name }),
      });
      const rData = await rRes.json();
      if (!rRes.ok) throw new Error(rData.error || 'Render failed');
      const renderedImg = {
        base64: rData.base64,
        mediaType: rData.mediaType,
        url: `data:${rData.mediaType};base64,${rData.base64}`,
      };
      setRendered(renderedImg);

      setStage('scanning');
      setProgress('Placing interactive hotspots…');
      const sHotspots = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: renderedImg.base64,
          mediaType: renderedImg.mediaType,
          expectedProducts: l.picks.map(p => ({
            sku: p.product.sku,
            name: p.product.name,
            family: p.product.family,
            w: p.product.w, d: p.product.d, h: p.product.h,
            desc: p.product.desc,
          })),
        }),
      });
      const sHotspotsData = await sHotspots.json();
      setHotspots(sHotspotsData.hotspots || []);

      setStage('results');
      setProgress('');
    } catch (e: any) {
      setErrMsg(e.message || 'Pipeline failed.');
      setStage('error');
      setProgress('');
    }
  };

  const reset = () => {
    setStage('upload'); setImgUrl(null); setImgData(null); setScene(null);
    setArchitecture(null); setLayout(null); setRendered(null); setHotspots([]);
    setActiveHotspot(null); setErrMsg(''); setProgress('');
  };

  const addToBasket = (sku: string) => {
    setBasket(b => [...b, sku]);
    setTimeout(() => setActiveHotspot(null), 400);
  };

  const totalCost = layout ? (
    layout.picks.reduce((s, p) => s + p.product.price, 0) +
    Object.entries(layout.inserts).reduce((s, [sku, qty]) => {
      const p = CATALOGUE.find(c => c.sku === sku);
      return s + (p ? p.price * qty : 0);
    }, 0)
  ) : 0;

  return (
    <div className="min-h-screen w-full">
      <header className="border-b-2 border-black sticky top-0 z-30" style={{ background: '#F5F1E8' }}>
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="f-mono text-[10px] tracking-widest shrink-0" style={{ color: '#0051BA' }}>v0.6</span>
            <span className="f-display italic text-xl sm:text-2xl leading-none truncate">IKEA My Space</span>
          </div>
          <div className="flex items-center gap-2">
            {basket.length > 0 && (
              <div className="f-mono text-[10px] tracking-widest border-2 border-black px-3 py-1.5" style={{ background: '#FFDB00' }}>
                BASKET · {basket.length}
              </div>
            )}
            <select value={model} onChange={e => setModel(e.target.value)}
                    className="f-mono text-[10px] tracking-widest border-2 border-black px-2 py-1.5 bg-white">
              <option value="gemini-3.1-flash-image-preview">FLASH</option>
              <option value="gemini-3-pro-image-preview">PRO</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">

        {/* UPLOAD stage */}
        {stage === 'upload' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h1 className="f-display text-5xl md:text-6xl leading-[0.92] mb-5">
                Upload the <em>mess</em>.<br/>
                Get the new<br/>
                concept back.
              </h1>
              <p className="f-mono text-xs leading-relaxed opacity-80 mb-6 max-w-md">
                Claude Vision reads your room and roasts it. A deterministic solver picks real IKEA storage. Nano Banana 2 renders the same space, reorganized, in your photo's aspect ratio. A 3D architectural model builds in real time while you wait.
              </p>
              <ul className="f-mono text-[11px] space-y-1 opacity-70 mb-6">
                <li>→ Works best on a single wall or corner shot</li>
                <li>→ Include a door or plug socket for scale</li>
                <li>→ Storage SKUs only · ~38 in the MVP catalogue</li>
                <li>→ Toggle FLASH / PRO model in the header</li>
              </ul>
            </div>

            <div className="border-2 border-black bg-white p-6">
              <div className="f-mono text-[10px] tracking-widest mb-5" style={{ color: '#0051BA' }}>
                [ 01 ] SELECT IMAGE
              </div>
              {imgUrl ? (
                <div>
                  <div className="bg-[#F5F1E8] border border-black mb-3" style={{ aspectRatio: ratio.css, maxHeight: '320px' }}>
                    <img src={imgUrl} alt="uploaded" className="w-full h-full object-contain"/>
                  </div>
                  <div className="f-mono text-[10px] tracking-widest mb-3 opacity-60">
                    DETECTED RATIO · {ratio.name}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={run} className="flex-1 py-3 f-mono text-xs tracking-widest"
                            style={{ background: '#FFDB00', border: '2px solid #0A0A0A' }}>
                      ANALYSE & RENDER →
                    </button>
                    <button onClick={() => { setImgUrl(null); setImgData(null); }}
                            className="px-4 py-3 f-mono text-xs border-2 border-black bg-white">✕</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => setStage('camera')}
                            className="py-5 f-mono text-xs tracking-widest border-2 border-black bg-white flex flex-col items-center gap-1">
                      <span className="text-2xl">◉</span>
                      <span>TAKE PHOTO</span>
                    </button>
                    <label className="py-5 f-mono text-xs tracking-widest border-2 border-black bg-white flex flex-col items-center gap-1 cursor-pointer hover:bg-[#F5F1E8] transition">
                      <span className="text-2xl">↑</span>
                      <span>UPLOAD FILE</span>
                      <input type="file" accept="image/*" onChange={onFile} className="hidden"/>
                    </label>
                  </div>
                  <p className="f-mono text-[10px] opacity-50">
                    Camera uses your device's rear lens by default. Permissions required.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAMERA stage */}
        {stage === 'camera' && (
          <div className="max-w-xl mx-auto">
            <div className="mb-4">
              <div className="f-mono text-[10px] tracking-widest mb-2" style={{ color: '#0051BA' }}>
                [ 01 ] CAPTURE
              </div>
              <h2 className="f-display italic text-3xl">frame the room</h2>
              <p className="f-mono text-[11px] opacity-70 mt-2">
                Include a door, plug socket, or skirting board in shot for better dimension estimates.
              </p>
            </div>
            <CameraCapture onCapture={onCameraCapture} onCancel={() => setStage('upload')}/>
          </div>
        )}

        {/* ANALYSING / RENDERING / SCANNING — with 3D model during render */}
        {(stage === 'analysing' || stage === 'rendering' || stage === 'scanning') && (
          <div>
            <div className="text-center mb-8">
              <div className="f-display italic text-3xl md:text-5xl mb-4 px-4">{progress}</div>
              <div className="f-mono text-[10px] tracking-widest opacity-60 mb-6">
                <span className={stage === 'analysing' ? '' : 'opacity-30'}>[01] SCENE</span>
                <span className="mx-3">·</span>
                <span className={stage === 'rendering' ? '' : 'opacity-30'}>[02] RENDER</span>
                <span className="mx-3">·</span>
                <span className={stage === 'scanning'  ? '' : 'opacity-30'}>[03] HOTSPOTS</span>
              </div>
              <div className="w-64 h-1 mx-auto bg-black/10 overflow-hidden">
                <div className="h-full transition-all duration-500" style={{
                  background: '#0051BA',
                  width: stage === 'analysing' ? '33%' : stage === 'rendering' ? '66%' : '100%',
                }}/>
              </div>
            </div>

            {/* 3D room model appears as soon as architecture arrives */}
            {architecture && (stage === 'rendering' || stage === 'scanning') && (
              <div className="max-w-3xl mx-auto">
                <RoomModel architecture={architecture} aspectRatio={ratio.css}/>
                <p className="f-mono text-[10px] opacity-60 mt-2 text-center">
                  Procedural reconstruction from detected architectural features. Wall dimensions, door and window positions, fixtures.
                </p>
              </div>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div className="py-16 text-center max-w-lg mx-auto">
            <div className="f-display italic text-4xl mb-3">something broke.</div>
            <div className="f-mono text-xs opacity-70 mb-8 break-words">{errMsg}</div>
            <button onClick={reset} className="px-6 py-3 f-mono text-xs border-2 border-black bg-white">← NEW PHOTO</button>
          </div>
        )}

        {/* RESULTS */}
        {stage === 'results' && scene && layout && (
          <div className="space-y-8">
            <div className="border-2 border-black bg-white">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x-2 divide-black">
                <Stat label="ROOM" value={scene.room_type}/>
                <Stat label="WALL" value={`${scene.estimated_wall_width_cm}×${scene.estimated_wall_height_cm}`}/>
                <Stat label="SKUs" value={`${layout.picks.length}`}/>
                <Stat label="TOTAL" value={`£${totalCost}`} accent/>
              </div>
            </div>

            <section>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="f-mono text-[10px] tracking-widest" style={{ color: '#0051BA' }}>[ 02 ] THE VERDICT</span>
              </div>
              <div className="border-2 border-black bg-white p-6 md:p-8">
                <p className="f-display italic text-2xl md:text-3xl leading-tight">{scene.current_state}</p>
              </div>
            </section>

            <section>
              <SectionTitle n="03" title="how it started / how it's going"/>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border-2 border-black bg-white p-2">
                  <div className="bg-[#F5F1E8]" style={{ aspectRatio: ratio.css }}>
                    <img src={imgUrl!} alt="before" className="w-full h-full object-contain"/>
                  </div>
                  <div className="f-mono text-[10px] tracking-widest mt-2 opacity-60 px-1 flex justify-between">
                    <span>HOW IT STARTED</span>
                    <span>{ratio.name}</span>
                  </div>
                </div>
                {rendered && (
                  <HotspotImage
                    url={rendered.url}
                    hotspots={hotspots}
                    picks={layout.picks}
                    active={activeHotspot}
                    setActive={setActiveHotspot}
                    onAdd={addToBasket}
                    basket={basket}
                    aspectRatio={ratio.css}
                    label="HOW IT'S GOING"
                  />
                )}
              </div>
              {hotspots.length > 0 && (
                <div className="f-mono text-[10px] opacity-60 mt-2">
                  Hover any hotspot for product details. White rings are estimated positions.
                </div>
              )}
            </section>

            {/* Architecture model persists in results too */}
            {architecture && (
              <section>
                <SectionTitle n="04" title="3D model"/>
                <RoomModel architecture={architecture} aspectRatio={ratio.css}/>
                <div className="f-mono text-[10px] opacity-60 mt-2">
                  Architectural reconstruction: walls, doors, windows, fixtures. Objects excluded.
                </div>
              </section>
            )}

            <section>
              <SectionTitle n={architecture ? '05' : '04'} title="what's in the room"/>
              <div className="border-2 border-black bg-white p-5">
                <table className="w-full f-mono text-xs">
                  <tbody>
                    {scene.items.map((it, i) => (
                      <tr key={i} className="border-t border-black/20 first:border-t-0">
                        <td className="py-2">{it.category.replace(/_/g, ' ')}</td>
                        <td className="py-2 opacity-60 hidden sm:table-cell">{it.notes}</td>
                        <td className="py-2 text-right tabular-nums">≈{it.estimated_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <SectionTitle n={architecture ? '06' : '05'} title="shopping list"/>
              <div className="border-2 border-black bg-white overflow-x-auto">
                <table className="w-full f-mono text-xs">
                  <thead>
                    <tr style={{ background: '#0051BA', color: 'white' }}>
                      <th className="text-left p-3 tracking-widest">SKU</th>
                      <th className="text-left p-3 tracking-widest">PRODUCT</th>
                      <th className="text-left p-3 tracking-widest hidden sm:table-cell">W×D×H</th>
                      <th className="text-left p-3 tracking-widest hidden md:table-cell">FOR</th>
                      <th className="text-right p-3 tracking-widest">£</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layout.picks.map((p, i) => (
                      <tr key={i} className="border-b border-black/20">
                        <td className="p-3 font-bold">{p.product.sku}</td>
                        <td className="p-3">{p.product.name}</td>
                        <td className="p-3 hidden sm:table-cell opacity-70">{p.product.w}×{p.product.d}×{p.product.h}</td>
                        <td className="p-3 hidden md:table-cell opacity-70">{p.forCategory.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right tabular-nums">{p.product.price}</td>
                      </tr>
                    ))}
                    {Object.entries(layout.inserts).map(([sku, qty]) => {
                      const p = CATALOGUE.find(c => c.sku === sku);
                      if (!p) return null;
                      return (
                        <tr key={sku} className="border-b border-black/20 opacity-80">
                          <td className="p-3 font-bold">{p.sku} × {qty}</td>
                          <td className="p-3">{p.name}</td>
                          <td className="p-3 hidden sm:table-cell opacity-70">{p.w}×{p.d}×{p.h}</td>
                          <td className="p-3 hidden md:table-cell opacity-70">insert</td>
                          <td className="p-3 text-right tabular-nums">{p.price * qty}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#FFDB00' }}>
                      <td className="p-3 f-display italic text-lg" colSpan={4}>total</td>
                      <td className="p-3 text-right f-display italic text-lg tabular-nums">£{totalCost}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="f-mono text-[10px] opacity-60 mt-2 max-w-2xl">
                Prices approx UK retail late 2025 · dimensions from curated MVP catalogue · verify on IKEA.co.uk · renders are visualisations not guarantees.
              </div>
            </section>

            <div className="flex gap-3">
              <button onClick={reset} className="px-6 py-3 f-mono text-xs border-2 border-black bg-white">← NEW PHOTO</button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t-2 border-black mt-16">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-wrap gap-2 justify-between f-mono text-[9px] tracking-wider opacity-60">
          <span>NOT AFFILIATED WITH INTER IKEA SYSTEMS B.V.</span>
          <span>CLAUDE SONNET 4.5 · GEMINI NANO BANANA 2 · THREE.JS</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4" style={accent ? { background: '#FFDB00' } : {}}>
      <div className="f-mono text-[10px] tracking-widest opacity-60 mb-1">{label}</div>
      <div className="f-display italic text-xl leading-none truncate">{value}</div>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 mb-4">
      <span className="f-mono text-[10px] tracking-widest" style={{ color: '#0051BA' }}>[ {n} ]</span>
      <h2 className="f-display italic text-3xl">{title}</h2>
    </div>
  );
}

// Curated MVP catalogue. Dimensions in cm. Prices GBP, approx UK retail late 2025.
export type Product = {
  sku: string;
  name: string;
  family: string;
  w: number; d: number; h: number;
  price: number;
  desc: string;
  cap: Record<string, number>;
  mount?: string;
  insert?: boolean;
};

export const CATALOGUE: Product[] = [
  { sku: 'KALLAX-1x1',  name: 'KALLAX 1×1',         family: 'KALLAX', w: 42,  d: 39, h: 42,  price: 25,  desc: 'small white 1×1 cube shelving unit',                cap: { vinyl: 65,   books: 25,  boxes: 1,  general: 5 }},
  { sku: 'KALLAX-2x2',  name: 'KALLAX 2×2',         family: 'KALLAX', w: 77,  d: 39, h: 77,  price: 45,  desc: 'square 2×2 cube shelving unit in white melamine',  cap: { vinyl: 260,  books: 100, boxes: 4,  general: 20 }},
  { sku: 'KALLAX-1x4',  name: 'KALLAX 1×4 tall',    family: 'KALLAX', w: 42,  d: 39, h: 147, price: 50,  desc: 'narrow tall 1×4 cube shelving in white melamine',  cap: { vinyl: 260,  books: 100, boxes: 4,  general: 20 }},
  { sku: 'KALLAX-4x1',  name: 'KALLAX 4×1 low',     family: 'KALLAX', w: 147, d: 39, h: 42,  price: 50,  desc: 'long low 4×1 cube shelving in white melamine',     cap: { vinyl: 260,  books: 100, boxes: 4,  general: 20 }},
  { sku: 'KALLAX-2x4',  name: 'KALLAX 2×4',         family: 'KALLAX', w: 77,  d: 39, h: 147, price: 60,  desc: 'tall 2×4 cube shelving in white melamine',         cap: { vinyl: 520,  books: 200, boxes: 8,  general: 40 }},
  { sku: 'KALLAX-4x2',  name: 'KALLAX 4×2 low',     family: 'KALLAX', w: 147, d: 39, h: 77,  price: 70,  desc: 'wide low 4×2 cube shelving in white melamine',     cap: { vinyl: 520,  books: 200, boxes: 8,  general: 40 }},
  { sku: 'KALLAX-4x4',  name: 'KALLAX 4×4',         family: 'KALLAX', w: 147, d: 39, h: 147, price: 100, desc: 'large 4×4 cube shelving in white melamine',        cap: { vinyl: 1040, books: 400, boxes: 16, general: 80 }},
  { sku: 'KALLAX-5x5',  name: 'KALLAX 5×5',         family: 'KALLAX', w: 182, d: 39, h: 182, price: 160, desc: 'extra large 5×5 cube shelving in white melamine',  cap: { vinyl: 1625, books: 625, boxes: 25, general: 125 }},
  { sku: 'BILLY-40',    name: 'BILLY 40cm',         family: 'BILLY',  w: 40,  d: 28, h: 202, price: 45,  desc: 'narrow tall white bookcase, 6 shelves',             cap: { books: 90,  vinyl: 0,   general: 10 }},
  { sku: 'BILLY-80',    name: 'BILLY 80cm',         family: 'BILLY',  w: 80,  d: 28, h: 202, price: 55,  desc: 'classic tall white bookcase, 6 shelves, 80cm wide', cap: { books: 180, vinyl: 0,   general: 20 }},
  { sku: 'BILLY-CORN',  name: 'BILLY corner',       family: 'BILLY',  w: 135, d: 28, h: 202, price: 80,  desc: 'white L-shape corner bookcase',                     cap: { books: 260, vinyl: 0,   general: 30 }},
  { sku: 'BILLY-80-XT', name: 'BILLY 80 + height',  family: 'BILLY',  w: 80,  d: 28, h: 237, price: 80,  desc: 'extra tall white bookcase with height extension',   cap: { books: 210, vinyl: 0,   general: 25 }},
  { sku: 'IVAR-1S',     name: 'IVAR 1 section',     family: 'IVAR',   w: 89,  d: 30, h: 179, price: 85,  desc: 'raw pine utility shelving, one section, 5 shelves', cap: { books: 200, boxes: 10, general: 25 }},
  { sku: 'IVAR-2S',     name: 'IVAR 2 section',     family: 'IVAR',   w: 174, d: 30, h: 179, price: 155, desc: 'raw pine utility shelving, two sections',           cap: { books: 400, boxes: 20, general: 50 }},
  { sku: 'IVAR-3S',     name: 'IVAR 3 section',     family: 'IVAR',   w: 259, d: 30, h: 179, price: 225, desc: 'raw pine utility shelving, three sections',         cap: { books: 600, boxes: 30, general: 75 }},
  { sku: 'EKET-1',      name: 'EKET 35×35',         family: 'EKET',   w: 35,  d: 35, h: 35,  price: 20,  desc: 'small white modular cube, 35cm',                    cap: { books: 15,  general: 6,  vinyl: 0 }},
  { sku: 'EKET-H70',    name: 'EKET 35×70 tall',    family: 'EKET',   w: 35,  d: 35, h: 70,  price: 30,  desc: 'narrow tall white modular cube',                    cap: { books: 30,  general: 12, vinyl: 0 }},
  { sku: 'EKET-70',     name: 'EKET 70×70',         family: 'EKET',   w: 70,  d: 35, h: 70,  price: 55,  desc: 'white modular cube, 70cm square',                   cap: { books: 60,  general: 24, vinyl: 0 }},
  { sku: 'EKET-4C',     name: 'EKET 4-comp 70×70',  family: 'EKET',   w: 70,  d: 35, h: 70,  price: 60,  desc: 'white modular cube with four compartments',         cap: { books: 60,  general: 24, boxes: 4 }},
  { sku: 'VITTSJO',     name: 'VITTSJÖ shelf',      family: 'VITTSJO',w: 51,  d: 36, h: 175, price: 55,  desc: 'slim black metal frame with glass shelves',         cap: { books: 80,  general: 15 }},
  { sku: 'HYLLIS',      name: 'HYLLIS galvanised',  family: 'HYLLIS', w: 60,  d: 27, h: 140, price: 15,  desc: 'galvanised steel utility shelving',                 cap: { boxes: 8,   general: 20 }},
  { sku: 'OMAR-92',     name: 'OMAR 92×36',         family: 'OMAR',   w: 92,  d: 36, h: 94,  price: 45,  desc: 'galvanised steel low wide shelving',                cap: { boxes: 12,  general: 30 }},
  { sku: 'LACK-30',     name: 'LACK 30cm',          family: 'LACK',   w: 30,  d: 26, h: 5,   price: 5,   desc: 'small white floating wall shelf',                   cap: { books: 8,   general: 3 }, mount: 'wall' },
  { sku: 'LACK-110',    name: 'LACK 110cm',         family: 'LACK',   w: 110, d: 26, h: 5,   price: 15,  desc: 'white floating wall shelf, 110cm',                  cap: { books: 25,  general: 8 }, mount: 'wall' },
  { sku: 'LACK-190',    name: 'LACK 190cm',         family: 'LACK',   w: 190, d: 26, h: 5,   price: 25,  desc: 'long white floating wall shelf, 190cm',             cap: { books: 45,  general: 14 }, mount: 'wall' },
  { sku: 'TROFAST-S',   name: 'TROFAST low',        family: 'TROFAST',w: 99,  d: 44, h: 56,  price: 35,  desc: 'low pine frame with pull-out bin storage',          cap: { general: 30, boxes: 6 }},
  { sku: 'TROFAST-L',   name: 'TROFAST tall',       family: 'TROFAST',w: 94,  d: 44, h: 91,  price: 55,  desc: 'tall pine frame with pull-out bin storage',         cap: { general: 50, boxes: 10 }},
  { sku: 'MOPPE',       name: 'MOPPE mini chest',   family: 'MOPPE',  w: 42,  d: 18, h: 32,  price: 30,  desc: 'small unfinished pine desktop drawer chest',        cap: { general: 15 }},
  { sku: 'ALEX-36',     name: 'ALEX 36cm drawers',  family: 'ALEX',   w: 36,  d: 48, h: 116, price: 90,  desc: 'narrow tall white drawer unit, 5 drawers',          cap: { general: 30 }},
  { sku: 'ALEX-67',     name: 'ALEX 67cm drawers',  family: 'ALEX',   w: 67,  d: 48, h: 116, price: 140, desc: 'wide white drawer unit, 9 drawers',                 cap: { general: 60 }},
  { sku: 'DRONA',       name: 'DRÖNA box',          family: 'BOX',    w: 33,  d: 38, h: 33,  price: 8,   desc: 'fabric cube storage box (KALLAX insert)',            cap: {}, insert: true },
  { sku: 'KUGGIS-S',    name: 'KUGGIS 26×35×15',    family: 'BOX',    w: 26,  d: 35, h: 15,  price: 10,  desc: 'white plastic shallow lidded storage box',           cap: {}, insert: true },
  { sku: 'KUGGIS-L',    name: 'KUGGIS 37×54×21',    family: 'BOX',    w: 37,  d: 54, h: 21,  price: 14,  desc: 'white plastic deep lidded storage box',              cap: {}, insert: true },
  { sku: 'SAMLA-11',    name: 'SAMLA 11L',          family: 'BOX',    w: 39,  d: 28, h: 14,  price: 4,   desc: 'clear plastic stackable 11L box with lid',           cap: {}, insert: true },
  { sku: 'SAMLA-22',    name: 'SAMLA 22L',          family: 'BOX',    w: 39,  d: 28, h: 28,  price: 6,   desc: 'clear plastic stackable 22L box with lid',           cap: {}, insert: true },
  { sku: 'SAMLA-45',    name: 'SAMLA 45L',          family: 'BOX',    w: 56,  d: 39, h: 28,  price: 9,   desc: 'clear plastic stackable 45L box with lid',           cap: {}, insert: true },
  { sku: 'KASSETT',     name: 'KASSETT box',        family: 'BOX',    w: 33,  d: 38, h: 30,  price: 8,   desc: 'cardboard lidded storage box',                       cap: {}, insert: true },
  { sku: 'TJENA',       name: 'TJENA box',          family: 'BOX',    w: 25,  d: 35, h: 20,  price: 4,   desc: 'cardboard lidded storage box, small',                cap: {}, insert: true },
];

export const PREF: Record<string, { families: string[]; capKey: string; insert: string | null }> = {
  vinyl_records:   { families: ['KALLAX'],                              capKey: 'vinyl',   insert: null      },
  books:           { families: ['BILLY', 'KALLAX', 'IVAR', 'LACK'],     capKey: 'books',   insert: null      },
  boxes:           { families: ['IVAR', 'KALLAX', 'TROFAST', 'HYLLIS'], capKey: 'boxes',   insert: null      },
  general_clutter: { families: ['KALLAX', 'IVAR', 'EKET', 'TROFAST'],   capKey: 'general', insert: 'DRONA'   },
  toys:            { families: ['TROFAST', 'KALLAX'],                   capKey: 'general', insert: 'DRONA'   },
  clothing:        { families: ['ALEX', 'TROFAST'],                     capKey: 'general', insert: null      },
  kitchenware:     { families: ['IVAR', 'OMAR'],                        capKey: 'general', insert: 'KUGGIS-L'},
  tools:           { families: ['HYLLIS', 'IVAR', 'OMAR'],              capKey: 'general', insert: 'SAMLA-22'},
  plants:          { families: ['VITTSJO', 'KALLAX', 'LACK'],           capKey: 'general', insert: null      },
};

export type SceneItem = { category: string; estimated_count: number; notes?: string };
export type Scene = {
  room_type: string;
  estimated_wall_width_cm: number;
  estimated_wall_height_cm: number;
  items: SceneItem[];
  current_state: string;
  wall_colour?: string;
  floor_material?: string;
  confidence?: string;
};
export type Pick = { product: Product; forCategory: string; forCount: number };
export type Layout = { picks: Pick[]; inserts: Record<string, number>; wallW: number; wallH: number; usedWidth: number };

export function solveLayout(scene: Scene): Layout {
  const wallW = Math.max(120, scene.estimated_wall_width_cm || 300);
  const wallH = Math.max(180, scene.estimated_wall_height_cm || 240);
  const picks: Pick[] = [];
  const inserts: Record<string, number> = {};
  let remaining = wallW;
  const items = [...(scene.items || [])].sort((a, b) => (b.estimated_count || 0) - (a.estimated_count || 0));

  for (const item of items) {
    const pref = PREF[item.category];
    if (!pref) continue;
    let needed = Math.max(1, item.estimated_count || 1);
    const pool = CATALOGUE.filter(p => pref.families.includes(p.family) && !p.insert);
    let safety = 8;
    while (needed > 0 && remaining > 35 && safety-- > 0) {
      const candidates = pool
        .filter(p => p.w <= remaining && p.h <= wallH && (p.cap[pref.capKey] || 0) > 0)
        .sort((a, b) => (b.cap[pref.capKey] / b.w) - (a.cap[pref.capKey] / a.w));
      if (!candidates.length) break;
      let chosen = candidates[0];
      for (const c of candidates) {
        const cap = c.cap[pref.capKey];
        if (cap >= needed && cap <= needed * 1.8) { chosen = c; break; }
        if (cap < needed && cap > chosen.cap[pref.capKey]) chosen = c;
      }
      picks.push({ product: chosen, forCategory: item.category, forCount: Math.min(needed, chosen.cap[pref.capKey]) });
      needed -= chosen.cap[pref.capKey];
      remaining -= chosen.w + 2;
    }
    if (pref.insert) {
      const ins = CATALOGUE.find(p => p.sku === pref.insert);
      if (ins) inserts[ins.sku] = (inserts[ins.sku] || 0) + Math.ceil((item.estimated_count || 4) / 4);
    }
  }
  return { picks, inserts, wallW, wallH, usedWidth: wallW - remaining };
}

export function buildRenderPrompt(scene: Scene, layout: Layout): string {
  const productList = layout.picks
    .map(p => `- ${p.product.name} (${p.product.w}×${p.product.d}×${p.product.h}cm): ${p.product.desc}`)
    .join('\n');
  const itemList = (scene.items || [])
    .map(i => `${i.estimated_count} ${i.category.replace(/_/g, ' ')}`)
    .join(', ');

  return `Generate a photo of the EXACT SAME room from the SAME camera angle as the reference image.

CRITICAL REQUIREMENTS:
- Same walls, same wall colour (${scene.wall_colour || 'unchanged'}), same floor (${scene.floor_material || 'unchanged'}), same lighting, same windows, same architectural details
- Same camera position and perspective
- Photorealistic, matching the photographic style of the reference

ORGANIZE THE ROOM by adding these specific IKEA storage units placed neatly against the main wall:
${productList}

All personal items from the original photo must remain visible but neatly organized into or onto these IKEA units: ${itemList}.

The room should look tidy, calm, and well-organized. The IKEA products must be rendered accurately with their correct proportions, materials, and colours. Do not change the room itself — only add the furniture and reorganize the existing items into it.`;
}

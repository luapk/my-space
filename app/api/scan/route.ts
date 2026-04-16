import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

type ExpectedProduct = {
  sku: string;
  name: string;
  family: string;
  w: number; d: number; h: number;
  desc: string;
};

export async function POST(req: Request) {
  try {
    const { base64, mediaType, expectedProducts } = await req.json();
    if (!base64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    const products: ExpectedProduct[] = expectedProducts || [];

    const productCatalogue = products
      .map((p, i) => `${i + 1}. SKU "${p.sku}" — ${p.name}, ${p.family} family, ${p.w}cm wide × ${p.d}cm deep × ${p.h}cm tall. ${p.desc}.`)
      .join('\n');

    const prompt = `You are visually identifying IKEA storage units in a rendered photo. The image was generated to contain EXACTLY the following ${products.length} units, in this order:

${productCatalogue}

DISTINGUISHING FEATURES (use these to tell them apart):
- KALLAX = white melamine cube grid, you can see the square compartments
- BILLY = tall narrow white bookcase with horizontal shelves and visible side panels
- IVAR = raw pine wood, visible grain, vertical posts and horizontal planks
- EKET = small white modular cubes, deeper than KALLAX, no visible grid
- VITTSJÖ = thin black metal frame with glass shelves, very airy
- HYLLIS = galvanised silver-grey metal utility shelving, looks industrial
- OMAR = galvanised silver-grey metal but lower and wider than HYLLIS
- LACK = floating wall shelf, sticks out from the wall with no visible supports
- TROFAST = pine frame with coloured plastic pull-out bins
- MOPPE = small unfinished pine desktop drawer chest, sits on a surface
- ALEX = white drawer unit, you can see the drawer fronts stacked vertically

Use shape, material, colour, and size to match each visible unit to one SKU from the list. Be careful: a tall white cube grid is KALLAX (not BILLY), a tall white shelved unit without a grid is BILLY (not KALLAX).

Return ONLY valid JSON, no markdown:
{"hotspots":[{"sku":"<exact SKU from list>","bbox":[x,y,w,h],"confidence":"high"|"medium"|"low"}]}

bbox is normalized 0-1 coordinates: [0,0] is the top-left of the image, [1,1] is the bottom-right. x and y are the top-left corner of the bounding box, w and h are width and height as fractions of the full image.

CRITICAL:
- Return EXACTLY ${products.length} hotspots, one for each SKU listed above, no more no less.
- Each bbox must tightly enclose the actual visible unit. The centre of the bbox should sit on the centre of the unit.
- If two units look similar, use their relative width and height (in cm) to disambiguate.
- If a unit is hard to find, return your best estimate and mark confidence "low" rather than omitting it.
- Use ONLY the SKUs from the list above, never invent new ones, never duplicate.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 }},
            { type: 'text', text: prompt },
          ],
        }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Claude ${res.status}: ${text.slice(0, 200)}` }, { status: 500 });
    }
    const data = await res.json();
    const text = data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    let hotspots = parsed.hotspots || [];

    const expectedSkus = products.map(p => p.sku);
    const returnedSkus = new Set(hotspots.map((h: any) => h.sku));
    const missing = expectedSkus.filter(s => !returnedSkus.has(s));
    if (missing.length) {
      const slotW = 1 / (missing.length + 1);
      missing.forEach((sku, i) => {
        const cx = slotW * (i + 1);
        hotspots.push({
          sku,
          bbox: [cx - 0.06, 0.7, 0.12, 0.18],
          confidence: 'low',
          fallback: true,
        });
      });
    }

    return NextResponse.json({ hotspots });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hotspots: [] }, { status: 200 });
  }
}

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { base64, mediaType, expectedSkus } = await req.json();
    if (!base64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    const skuList = expectedSkus || [];
    const prompt = `You are looking at a rendered photo of a room containing IKEA storage units. You will return bounding boxes for every SKU listed.

EXPECTED SKUs (you MUST return exactly one hotspot for EACH of these, even if a unit is partially obscured or hard to identify — make your best estimate):
${skuList.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

Return ONLY valid JSON, no markdown:
{"hotspots":[{"sku":"<exact SKU from the list>","bbox":[x,y,w,h]}]}

bbox is normalized 0-1: [0,0] is the top-left of the image, [1,1] is the bottom-right. x and y are the top-left corner of the box, w and h are width and height as fractions of the image.

CRITICAL:
- Return exactly ${skuList.length} hotspots, one per SKU, in the order listed above.
- If a unit looks like it could match more than one SKU, use the SKU that appears next in the list (no duplicates).
- If a unit is occluded or difficult to find, return your best guess for its bounding box rather than omitting it.
- Each bbox must be a tight rectangle around the unit. Avoid overlapping centres if at all possible.
- Use only the SKUs from the expected list — never invent new ones.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
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

    // Fallback: if Claude missed any SKU, distribute defaults across the bottom
    const returnedSkus = new Set(hotspots.map((h: any) => h.sku));
    const missing = skuList.filter((s: string) => !returnedSkus.has(s));
    if (missing.length) {
      const slotW = 1 / (missing.length + 1);
      missing.forEach((sku: string, i: number) => {
        const cx = slotW * (i + 1);
        hotspots.push({
          sku,
          bbox: [cx - 0.06, 0.7, 0.12, 0.18],
          fallback: true,
        });
      });
    }

    return NextResponse.json({ hotspots });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hotspots: [] }, { status: 200 });
  }
}

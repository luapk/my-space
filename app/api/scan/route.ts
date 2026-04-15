import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { base64, mediaType, expectedSkus } = await req.json();
    if (!base64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    const prompt = `Analyse this image of a room with IKEA storage. Identify each distinct storage unit visible and return bounding boxes.

Return ONLY valid JSON (no markdown) matching this schema:
{"hotspots":[{"sku":"KALLAX-4x4","bbox":[x,y,w,h]}]}

bbox values are normalized 0-1 where [0,0] is top-left and [1,1] is bottom-right. x,y is the top-left corner of the box, w,h are width and height as fractions.

Expected SKUs in this image (match only to these): ${(expectedSkus || []).join(', ')}

For each visible storage unit, choose the closest matching SKU from the list and provide a tight bounding box. Return one hotspot per distinct unit. Be precise.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
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
    return NextResponse.json({ hotspots: parsed.hotspots || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, hotspots: [] }, { status: 200 }); // non-fatal
  }
}

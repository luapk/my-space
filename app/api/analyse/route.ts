import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT = `Analyse this room photo. Return ONLY valid JSON (no markdown fences, no prose) matching EXACTLY this schema:

{"room_type":"string","estimated_wall_width_cm":number,"estimated_wall_height_cm":number,"items":[{"category":"vinyl_records"|"books"|"boxes"|"clothing"|"toys"|"general_clutter"|"plants"|"kitchenware"|"tools","estimated_count":number,"notes":"short string"}],"current_state":"one sentence","wall_colour":"string","floor_material":"string","confidence":"low"|"medium"|"high"}

Use reference objects for dimensions: UK door ~200cm, plug socket ~8.6cm, skirting ~15cm. If no reference, assume wall 300-400cm wide, 240cm high. Count items conservatively. Max 5 item entries.`;

export async function POST(req: Request) {
  try {
    const { base64, mediaType } = await req.json();
    if (!base64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

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
            { type: 'text', text: PROMPT },
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
    const scene = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ scene });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

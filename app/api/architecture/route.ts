import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT = `Analyse this room photo and extract its architectural structure. Ignore all movable objects (furniture, clutter, people, plants, books, records, clothing, boxes). Focus ONLY on the permanent architectural features.

Return ONLY valid JSON, no markdown fences, no prose.

Schema:
{
  "wall_width_cm": number,
  "wall_height_cm": number,
  "room_depth_cm": number,
  "wall_colour_hex": "string (e.g. #E8E4D8)",
  "floor_colour_hex": "string",
  "ceiling_colour_hex": "string",
  "features": [
    {
      "type": "door"|"window"|"radiator"|"light_switch"|"power_socket"|"boiler"|"gas_unit"|"fireplace"|"skirting_vent"|"thermostat"|"shelf_built_in"|"alcove",
      "wall": "back"|"left"|"right"|"floor"|"ceiling",
      "x_cm": number,
      "y_cm": number,
      "width_cm": number,
      "height_cm": number,
      "label": "short descriptor (e.g. 'white panel door' or 'double-hung window')"
    }
  ],
  "confidence": "low"|"medium"|"high"
}

INSTRUCTIONS:
- x_cm and y_cm are the top-left corner of each feature's bounding rectangle on its wall. For features on the back wall, x is measured from the left edge of the wall and y is measured from the floor upward. For features on the left or right wall, x is measured from the back and y from the floor. For floor features, x is left-right and y is front-back. For ceiling features, x is left-right and y is back-front.
- Use standard UK architectural dimensions as reference: interior door 90cm wide × 200cm tall, sash window typically 80-120cm wide × 140-180cm tall, plug socket 8.6cm × 8.6cm, light switch 8.6cm × 8.6cm, domestic radiator 60-180cm wide × 30-80cm tall, combi boiler around 40cm × 70cm.
- If the room dimensions are unclear, default to 350×240×400cm (width × height × depth).
- Return 3-10 features maximum. Only include features that are visible and clearly identifiable.
- If you are not sure what a feature is, don't include it.
- Wall colour: return the hex code for the dominant wall surface colour. Floor: the dominant floor colour. Ceiling: usually off-white, extract the specific shade if visible.`;

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
        max_tokens: 2000,
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
    const architecture = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ architecture });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

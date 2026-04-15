import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const PROMPT = `Analyse this room photo and return ONLY valid JSON, no markdown fences, no prose.

Schema:
{
  "room_type": "string",
  "estimated_wall_width_cm": number,
  "estimated_wall_height_cm": number,
  "items": [{"category": "vinyl_records"|"books"|"boxes"|"clothing"|"toys"|"general_clutter"|"plants"|"kitchenware"|"tools", "estimated_count": number, "notes": "short string"}],
  "current_state": "see voice instructions below",
  "wall_colour": "string",
  "floor_material": "string",
  "confidence": "low"|"medium"|"high"
}

DIMENSIONS: Use reference objects. UK door ~200cm, plug socket ~8.6cm, skirting ~15cm. If no reference visible, assume wall 300-400cm wide, 240cm high. Maximum 5 item entries. Count conservatively.

VOICE FOR "current_state":
Write 3-4 sentences in the voice of an unimpressed but fond friend who has been asked to look at the photo. The friend is dry, observant, specific. Roast the mess based on what is actually visible in the image. Cite real details: a specific stack, a specific pile, a specific corner the eye keeps returning to. The first sentence should land. The last sentence should land harder.

Tone: deadpan, observational, gently mocking. Like the room has disappointed a tasteful older sibling. Affectionate underneath. Never cruel. Never preachy. Never the word "honestly".

Hard rules for the copy:
- No em dashes anywhere. Use full stops and commas.
- No "imagine", no "in a world where", no "let's", no "here's the thing".
- No "elevate", "unlock", "reimagine", "journey", "transform", "curated".
- No three-item lists. No "not just X, it's Y".
- No "honestly", no exclamation marks, no rhetorical questions.
- No promise of a fix. No mention of IKEA or storage. The roast stands alone.
- Specific over clever. The detail is the joke.

Examples of the right voice (do not copy these, write fresh ones for THIS image):
- "Three competing piles of paper on a desk that hasn't seen its own surface in a year. The keyboard is operating from inside a sandwich of unopened post. The plant in the corner has clearly given up on you."
- "A cable situation that suggests a small hostage scenario. The records are not on a shelf, they are on every horizontal surface that isn't a shelf. Whatever happened to that hoodie on the chair, it happened weeks ago."

Now analyse the image and write fresh copy in this voice for "current_state".`;

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
        max_tokens: 1500,
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

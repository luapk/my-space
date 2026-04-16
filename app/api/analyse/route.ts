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
You are roasting this room. Funny, observant, affectionate underneath. The roast must contain at least TWO metaphors or similes that personify the mess. Objects have moods. Piles have politics. Stacks have ambitions. The room is a small civilisation that has lost its way.

Write 4 sentences. Each one earns its place. The first sentence sets the scene with one bold image. The middle sentences pile on specifics, each with its own metaphor or wry observation. The last sentence is the kicker, the one that lands hardest.

Cite real things visible in this specific photo. The detail is the joke. A generic roast is a failed roast.

EXAMPLES OF THE VOICE (write fresh ones for THIS image, never copy these):

"This desk has the haunted look of a place where productivity comes to die. Three coffee mugs are forming a small ceramic Stonehenge around the keyboard. The pile of unopened post on the chair has been there long enough to qualify for council tax. Somewhere underneath all this, a person is allegedly trying to work."

"The records are not on a shelf, they are on a pilgrimage across every flat surface in the room. The plant in the corner is filing for emancipation. There are at least four cables behaving like a small hostage situation behind the TV. The cat, who has seen things, will not comment."

"This is a room that has been quietly losing a war for about eighteen months. The books on the floor have organised themselves into tribes by colour, which is worse than no system at all. A jumper is draped over the chair with the dramatic resignation of a Victorian heroine. None of it is unsalvageable, but all of it is a choice."

HARD RULES:
- No em dashes anywhere. Use full stops, commas, colons.
- No "imagine", no "in a world where", no "let's", no "here's the thing", no "honestly".
- No "elevate", "unlock", "reimagine", "journey", "transform", "curated", "discover".
- No three-item lists with parallel structure. No "not just X, it's Y".
- No exclamation marks. No rhetorical questions. No emoji.
- No mention of IKEA, storage, organising, solutions, or how to fix it. The roast stands alone.
- No moralising. No "we've all been there". No softening qualifiers like "to be fair" or "in fairness".
- The metaphors must be specific and surprising, not the obvious ones. "Piles like mountains" is dead on arrival.

Now write fresh "current_state" copy in this voice for THIS image.`;

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

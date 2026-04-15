import { NextResponse } from 'next/server';
import { buildRenderPrompt, Scene, Layout } from '@/lib/catalogue';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { base64, mediaType, scene, layout, model } = await req.json();
    if (!base64 || !scene || !layout) {
      return NextResponse.json({ error: 'Missing image, scene or layout' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    const useModel = model || 'gemini-3.1-flash-image-preview';
    const prompt = buildRenderPrompt(scene as Scene, layout as Layout);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${useModel}:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mediaType, data: base64 }},
          ],
        }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Gemini ${res.status}: ${text.slice(0, 300)}` }, { status: 500 });
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imgPart = parts.find((p: any) => p.inline_data || p.inlineData);
    if (!imgPart) {
      return NextResponse.json({ error: 'Gemini returned no image (likely safety-filtered)' }, { status: 500 });
    }
    const imgData = imgPart.inline_data?.data || imgPart.inlineData?.data;
    const imgMime = imgPart.inline_data?.mime_type || imgPart.inlineData?.mimeType || 'image/png';
    return NextResponse.json({ base64: imgData, mediaType: imgMime });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

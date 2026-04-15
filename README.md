# IKEA My Space

Upload a photo of a messy room. Get back a Nano Banana 2 render of the same space, reorganized with real IKEA storage products. Interactive hotspots show product details, dimensions, prices, and a dummy "add to basket" button.

**Stack:** Next.js 14 · App Router · Vercel · Claude Sonnet 4.5 (vision + bbox) · Gemini 3.1 Flash Image (Nano Banana 2)

---

## Pipeline

1. **Scene analysis** (`/api/analyse`) — Claude Vision returns a JSON manifest: room type, wall dimensions, item inventory, materials.
2. **Solver** (client-side, deterministic) — picks real IKEA storage SKUs from a curated catalogue of ~38 products, sized to fit the wall and hold the inventory.
3. **Render** (`/api/render`) — Gemini Nano Banana 2 generates a photo of the same room, same items, with the chosen IKEA products neatly arranged.
4. **Hotspot scan** (`/api/scan`) — Claude Vision returns normalized bounding boxes for each visible product, used to overlay tappable hotspots on the rendered image.

---

## Local development

```bash
npm install
cp .env.example .env.local
# Edit .env.local and paste your two API keys
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel via GitHub

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: IKEA My Space v0.3"
git branch -M main
git remote add origin https://github.com/<your-username>/ikea-my-space.git
git push -u origin main
```

### 2. Import to Vercel

- Go to [vercel.com/new](https://vercel.com/new)
- Import the GitHub repo
- Framework: Next.js (auto-detected)
- Click **Deploy** — first deploy will fail because env vars are missing, that's fine

### 3. Add environment variables

In the Vercel project dashboard:

- **Settings → Environment Variables**
- Add `ANTHROPIC_API_KEY` (from [console.anthropic.com](https://console.anthropic.com/settings/keys))
- Add `GEMINI_API_KEY` (from [aistudio.google.com/apikey](https://aistudio.google.com/apikey))
- Apply to Production, Preview, and Development

### 4. Redeploy

- **Deployments → ⋯ → Redeploy** on the most recent build
- Wait ~60 seconds — your live URL will be `https://ikea-my-space-<hash>.vercel.app`

---

## Cost notes

- **Claude Sonnet 4.5**: ~$0.003 per scene analysis, ~$0.003 per hotspot scan
- **Gemini Nano Banana 2 (Flash)**: ~$0.04 per image render
- **Gemini Nano Banana Pro**: ~$0.12 per image render (toggle in header)

Per full pipeline run: ~$0.05 on Flash, ~$0.13 on Pro.

---

## Honest caveats

- **Identity preservation:** Nano Banana 2 is good at "same room + new furniture" but may drift on specific item appearance (your records become *some* records).
- **Wall dimensions:** estimated ±15% from a single photo. Don't drill anything based on this.
- **Hotspot accuracy:** ~70-85%. Bounding boxes can drift slightly off the products.
- **Catalogue:** 38 SKUs, late-2025 UK pricing. Will go stale; either accept that or wire a scraper.
- **Solver:** single-wall only. Corners and L-shapes are v2.
- **Basket:** dummy. Stores SKUs in React state, no real commerce wiring.

---

## Project structure

```
app/
  api/
    analyse/route.ts    # Claude scene analysis
    render/route.ts     # Gemini render
    scan/route.ts       # Claude hotspot bounding boxes
  components/
    HotspotImage.tsx    # Tappable overlay
  globals.css           # Fraunces + JetBrains Mono + brand colours
  layout.tsx
  page.tsx              # Main client UI
lib/
  catalogue.ts          # Product DB + solver + render prompt builder
```

---

Not affiliated with Inter IKEA Systems B.V.

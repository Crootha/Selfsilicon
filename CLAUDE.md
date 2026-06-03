# Selfsilicon — CLAUDE.md

A static SPA that helps users figure out what GPU/hardware they need to run AI models locally, and what it'll cost. Pick models, configure quantization and context, compare NVIDIA, DGX, and Apple Silicon side by side.

## Stack

- **React 18** + **Vite** — no router, single page
- **Tailwind CSS** + **lucide-react** icons
- **IBM Plex Mono** + **Fraunces** (Google Fonts, loaded in inline `<style>`)
- No backend, no database — pure static SPA, all data hardcoded in `src/App.jsx`

## Dev

```bash
cd repo
npm install
npm run dev       # localhost:5173
npm run build     # outputs to dist/
npm run preview   # serve dist/ locally
```

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Everything: data, math, all components (~1000 lines) |
| `src/index.css` | Tailwind directives only |
| `src/main.jsx` | React root mount |
| `index.html` | Vite entry point |
| `docs/PROJECT.html` | Rich visual overview of the whole project — read this first |
| `docs/DATA.md` | Hardware table schema, model presets, quant options, retailer links |
| `docs/CALCULATIONS.md` | Every formula: VRAM, KV cache, prefill, decode, TCO |
| `docs/EXTENDING.md` | Step-by-step: add GPU, model preset, quant format, retailer, refactor plan |
| `docs/DEPLOYMENT.md` | Vercel, Cloudflare Pages, GitHub Pages, self-host, analytics |

## Architecture

```
src/App.jsx
├── DATA (top of file)
│   ├── HARDWARE[]        — GPU/Apple specs, prices, bandwidth
│   ├── KNOWN_MODELS[]    — preset model buttons
│   └── QUANT_OPTIONS[]   — quantization formats with bytes/param
│
├── MATH HELPERS
│   ├── calcVRAM()        — weights + KV cache + overhead
│   ├── calcLatency()     — prefill (compute-bound) + decode (bandwidth-bound)
│   └── getRetailerLinks() — Amazon / Newegg / eBay / Apple URLs
│
└── COMPONENTS
    ├── ModelCard         — search HF / select preset / configure quant + context
    ├── HardwareRow       — one row in the comparison table
    └── App (default)     — state, VRAM totals, filters, sort, summary sidebar
```

## Data invariants

- `HARDWARE[].vram` = usable VRAM (Apple: ~75% of totalRam)
- `HARDWARE[].tflops_fp16` = dense FP16, no sparsity
- `KNOWN_MODELS[].params` = total params in billions (MoE: total, not active)
- `QUANT_OPTIONS[].bytesPerParam` is the only field used in math
- `HARDWARE[].category` values: `gaming` (30xx–50xx GeForce), `workstation` (A-series, Ada RTX), `datacenter`, `dgx`, `apple`
- DGX entries have `units: N` (internal GPU count); they can't be further stacked
- Apple cluster stacking requires `appleCluster=true` toggle; uses 0.55 scaling exponent

## Important math notes

- **Simple mode**: `totalVRAM = weights × 1.2` (20% overhead flat)
- **Detailed mode**: `totalVRAM = weights + kvCache + (weights × 0.1 + 1)`
- KV cache formula: `2 × nLayers × kvDim × context × 2 bytes`. `kvDim = 1024` (standard GQA: 8 KV heads × 128 head_dim). `nLayers = max(32, sqrt(layerParams) × 8)` where for MoE `layerParams = min(params, activeParams × 4)` to avoid absurd counts from total MoE param mass.
- **Decode** is memory-bandwidth-bound (efficiency 0.7 dense, 0.2 MoE)
- **Prefill** is compute-bound (efficiency 0.3 — conservative)
- Calibrated: Qwen 3.5 35B-A3B Q4 on Mac mini M4 ≈ 35 tok/s; H100 Llama 70B ≈ 30 tok/s

## Pending work (see docs/PROJECT.html for full list)

- Fix mobile layout: `overflow-x: auto` on comparison table container
- Add max-price filter (default cap $10k)
- Add hardware text search
- Add tooltips on non-obvious inputs
- Add multi-select compare mode
- Update model presets to 2025 releases (verify on HuggingFace)
- Make multi-GPU stacking more visually obvious

## Review & design conventions

- **All feature reviews and design proposals must be shown as interactive HTML files** — never as markdown text descriptions alone. Write to `tmp/mockup-<feature>.html`. Match the app's dark theme (IBM Plex Mono, Fraunces, amber-500 accent, neutral-950 bg). Make them clickable — filters, toggles, mode switches must actually work so the user can test the interaction, not just read about it.
- **Visual companion: skip the server** — for visual brainstorming, just write the HTML file to `tmp/mockup-<feature>.html` directly. No need to start a local server.
- Spec documents live at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` after HTML approval.

## Conventions

- All formatting helpers (`fmt`, `fmtMoney`, `fmtMs`) are pure functions at module scope
- React keys: model cards use `m.id` (timestamp), hardware rows use `hw.id` (string slug)
- No routing — URL params not yet used (potential future: shareable config via `?c=base64`)
- Grid is 12-column; hardware table columns must sum to 12
- Tailwind primary accent: `amber-500`; dark surfaces: `neutral-950/900/800`

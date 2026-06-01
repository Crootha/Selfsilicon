# Extending

Common modifications, with code locations and step-by-step instructions.

## Add a new GPU

Open `src/App.jsx`, find the `HARDWARE` array (~line 6). Add an entry in the appropriate category section:

```js
{
  id: 'rtx5070ti',         // unique
  vendor: 'NVIDIA',
  name: 'RTX 5070 Ti',
  vram: 16,
  price: 750,
  tflops_fp16: 88,
  bandwidth_gbs: 896,
  power: 300,
  category: 'consumer',
}
```

Save. Vite hot-reloads. Done.

See [DATA.md](DATA.md) for where to find spec sheet numbers.

## Add a new model preset

In `KNOWN_MODELS` (just below `HARDWARE`):

```js
{ id: 'llama-4-405b', name: 'Llama 4 405B', params: 405 },
```

`id` just needs to be unique. `params` is in billions.

## Add a new quantization format

In `QUANT_OPTIONS`:

```js
{ id: 'fp4', name: 'FP4 (4-bit float)', bytesPerParam: 0.5 },
{ id: 'mxfp4', name: 'MX FP4', bytesPerParam: 0.55 },
```

The id is referenced in `Model.quant` state, so users selecting it via the dropdown just works. KV cache stays in FP16 regardless of weight quantization (the calc hardcodes this in `calcVRAM`).

## Add affiliate codes to retailer links

In `getRetailerLinks(hw)`:

```js
return {
  amazon: `https://www.amazon.com/s?k=${query}&tag=YOURTAG-20`,
  ebay: `https://www.ebay.com/sch/i.html?_nkw=${query}&campid=YOURCAMPID`,
  newegg: `https://www.newegg.com/p/pl?d=${query}`,  // Newegg uses Impact, more complex
  apple: ...,
};
```

You need to be enrolled in:
- **Amazon Associates** — easy, instant approval, then drops you if you don't generate sales in 6 months
- **eBay Partner Network** — application process, 1-2 days
- **Newegg Affiliates** — runs through Impact platform, longer onboarding

You're required to disclose affiliate links on your site (FTC rule in the US, similar in EU). Add a footnote like *"Some links earn us a small commission at no extra cost to you."*

## Change the color scheme

Tailwind classes are scattered through the JSX. Search and replace:
- `amber-500` → your primary accent
- `neutral-950 / neutral-900 / neutral-800` → your dark surfaces
- `neutral-300 / neutral-400 / neutral-500` → your text shades

If you want a light theme: invert. `bg-neutral-950` → `bg-neutral-50`, `text-neutral-100` → `text-neutral-900`, etc.

For a real theme system, set up CSS variables in `index.css` and reference them via Tailwind's `bg-[var(--accent)]` arbitrary value syntax.

## Add a "save my config" feature

Two options:

**Local-only** (URL-based, zero infrastructure):
Serialize state to a query string when it changes, parse it on load.

```js
import { useEffect } from 'react';

// In App component:
useEffect(() => {
  const state = { models, calcMode, concurrent, promptTokens, outputTokens };
  const encoded = btoa(JSON.stringify(state));
  window.history.replaceState(null, '', `?c=${encoded}`);
}, [models, calcMode, concurrent, promptTokens, outputTokens]);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('c');
  if (encoded) {
    try {
      const state = JSON.parse(atob(encoded));
      setModels(state.models);
      setCalcMode(state.calcMode);
      // ... etc
    } catch (e) { /* ignore */ }
  }
}, []);
```

Users can bookmark/share URLs with their config baked in.

**LocalStorage** (per-browser persistence):
Same idea, but `localStorage.setItem('gpu-calc-state', JSON.stringify(state))`. Persists across visits without URL ugliness, but doesn't share between browsers.

**Backend** (proper account-based saving):
You need an account system. Use Supabase or Clerk for auth, Postgres or Supabase DB for storage. This is a real project, budget a few days.

## Add cloud pricing comparison

Currently the app only compares ownership. To add "rent from AWS/Lambda/Vast.ai" pricing:

1. Add a `cloud` category to HARDWARE entries with extra fields:
   ```js
   {
     id: 'lambda_h100',
     vendor: 'Lambda Labs',
     name: 'H100 80GB',
     vram: 80,
     pricePerHour: 2.99,
     category: 'cloud',
     ...
   }
   ```
2. In `HardwareRow`, add a branch: if cloud, compute monthly cost = `pricePerHour × 24 × 30 × utilization` and present that as the comparable price.
3. Compare against ownership TCO: a $27k H100 only beats $2.99/hr if you use it >9,000 hours (~1 year continuous) at 100% utilization. The math makes the case for renting until you hit serious scale.

For real-time cloud pricing, you need a backend — these prices change. Vast.ai has an API; Lambda Labs publishes a price list; AWS pricing is public but a nightmare to parse.

## Improve VRAM accuracy with real model configs

Instead of estimating `n_layers` and `d_model` from param count, fetch the actual config from HuggingFace.

In `ModelCard.selectModel`:

```js
const detail = await fetch(`https://huggingface.co/api/models/${hfModel.id}`).then(r => r.json());

// Try to fetch the config.json
let config = null;
try {
  const configRes = await fetch(`https://huggingface.co/${hfModel.id}/resolve/main/config.json`);
  config = await configRes.json();
} catch (e) {}

onUpdate({
  ...model,
  name: hfModel.id,
  params,
  source: 'huggingface',
  // Add these from config:
  nLayers: config?.num_hidden_layers,
  dModel: config?.hidden_size,
  nKvHeads: config?.num_key_value_heads,  // for GQA
});
```

Then `calcVRAM` uses these directly instead of estimating:

```js
const nLayers = m.nLayers ?? Math.max(32, Math.round(Math.sqrt(params) * 8));
const dModel = m.dModel ?? Math.max(2048, Math.round(Math.sqrt(params) * 600));
// For GQA: KV size is reduced by (nKvHeads / nHeads), often 1/4 or 1/8
```

This is the single biggest accuracy improvement for the calc. Models with grouped-query attention (Llama 3, Qwen 3, basically everything modern) currently get their KV cache massively overestimated.

## Add more retailers

Append to `getRetailerLinks` return:

```js
{
  // existing...
  microcenter: `https://www.microcenter.com/search/search_results.aspx?Ntt=${query}`,
  bestbuy: `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`,
  bhphoto: `https://www.bhphotovideo.com/c/search?Ntt=${query}`,
}
```

In `HardwareRow`, add the link buttons next to the existing ones. Keep them short — `mc`, `bb`, `bh`.

## Refactor to multi-file

When `App.jsx` becomes painful to navigate (~1500 lines), split as suggested in [ARCHITECTURE.md](ARCHITECTURE.md):

```
src/
├── App.jsx                  # state + layout
├── components/
│   ├── ModelCard.jsx
│   ├── HardwareRow.jsx
│   ├── SummaryCard.jsx
│   └── ComparisonTable.jsx
├── lib/
│   ├── vram.js
│   ├── latency.js
│   ├── format.js
│   └── retailers.js
└── data/
    ├── hardware.js
    ├── models.js
    └── quantization.js
```

Suggestion: move data first (zero risk, biggest readability win), then helpers, then components last.

## Common pitfalls

**Grid columns don't add up to 12.** The hardware table uses a 12-column grid. When adding/removing columns, count them. Off-by-one looks really bad.

**Forgetting `key` props on lists.** Every map render needs a stable key. Model cards use `m.id` (timestamp); hardware rows use `hw.id`. Don't use array index — re-orderings break.

**Async state in `useMemo`.** Don't fetch inside a `useMemo`. The HuggingFace fetches in `ModelCard` use `useState` + async functions, not memos. Memos are for pure derivations.

**CORS surprises.** Browser fetches are blocked from arbitrary origins. HuggingFace allows CORS, retailers don't. Anything cross-origin needs the server to opt in. If a `fetch` fails silently, check the browser console — there will be a CORS error.

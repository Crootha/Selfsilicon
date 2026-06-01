# Data

This document describes the hardware database, model presets, and quantization options. All of this lives at the top of `src/App.jsx`.

## Hardware table

The `HARDWARE` array is the source of truth for what gets shown in the comparison table.

```js
{
  id: 'rtx4090',           // unique key, used for React keys
  vendor: 'NVIDIA',        // 'NVIDIA' | 'Apple'
  name: 'RTX 4090',        // display name
  vram: 24,                // GB
  price: 1800,             // USD, approximate
  tflops_fp16: 165,        // TFLOPS at FP16 precision
  bandwidth_gbs: 1008,     // memory bandwidth in GB/s
  power: 450,              // watts at full load
  category: 'consumer',    // 'consumer' | 'workstation' | 'datacenter' | 'dgx' | 'apple'
}
```

Extra fields used by some entries:

```js
{
  // Apple machines: total system RAM (vram is the usable portion ≈ 75%)
  totalRam: 192,

  // DGX systems: how many internal GPUs (affects latency scaling)
  units: 8,
  note: '8× H100 80GB, NVLink',  // shown in UI as supplementary info
}
```

### Where the numbers come from

| Field | Source |
|-------|--------|
| `vram` | Spec sheets (NVIDIA, Apple) |
| `price` | Average of Newegg / Amazon / Apple Store / enterprise MSRP, snapshotted ~2025. NVIDIA datacenter prices vary wildly by reseller. |
| `tflops_fp16` | Whitepapers (NVIDIA Ada/Hopper/Blackwell, M-series silicon). Dense matrix FP16 with FP32 accumulation, no sparsity. |
| `bandwidth_gbs` | Spec sheets, peak theoretical bandwidth. |
| `power` | TDP/TBP figures. Real load often lower. |

### Apple VRAM

Apple Silicon uses unified memory: the GPU shares RAM with the CPU and rest of the system. The `vram` field reflects what's actually usable for model weights — typically ~75% of total RAM. The exact ratio depends on macOS version and `iogpu.wired_limit_mb` settings (advanced users can push it to 90%+).

Example: Mac Studio M3 Ultra 512GB has `vram: 384` (75% of 512), `totalRam: 512`.

### Adding a new hardware entry

1. Find the spec sheet (search "<gpu name> whitepaper" or "<gpu name> specifications site:nvidia.com")
2. Get: VRAM, FP16 TFLOPS (without sparsity), memory bandwidth, TDP
3. Find current price: average a few retailers, take the median
4. Add to the appropriate category section in the `HARDWARE` array
5. Pick a unique `id`

That's it. The comparison table picks it up automatically because rendering is data-driven.

### Updating prices

Easiest: search for the GPU on the retailers, eyeball the average, update the `price` field. The retailer links in the UI are always live, so they're the source of truth for "right now" pricing.

For a more rigorous update, consider scraping a price-tracking site (Keepa for Amazon, etc.) — but that needs a backend (CORS blocks direct browser fetching). See [DEPLOYMENT.md](DEPLOYMENT.md) for a section on adding a backend.

## Known models (presets)

```js
const KNOWN_MODELS = [
  { id: 'qwen-3-72b', name: 'Qwen 3 72B', params: 72 },
  ...
];
```

These power the preset buttons in `ModelCard`. They're hardcoded because HuggingFace's API doesn't have a "popular models" endpoint that reliably returns the canonical version of each model — searches surface many forks and quants of the same base model.

For MoE models, `params` is the total parameter count (the number that drives VRAM), not active parameters. Mixtral 8x7B has `params: 47` (not 7, not 56).

## Quantization options

```js
const QUANT_OPTIONS = [
  { id: 'fp16', name: 'FP16 (16-bit)', bytesPerParam: 2 },
  { id: 'fp8', name: 'FP8 (8-bit float)', bytesPerParam: 1 },
  { id: 'int8', name: 'INT8 (8-bit)', bytesPerParam: 1 },
  { id: 'int4', name: 'INT4 / Q4 (4-bit)', bytesPerParam: 0.5 },
  { id: 'q5', name: 'Q5 (5-bit)', bytesPerParam: 0.625 },
  { id: 'q3', name: 'Q3 (3-bit)', bytesPerParam: 0.375 },
];
```

`bytesPerParam` is the only field that matters for VRAM math. `name` is what shows in the dropdown.

Common quantization formats not in this list and what they map to:
- **GGUF Q4_K_M, Q4_K_S, Q4_0** → `int4` (close enough; real on-disk varies by ~5%)
- **GGUF Q5_K_M, Q5_K_S** → `q5`
- **GPTQ 4-bit** → `int4`
- **AWQ 4-bit** → `int4`
- **EXL2** → varies; pick the closest bits-per-weight setting (`int4` for 4.0bpw, `q5` for 5.0bpw)
- **FP4** (Blackwell-only) → not yet listed; add as `{ id: 'fp4', name: 'FP4 (4-bit float)', bytesPerParam: 0.5 }`

## Retailer links

Defined in `getRetailerLinks(hw)`:

```js
{
  amazon: `https://www.amazon.com/s?k=${query}`,
  ebay: `https://www.ebay.com/sch/i.html?_nkw=${query}`,
  newegg: `https://www.newegg.com/p/pl?d=${query}`,
  apple: hw.vendor === 'Apple' ? `https://www.apple.com/shop/buy-mac/...` : null,
}
```

`query` is `encodeURIComponent(hw.name)`. The links just search the retailer's catalog — no API integration, no affiliate codes (yet), no current price scraping.

**Adding an affiliate code** for monetization: append `?tag=YOUR_TAG` (Amazon Associates) or `?campid=YOUR_ID` (eBay Partner Network) to the URLs. Each retailer has their own URL parameter convention. Test that the URL still works after adding the tag.

**Adding more retailers**: just extend the returned object. Don't forget to render the link button in `HardwareRow`.

**Localization** (e.g., amazon.co.uk, amazon.de): switch domains based on user locale. The Vercel deployment can expose `request.geo.country` via Edge Middleware; for static hosting, use browser `navigator.language` as a rough heuristic.

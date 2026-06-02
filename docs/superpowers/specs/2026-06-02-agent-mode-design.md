# Agent Mode — Design Spec
**Date:** 2026-06-02  
**Status:** Approved for implementation

---

## What we're building

A toggle on the hardware comparison table that switches between two views of the same data:

- **⚡ Inference mode** (default, today's behaviour) — optimised for "which GPU runs my model fastest?"
- **🤖 Agent mode** (new) — optimised for "which GPU is best for running agents 24/7?"

Everything outside the hardware table is unchanged.

---

## Why

Gaming GPUs dominate the inference table because they win on tok/s-per-dollar for models that fit in 24 GB. But for agentic workloads — long-running pipelines, tool-calling loops, sustained compute over hours — different properties matter:

- **ECC memory** — workstation cards prevent silent bit-flip corruption over thousands of tool calls
- **Sustained TDP** — gaming cards throttle clock speed under continuous AI load; workstation/Apple Silicon hold rated speed
- **Parallel capacity** — how many simultaneous agent instances fit in VRAM

The current table doesn't surface any of this. RTX A5000 24 GB looks identical to RTX 3090 24 GB in inference mode. In agent mode it scores ~30 points higher.

---

## Design

### Toggle placement

A two-button segmented control in the strip above the hardware table — same row as the mode description text. Matches the visual style of the existing `simple / detailed` VRAM calc toggle.

```
[ ⚡ Inference ]  [ 🤖 Agent ]   Agent mode — parallel capacity, ECC, sustained load, composite score
```

### Inference mode (unchanged)

Columns: Hardware · VRAM · Price · $/GB · Mem BW · Prefill · Decode · Power · TCO  
Sort: fits first, then cheapest

### Agent mode (new columns)

Columns: Hardware · VRAM · Price · **Agents** · **ECC** · **Throttle** · **Agent score** · TCO  
Sort: fits first, then agent score descending

| Column | Definition |
|--------|-----------|
| **Agents** | `floor(hw.vram / model_vram_needed)` — simultaneous instances in VRAM. `2×` = green, `1×` = amber, `—` = red (doesn't fit) |
| **ECC** | `ECC ✓` (green) / `no ECC` (grey) — hardcoded per GPU. Workstation + datacenter = true. Gaming + Apple = false |
| **Throttle** | `✓ sustained` (green) / `⚠ throttles` (amber) — workstation + datacenter + Apple Silicon = sustained. Gaming = throttles |
| **Agent score** | Composite 0–100, bar + number. Formula below |
| **TCO** | Unchanged — hardware price + electricity cost |

### Agent score formula

```
score = ecc(30) + sustained(25) + agents_pts(max 20) + vram_per_dollar_pts(max 25)

ecc_pts          = hw.ecc ? 30 : 0
sustained_pts    = hw.sustained ? 25 : 0
agents_pts       = min(floor(hw.vram / model_vram), 4) × 5
vram_per_dollar  = (hw.vram / hw.price) × 1000
vram_pts         = min(vram_per_dollar / 0.3, 25)
```

Score colour: ≥70 = green, ≥40 = amber, <40 = grey.

### Info callout

When Agent mode is active, a one-paragraph callout appears between the toggle and the table explaining what the columns mean. Dismissible by switching back to Inference mode. Not dismissible independently (no X button needed — it's contextual).

### What stays unchanged

- Section 01 (model picker, quant, context) — no changes
- Vendor / category / budget / Apple cluster filters — no changes
- Compare mode — works in both modes, picks up whichever columns are currently showing
- Mobile card layout — agent columns collapse to the same 2-column card pattern; agent score replaces decode speed as the "hero" metric
- Rows dim at 35% opacity when model doesn't fit — same as today

---

## Data changes required

Two boolean fields added to every entry in the `HARDWARE[]` array in `src/App.jsx`:

```js
ecc: boolean       // true = workstation + datacenter; false = gaming + apple
sustained: boolean // true = workstation + datacenter + apple; false = gaming
```

No new GPU entries needed — these are metadata on existing records.

---

## New functions

```js
// How many simultaneous agent instances fit
function parallelAgents(hw, modelVRAM) {
  return Math.max(0, Math.floor(hw.vram / Math.max(modelVRAM, 1)));
}

// Composite agent suitability score (0–100)
function agentScore(hw, modelVRAM) {
  const eccPts  = hw.ecc ? 30 : 0;
  const sustPts = hw.sustained ? 25 : 0;
  const agentPts = Math.min(parallelAgents(hw, modelVRAM), 4) * 5;
  const vpdPts  = Math.min((hw.vram / hw.price * 1000) / 0.3, 25);
  return Math.round(eccPts + sustPts + agentPts + vpdPts);
}
```

---

## State changes in App component

```js
const [hwMode, setHwMode] = useState('inference'); // 'inference' | 'agent'
```

`hwMode` lives in the `App` component alongside existing state. Passed down to `HardwareRow` to control which columns render.

---

## Out of scope

- No changes to the model picker or VRAM calculation logic
- No new GPU entries (ECC/sustained are metadata on existing cards)
- No separate agent-only page or route
- No localStorage persistence of mode preference (default inference on every load)
- Mixed HW prefill/decode mode is a separate spec

---

## Reference mockup

`tmp/mockup-agent-mode.html` — fully interactive, all logic matches spec above.

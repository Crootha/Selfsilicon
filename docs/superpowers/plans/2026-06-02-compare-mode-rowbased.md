# Compare Mode Row-Based Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 4-column `ComparePanel` with a row-based `CompareTable` where GPUs are rows and metrics are columns, removing the 4-item cap.

**Architecture:** Single-file change in `src/App.jsx`. Delete `ComparePanel` (~line 867, ~95 lines). Add `CompareTable` in its place. Update the render site to pass `onRemove`. Update the 4-cap to 10 in two spots.

**Tech Stack:** React 18, Tailwind CSS, lucide-react (`X` icon), existing helpers `fmt`, `fmtMoney`, `fmtMs`, `calcLatency`.

---

### Task 1: Delete `ComparePanel`, add `CompareTable`

**Files:**
- Modify: `repo/src/App.jsx` — replace lines 867–963 (the entire `ComparePanel` function)

No test framework is set up — verify visually with `npm run dev` after each task.

- [ ] **Step 1: Replace `ComparePanel` with `CompareTable`**

Find the block starting with `function ComparePanel(` and ending with its closing `}` (the line just before `const LS_KEY`). Replace the entire function with:

```jsx
function CompareTable({ items, totalVRAM, runtimeMonths, electricityRate, promptTokens, outputTokens, primaryModel, appleCluster, onClose, onRemove }) {
  const stats = items.map(hw => {
    const canStack = (hw.vendor === 'NVIDIA' && hw.category !== 'dgx') || (hw.vendor === 'Apple' && appleCluster);
    const needed = canStack && totalVRAM > 0 ? Math.ceil(totalVRAM / hw.vram) : 1;
    const vramOverhead = hw.vendor === 'Apple' ? 0.15 : 0.1;
    const effectiveVRAM = hw.vram * needed * (needed === 1 ? 1 : 1 - vramOverhead * (needed - 1) / needed);
    const reallyFits = canStack ? true : effectiveVRAM >= totalVRAM;
    const totalPrice = hw.price * needed;
    const totalPower = hw.power * needed;
    const costPerGB = totalPrice / (hw.vram * needed);
    const yearlyKwh = (totalPower / 1000) * 24 * 30 * runtimeMonths * 0.5;
    const electricityCost = yearlyKwh * electricityRate;
    const totalCost = totalPrice + electricityCost;
    const latency = primaryModel
      ? calcLatency(primaryModel.params, primaryModel.quant, promptTokens, outputTokens, hw, Math.max(needed, hw.units || 1), primaryModel.activeParams)
      : null;
    return { hw, needed, reallyFits, totalPrice, totalPower, costPerGB, electricityCost, totalCost, latency };
  });

  const cols = [
    { key: 'vram',    label: 'VRAM',    get: s => s.hw.vram * s.needed,            fmt: v => `${v} GB`,                      best: 'max' },
    { key: 'fits',    label: 'Fits',    get: s => s.reallyFits ? 1 : 0,            fmt: (_v, s) => s.reallyFits ? '✓' : '✗', best: null  },
    { key: 'price',   label: 'Price',   get: s => s.totalPrice,                     fmt: v => fmtMoney(v),                    best: 'min' },
    { key: 'cpgb',    label: '$/GB',    get: s => s.costPerGB,                      fmt: v => `$${v.toFixed(0)}`,             best: 'min' },
    { key: 'bw',      label: 'Mem BW',  get: s => s.hw.bandwidth_gbs,               fmt: v => `${fmt(v, 0)} GB/s`,           best: 'max' },
    { key: 'prefill', label: 'Prefill', get: s => s.latency?.prefillMs ?? null,     fmt: v => v != null ? fmtMs(v) : '–',    best: 'min' },
    { key: 'decode',  label: 'Decode',  get: s => s.latency?.tokensPerSec ?? null,  fmt: v => v != null ? `~${fmt(v, 0)} tok/s` : '–', best: 'max' },
    { key: 'power',   label: 'Power',   get: s => s.totalPower,                     fmt: v => `${v} W`,                      best: 'min' },
    { key: 'tco',     label: 'TCO',     get: s => s.totalCost,                      fmt: v => fmtMoney(v),                   best: 'min' },
  ];

  const bestPerCol = {};
  cols.forEach(col => {
    if (!col.best) return;
    const vals = stats.map(s => col.get(s)).filter(v => v !== null && !isNaN(v));
    if (vals.length < 2) return;
    if (vals.every(v => v === vals[0])) return;
    bestPerCol[col.key] = col.best === 'max' ? Math.max(...vals) : Math.min(...vals);
  });

  return (
    <div className="mb-6 border border-amber-500/25 bg-neutral-950">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-500/20 bg-neutral-900/60">
        <span className="text-xs font-mono uppercase tracking-widest text-amber-500">
          ▮ comparing {items.length} item{items.length !== 1 ? 's' : ''}
        </span>
        <button onClick={onClose} className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-200 transition-colors">
          <X size={12} /> exit compare
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="px-2 py-3 w-8" />
              <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-neutral-500 font-normal">GPU</th>
              {cols.map(col => (
                <th key={col.key} className="px-3 py-3 text-left text-[10px] uppercase tracking-wider text-neutral-500 font-normal whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stats.map(s => (
              <tr key={s.hw.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/40 transition-colors">
                <td className="px-2 py-2.5 text-center">
                  <button
                    onClick={() => onRemove(s.hw.id)}
                    title="Remove from compare"
                    className="w-5 h-5 flex items-center justify-center border border-neutral-700 text-neutral-600 hover:border-red-400 hover:text-red-400 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="text-neutral-100">{s.hw.name}</div>
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                    {s.hw.vendor} · {s.hw.category}
                    {s.needed > 1 && <span className="text-amber-500/70 ml-1">· {s.needed}× stacked</span>}
                  </div>
                </td>
                {cols.map(col => {
                  const v = col.get(s);
                  const isBest = bestPerCol[col.key] !== undefined && v === bestPerCol[col.key];
                  const isFits = col.key === 'fits';
                  return (
                    <td key={col.key} className={`px-3 py-2.5 whitespace-nowrap ${
                      isFits
                        ? s.reallyFits ? 'text-emerald-400' : 'text-red-400'
                        : isBest ? 'text-amber-400' : 'text-neutral-300'
                    }`}>
                      {col.fmt(v, s)}
                      {isBest && !isFits && <span className="text-amber-500/50 ml-1 text-[9px]">★</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-neutral-800 text-[10px] text-neutral-600">
        ★ best value in each column · click × to remove an item
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update render site — swap `ComparePanel` for `CompareTable`, add `onRemove`**

Find (around line 1547):
```jsx
        {compareMode && compareItems.length >= 2 && (
          <ComparePanel
            items={compareItems}
            totalVRAM={totalVRAM}
            runtimeMonths={runtimeMonths}
            electricityRate={electricityRate}
            promptTokens={promptTokens}
            outputTokens={outputTokens}
            primaryModel={primaryModel}
            appleCluster={appleCluster}
            onClose={() => { setCompareMode(false); setCompareSelected(new Set()); }}
          />
        )}
```

Replace with:
```jsx
        {compareMode && compareItems.length >= 2 && (
          <CompareTable
            items={compareItems}
            totalVRAM={totalVRAM}
            runtimeMonths={runtimeMonths}
            electricityRate={electricityRate}
            promptTokens={promptTokens}
            outputTokens={outputTokens}
            primaryModel={primaryModel}
            appleCluster={appleCluster}
            onClose={() => { setCompareMode(false); setCompareSelected(new Set()); }}
            onRemove={(id) => {
              setCompareSelected(prev => {
                const n = new Set(prev);
                n.delete(id);
                if (n.size < 2) setCompareMode(false);
                return n;
              });
            }}
          />
        )}
```

- [ ] **Step 3: Raise the item cap from 4 to 10**

Three spots — all in `src/App.jsx`:

**3a.** Find (mobile `+` button title, around line 683):
```jsx
              title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 4 items'}
```
Replace with:
```jsx
              title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 10 items'}
```

**3b.** Find (desktop `+` button title, around line 788):
```jsx
            title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 4 items'}
```
Replace with:
```jsx
            title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 10 items'}
```

**3c.** Find the `canSelect` prop and the guard inside `onToggleSelect` (around line 1647):
```jsx
                canSelect={compareSelected.size < 4}
                onToggleSelect={() => setCompareSelected(prev => {
                  const next = new Set(prev);
                  if (next.has(hw.id)) {
                    next.delete(hw.id);
                  } else if (next.size < 4) {
                    next.add(hw.id);
                  }
                  return next;
                })}
```
Replace with:
```jsx
                canSelect={compareSelected.size < 10}
                onToggleSelect={() => setCompareSelected(prev => {
                  const next = new Set(prev);
                  if (next.has(hw.id)) {
                    next.delete(hw.id);
                  } else if (next.size < 10) {
                    next.add(hw.id);
                  }
                  return next;
                })}
```

- [ ] **Step 4: Start dev server and verify**

```bash
cd repo && npm run dev
```

Check:
1. Select 2+ GPUs with `+` buttons → "compare (N) →" button appears in toolbar
2. Click compare → table switches to row-based layout (GPUs as rows, metrics as columns)
3. ★ amber highlights appear on best value per column
4. ✓ green / ✗ red in Fits column
5. Click `×` on a row → removes that item, stays in compare if ≥2 remain; exits compare if drops to 1
6. Select 5+ items → still works (no 4-cap error)
7. Click "exit compare" → full table restored

- [ ] **Step 5: Commit**

```bash
git add repo/src/App.jsx
git commit -m "feat: replace ComparePanel with row-based CompareTable, raise cap to 10"
```

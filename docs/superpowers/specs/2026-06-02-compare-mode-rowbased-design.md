# Compare Mode — Row-Based Redesign

**Date:** 2026-06-02  
**Status:** Approved

## Summary

Replace the current 4-column side-by-side compare panel with a row-based layout where GPUs are rows and metrics are columns — the same orientation as the main hardware table. Removes the 4-item cap.

## Current behaviour

- `ComparePanel` component: metrics = rows, GPUs = columns
- Hard cap at 4 items (5th column causes horizontal overflow)
- Panel appears below the toolbar and above the hardware table; table shows only selected items during compare

## New behaviour

- Compare table: GPUs = rows, metrics = columns (same as main hardware table)
- No item cap — 8–10 items fit comfortably
- Selection flow unchanged: `+` checkbox on each row → "compare (N) →" button in toolbar → table switches to compare view
- Exiting compare: "× exit compare" button in toolbar clears selection and restores full table
- ★ best-value highlights per **column** (was per row)
- `×` remove button on each compare row to deselect without exiting compare mode entirely

## Columns

Same metrics as the current panel, now as columns:

| Column | Notes |
|--------|-------|
| (×) | Remove button — deselects item |
| GPU name + vendor/category sub-label | |
| VRAM | raw × needed, sub-label shows `N×vram` if stacked |
| Fits | ✓ / ✗ |
| Price | total (stacked) |
| $/GB | |
| Mem BW | |
| Prefill (TTFT) | `–` if no model selected |
| Decode | `–` if no model selected |
| Power | total watts |
| TCO | total cost of ownership |

## ★ highlight logic

For each metric column, find the best value across all compared rows and mark it amber with `★`. "Best" = max for VRAM/BW/Decode, min for Price/$/GB/Power/TCO/Prefill. Fits column: no highlight (binary). All-same values: no highlight.

## Component changes

- **Delete** `ComparePanel` component (~95 lines)
- **Add** `CompareTable` component: renders a `<table>` with the row-based layout, using the same stat computation logic as the old `ComparePanel`
- The `CompareTable` replaces `ComparePanel` at the same render site in `App`
- `canSelect` cap: remove the `compareSelected.size < 4` check — no cap needed. Keep a soft cap at 10 to prevent degenerate cases (`compareSelected.size < 10`)
- The `canSelect` tooltip on the `+` button changes from "Max 4 items" to "Max 10 items"

## State

No state changes — `compareMode` (bool) and `compareSelected` (Set) remain unchanged.

## Out of scope

- Sorting within compare table (use main table sort before entering compare)
- Persisting compare selection to localStorage (ephemeral, intentional)
- Favorites feature (separate spec)

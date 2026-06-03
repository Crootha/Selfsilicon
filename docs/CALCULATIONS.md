# Calculations

This document explains every formula in the app, where the numbers come from, and how much you should trust them. **Short version: trust the relative comparisons more than the absolute numbers.**

## VRAM

### Weights

The base cost is straightforward:

```
weights_GB = (params × 10⁹ × bytes_per_param) / 10⁹
           = params × bytes_per_param
```

Where `bytes_per_param` depends on quantization:

| Quantization | Bytes/param | Example: 70B model |
|--------------|-------------|--------------------|
| FP16 / BF16  | 2.0         | 140 GB             |
| FP8 / INT8   | 1.0         | 70 GB              |
| Q5           | 0.625       | 43.75 GB           |
| INT4 / Q4    | 0.5         | 35 GB              |
| Q3           | 0.375       | 26.25 GB           |

**Caveat:** "Q5/Q4/Q3" are llama.cpp-style block quantization formats. The actual on-disk size includes small metadata overhead per block (~3-5%) which we ignore. Real GGUF files are slightly larger than these calcs.

### Simple mode

```
total = weights × 1.2
```

A flat 20% overhead. Used when you don't care about context length. Good enough for "will this fit at all?" questions.

### Detailed mode

```
total = weights + kv_cache + overhead
```

Where:

**KV cache** stores the attention keys and values for every token in the context window. It scales with context length, which is why long-context inference is so expensive.

```
kv_cache_GB = (2 × n_layers × d_model × context × batch × 2) / 10⁹
```

The two 2's are: K + V (factor of 2), and FP16 storage (2 bytes). KV cache is almost always kept in FP16 even if the weights are INT4 — quantizing it hurts quality more than it helps memory.

The catch: we don't know `n_layers` or the KV head count without fetching each model's config. So we estimate:

```js
// Modern models use GQA — far fewer KV heads than query heads.
// Llama/Qwen 70B: 8 KV heads × 128 head_dim = 1024. Using full d_model (~8192) is 8× too large.
kv_dim   = 1024   // constant: 8 KV heads × 128 head_dim, reliable for 7B–235B models

// For MoE, total params far exceed the attention architecture.
// Qwen 3.5 235B-A22B behaves like a ~88B dense model for layer count.
layer_params = isMoE ? min(params, activeParams × 4) : params
n_layers     = max(32, round(sqrt(layer_params) × 8))
```

Calibration:
- Llama 3 70B (80 layers real): formula gives `n_layers≈68` → KV at 128k ≈ 36 GB (real ≈ 43 GB, within 20%).
- Qwen 3.5 72B (80 layers, 8 KV heads real): same architecture → same result.
- Qwen 3.5 235B-A22B MoE (22B active): `layer_params = min(235, 88) = 88` → `n_layers≈75` → KV at 128k ≈ 40 GB.

The old formula used `d_model ≈ sqrt(params) × 600` (full multi-head attention), which overestimated by 4–8× for GQA models and produced wildly inflated KV cache for large MoE models at long context.

**Overhead** is everything else: activations, CUDA kernels loaded into VRAM, framework allocator fragmentation:

```
overhead_GB = weights × 0.1 + 1
```

Linear in model size plus 1 GB baseline. This is a guess; vLLM uses more than llama.cpp, which uses more than ExLlamaV2.

### Multi-model VRAM

When multiple models are selected:

```
if concurrent:
    totalVRAM = Σ vram_i
else:
    totalVRAM = max(vram_i)
```

This assumes concurrent models live in separate memory regions (true for vLLM, llama.cpp with multiple instances, Ollama with parallel models). Sharing via tied weights is possible but rare in practice.

## Multi-GPU configuration

For NVIDIA cards (excluding DGX systems), we compute how many we need:

```
needed = ceil(totalVRAM / single_GPU_VRAM)
```

When using multiple GPUs with tensor parallelism, there's overhead:

```
effective_VRAM = needed × per_GPU_VRAM × (1 − 0.1 × (needed − 1) / needed)
```

This models ~10% VRAM lost to parallelism state (gradient buffers, communication buffers, replicated state). Numbers from the vLLM and DeepSpeed papers, rounded.

Performance scales sublinearly:

```
scale_factor = needed^0.85
```

So 2 GPUs ≈ 1.8× speed, 4 GPUs ≈ 3.1×, 8 GPUs ≈ 5.7×. This is consistent with reported tensor parallelism efficiency for inference on NVLink-equipped systems. PCIe-only setups will be worse.

**Why DGX systems aren't stacked:** they're already 8-GPU boxes (or 72-GPU racks for GB200 NVL72). Stacking DGXes requires Infiniband fabric and a real datacenter, well outside what this calc covers. Pick a bigger DGX or move to multi-node, which the calc deliberately doesn't model.

**Apple machines can be clustered** via [EXO](https://github.com/exo-explore/exo) or llama.cpp RPC over Thunderbolt — toggle the "Apple cluster" switch above the comparison table to enable. Scaling efficiency is much worse than NVIDIA tensor parallelism though: the calc uses a `^0.55` exponent (2 nodes ≈ 1.4× speed, 4 nodes ≈ 2.1× speed) because Thunderbolt 4/5 (~40-80 Gbps) is dramatically slower than NVLink (~7,200 Gbps), and per-layer activations have to cross that link. Off by default since most Apple users would buy a single bigger machine rather than cluster.

## Prefill (time to first token, TTFT)

Prefill is **compute-bound**: the model processes the entire prompt in one big matrix multiply per layer.

```
prefill_FLOPs = 2 × params × prompt_tokens
prefill_seconds = prefill_FLOPs / (peak_TFLOPS × 10¹² × efficiency)
```

The factor of 2 comes from forward-pass FLOP count per parameter per token. The 10¹² converts TFLOPS to FLOPS.

`efficiency = 0.3` is the magic constant. Theoretical peak FLOPS assume perfect utilization (no memory stalls, no kernel launch overhead, no synchronization). Real inference engines achieve ~30-50% of peak for prefill on long sequences with FlashAttention. We pick 30% as a conservative number that doesn't oversell hardware.

**What this misses:**
- Quantized inference is faster on hardware with dedicated INT8/FP8 tensor cores (H100, B200). The calc uses the FP16 TFLOPS number even for INT8 inference, which underestimates speed on those cards.
- FlashAttention 2/3 vs naive attention can be 2-3× different.
- Very short prompts (<512 tokens) are usually memory-bound, not compute-bound, but we model them as compute-bound regardless.

**Real-world reference points** (Llama 3 70B FP16, 2048-token prompt):
- 1× H100: actually ~250ms, calc says ~189ms (calc is ~25% too optimistic)
- 1× RTX 4090: doesn't fit; calc shows multi-GPU
- 4× RTX 4090: actually ~600ms, calc says ~340ms (calc is too optimistic)

So **prefill numbers in the calc are roughly 30-50% optimistic** compared to vLLM benchmarks. Use them for relative comparisons.

## Decode (tokens per second)

Decode is **memory-bandwidth-bound**: to generate each new token, every weight needs to be read from VRAM once.

```
ms_per_token = (model_size_GB / (bandwidth_GB/s × efficiency)) × 1000
tokens_per_second = 1000 / ms_per_token
```

`efficiency = 0.7`. Memory subsystems can sustain 70-80% of peak bandwidth for the kinds of access patterns LLM inference does (streaming reads, large blocks). This is well-supported by benchmarks.

**Why this is the right model:** during decode, you generate one token at a time. The arithmetic per token (~2× params FLOPS) is dwarfed by the bandwidth requirement of reading all weights (model_size × 1 byte/op... ish). On an RTX 4090 with 1008 GB/s and ~165 TFLOPS, the bandwidth saturates first.

**Real-world reference points** (Llama 3 70B FP16):
- 1× H100 (3.35 TB/s): calc says ~33 tok/s, real-world ~30 tok/s ✓
- 1× RTX 4090 (1 TB/s): doesn't fit, but for smaller models calc tracks measured numbers within 10-20%
- M2 Ultra (800 GB/s, 70B Q4 = 35 GB): calc says ~16 tok/s, real-world reports ~12-18 tok/s ✓

**Decode numbers are usually within ±25% of reality**, much more reliable than prefill. They are the bedrock comparison: if card A has 3× the bandwidth of card B, it will run decode ~3× faster, period.

## Total cost of ownership (TCO)

```
yearly_kWh = (power_W / 1000) × 24 × 30 × runtime_months × utilization
electricity_cost = yearly_kWh × rate
TCO = (hw_price × needed) + electricity_cost
```

Where `utilization = 0.5` (assumes ~50% duty cycle: not always answering, not always idle).

Notes:
- "30 days/month" simplification, off by ~1.5% over a year. Don't care.
- Idle power for these cards is non-trivial (RTX 4090 idles at ~25W, H100 at ~70W). At 50% duty cycle, we're approximately right; for low-utilization servers, increase the utilization factor up.
- Does not include: cooling, networking, the rest of the workstation/server (CPU, RAM, PSU, motherboard), or rack costs.
- Does not include amortization or depreciation. A used 3090 holds its value differently than a new H100.

## Why "rough estimates" are still useful

Every number in this app has caveats. So why bother?

Because **the relative ordering is robust** even when absolute values aren't. If the calc says "4× RTX 4090 is cheaper than 1× H100 for your workload" — even with all the approximation, that conclusion will hold up. The math captures the right structure: cost is dominated by hardware, decode is dominated by bandwidth, prefill is dominated by compute, and they trade off differently across vendors.

The wrong way to use the calc: "It says 33 tokens/second, so I'll get exactly 33." The right way: "It says config A gets 2× more tokens/sec per dollar than config B, so A is better for me."

## Where to improve accuracy

If you want better numbers, in order of impact:

1. **Fetch actual model configs** (n_layers, d_model, n_kv_heads) instead of guessing from param count. Eliminates the biggest source of error in KV cache calculation.
2. **Use INT8/FP8 TFLOPS** for cards that have them when the model is quantized. H100 has 1979 INT8 TFLOPS vs 989 FP16; B200 is 4500 vs 2250.
3. **Account for grouped-query attention** (Llama 3, Qwen 3, most modern models). They have much smaller KV cache than the formula predicts.
4. **Pull benchmark data** from sources like the artificial-analysis leaderboard for known model+GPU pairs and use measured numbers instead of computed.

PRs welcome.

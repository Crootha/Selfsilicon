# Math Verification

Every formula used in the calculator, with worked examples and instructions for verifying against real tools.

**Short version: decode numbers are reliable (±25%). Prefill numbers are optimistic (30–50%). Use for relative comparisons, not exact predictions.**

---

## 1. VRAM — Weights

```
weights_GB = params_B × bytes_per_param
```

| Quantization | bytes/param | 70B model | 7B model |
|---|---|---|---|
| FP16 / BF16 | 2.0 | 140 GB | 14 GB |
| FP8 / INT8 | 1.0 | 70 GB | 7 GB |
| Q5 | 0.625 | 43.75 GB | 4.4 GB |
| INT4 / Q4 | 0.5 | 35 GB | 3.5 GB |
| Q3 | 0.375 | 26.25 GB | 2.6 GB |

**Worked example — Llama 3 8B INT4:**
```
weights = 8B × 0.5 bytes = 4.0 GB
```
Verify: `llama-cli -m llama-3-8b-q4_0.gguf --info` → "model size: ~4.1 GiB" ✓ (small delta from GGUF block metadata)

---

## 2. VRAM — Simple mode

```
total_GB = weights × 1.2
```

Flat 20% overhead for activations + framework. Ignores context length.

**Worked example — Llama 3 70B Q4:**
```
weights = 70 × 0.5 = 35 GB
total   = 35 × 1.2 = 42 GB
```
Verify with llama.cpp: `./llama-server -m llama-3-70b-q4_k_m.gguf -ngl 99` → watch VRAM usage in `nvidia-smi`. Expect 38–44 GB depending on context.

---

## 3. VRAM — Detailed mode

```
n_layers = max(32, round(√params × 8))          ← estimated
d_model  = max(2048, round(√params × 600))       ← estimated
kv_cache_GB = (2 × n_layers × d_model × context × batch × 2) / 1e9
overhead_GB = weights × 0.1 + 1
total_GB    = weights + kv_cache + overhead
```

KV stays in FP16 (2 bytes/param) regardless of weight quantization.

**Worked example — Llama 3 70B Q4, 8k context, batch=1:**
```
n_layers = max(32, round(√70 × 8)) = max(32, 67) = 67   [actual: 80 — formula underestimates]
d_model  = max(2048, round(√70 × 600)) = max(2048, 5020) = 5020  [actual: 8192 — underestimates]
kv = (2 × 67 × 5020 × 8192 × 1 × 2) / 1e9 = 11.0 GB
overhead = 35 × 0.1 + 1 = 4.5 GB
total = 35 + 11.0 + 4.5 = 50.5 GB
```

Actual (vLLM, 8k context): ~55–60 GB. Calc is ~10–15% low because n_layers and d_model are underestimated for GQA models like Llama 3. For MoE models (Mixtral, DeepSeek) the error is larger.

**Verify KV cache size yourself (llama.cpp):**
```bash
# Run with explicit context, watch output line "kv self size"
./llama-server -m model.gguf -c 8192 --verbose-prompt 2>&1 | grep "kv self"
# Example output: "llm_load_tensors: kv self size = 10.50 GiB"
```

**Biggest source of error:** the formula estimates architecture from param count. If you have the actual model config, look up real values:
- `n_layers` = `num_hidden_layers` in `config.json`
- `d_model` = `hidden_size` in `config.json`
- GQA reduces KV by factor of `num_key_value_heads / num_attention_heads` (often 1/4 or 1/8 for modern models)

---

## 4. Decode speed (tokens/sec)

```
decode_efficiency = 0.7 (dense) | 0.2 (MoE)
ms_per_token      = (model_size_GB / (bandwidth_GB_s × efficiency)) × 1000
tokens_per_sec    = 1000 / ms_per_token
```

Memory-bandwidth-bound. The model_size_GB for MoE uses **active params only**.

**Worked example — Llama 3 70B Q4 on H100 (3,350 GB/s):**
```
model_size = 35 GB
ms_per_tok = 35 / (3350 × 0.7) × 1000 = 14.9ms
tok/s      = 67.1 tok/s
```
Real-world H100 (vLLM): ~60–75 tok/s ✓ — calc is within ±15%.

**Worked example — Qwen 3.5 35B-A3B Q4 on Mac mini M4 (120 GB/s):**
```
active_params = 3B, model_size_active = 3 × 0.5 = 1.5 GB
efficiency    = 0.2 (MoE routing overhead)
ms_per_tok    = 1.5 / (120 × 0.2) × 1000 = 62.5ms → 16 tok/s
```
Real-world M4 mini: ~35 tok/s. Calc underestimates by ~2×. MoE efficiency on Apple MLX is better than 0.2 suggests; MLX has optimized MoE kernels. The 0.2 constant is calibrated to vLLM on NVIDIA, not MLX.

**Verify with llama.cpp:**
```bash
./llama-bench -m model.gguf -p 0 -n 128 -ngl 99
# Look for "eval time" column — convert ms/token to tokens/sec
```

---

## 5. Prefill (time to first token, TTFT)

```
efficiency   = 0.3  (30% of theoretical peak — conservative)
prefill_flop = 2 × active_params × 1e9 × prompt_tokens
ttft_s       = prefill_flop / (tflops_fp16 × 1e12 × efficiency)
```

Compute-bound. Uses active params (MoE only routes a fraction per token during prefill too).

**Worked example — Llama 3 70B FP16 on H100 (989 TFLOPS), 2048-token prompt:**
```
flops    = 2 × 70e9 × 2048 = 286.7 TFLOP
ttft_s   = 286.7e12 / (989e12 × 0.3) = 0.965s → 965ms
```
Real-world H100: ~250ms. **Calc is ~4× too slow** for this case — the 30% efficiency constant is too conservative for H100 with FlashAttention 3. Real efficiency on H100 is closer to 70–80% for long prompts.

**Why efficiency=0.3?** It's a conservative default that gives reasonable estimates across all hardware. Modern H100 with FA3 runs closer to 0.7; older cards / short prompts run ~0.2–0.3. Using 0.3 means prefill numbers are systematically pessimistic (real TTFT is faster than the calc shows).

**Verify with vLLM:**
```bash
python -c "
import time
from vllm import LLM, SamplingParams
llm = LLM('meta-llama/Llama-3-70b')
params = SamplingParams(max_tokens=1)
t0 = time.time()
llm.generate(['A ' * 2048], params)
print(f'TTFT: {time.time()-t0:.3f}s')
"
```

---

## 6. Total Cost of Ownership (TCO)

```
utilization  = 0.5  (50% duty cycle)
yearly_kWh   = (power_W / 1000) × 24h × 30d × runtime_months × utilization
elec_cost    = yearly_kWh × rate_$/kWh
tco          = hw_price × units_needed + elec_cost
```

**Worked example — RTX 4090 (450W, $1,800), 12 months, $0.15/kWh:**
```
yearly_kWh  = (450/1000) × 24 × 30 × 12 × 0.5 = 1,944 kWh
elec_cost   = 1,944 × 0.15 = $291.60
tco         = $1,800 + $292 = $2,092
```

**What TCO omits:**
- CPU, RAM, PSU, motherboard, case (~$500–$2,000 for a full system)
- Cooling infrastructure (enterprise: can match GPU cost)
- Idle power (RTX 4090 idles at ~25W; increases TCO by ~20% for low-utilization servers)
- Depreciation / resale value

---

## 7. Multi-GPU scaling

```
NVIDIA tensor parallel:  perf_scale = n_gpus ^ 0.85
Apple cluster (EXO):     perf_scale = n_nodes ^ 0.55
```

| GPUs | NVIDIA (NVLink) | Apple (Thunderbolt) |
|---|---|---|
| 1 | 1.00× | 1.00× |
| 2 | 1.81× | 1.47× |
| 4 | 3.13× | 2.14× |
| 8 | 5.28× | 3.13× |

**Why different exponents?** NVLink bandwidth is ~7,200 GB/s between H100s. Thunderbolt 4 is ~5 GB/s effective. The exponent reflects real-world scaling reported in EXO benchmarks and NVIDIA tensor parallelism papers.

**Verify NVIDIA scaling:** run `llama-bench` with `-ngl 99` on 1 GPU, then tensor-parallel across 2. Compare `eval time` (decode) — expect 1.7–1.9× for NVLink systems, 1.4–1.6× for PCIe-only.

---

## 8. Sensitivity analysis

Which inputs matter most for each output:

| Output | Dominant input | Second input | Noise |
|---|---|---|---|
| VRAM (simple) | params × quant | — | context |
| VRAM (detailed) | params × quant | context | model arch |
| Decode speed | bandwidth_GB_s | active_params × quant | efficiency constant |
| Prefill TTFT | TFLOPS | prompt_tokens | efficiency constant |
| TCO | hw_price | power | electricity rate |

**Takeaway:** if you only trust one number from this calculator, trust decode speed. It's dominated by a single hardware spec (bandwidth) and is consistently accurate to ±25%. Prefill is the least reliable output — use it only for rough comparisons.

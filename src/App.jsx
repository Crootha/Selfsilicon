import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, X, Cpu, Zap, DollarSign, HardDrive, AlertTriangle, Loader2, TrendingUp, Calculator, ExternalLink, Info, Check } from 'lucide-react';

// ============ DATA: GPU & APPLE ============
// Prices are approximate (USD, 2025), edit as needed
// bandwidth_gbs = memory bandwidth in GB/s (critical for decode speed)
const HARDWARE = [
  // NVIDIA Gaming — 30xx series
  { id: 'rtx3060', vendor: 'NVIDIA', name: 'RTX 3060 12GB', vram: 12, price: 200, tflops_fp16: 14, bandwidth_gbs: 360, power: 170, category: 'gaming' },
  { id: 'rtx3060ti', vendor: 'NVIDIA', name: 'RTX 3060 Ti 8GB', vram: 8, price: 250, tflops_fp16: 32, bandwidth_gbs: 448, power: 200, category: 'gaming' },
  { id: 'rtx3070', vendor: 'NVIDIA', name: 'RTX 3070 8GB', vram: 8, price: 300, tflops_fp16: 41, bandwidth_gbs: 448, power: 220, category: 'gaming' },
  { id: 'rtx3070ti', vendor: 'NVIDIA', name: 'RTX 3070 Ti 8GB', vram: 8, price: 350, tflops_fp16: 43, bandwidth_gbs: 608, power: 290, category: 'gaming' },
  { id: 'rtx3080', vendor: 'NVIDIA', name: 'RTX 3080 10GB', vram: 10, price: 400, tflops_fp16: 60, bandwidth_gbs: 760, power: 320, category: 'gaming' },
  { id: 'rtx3080ti', vendor: 'NVIDIA', name: 'RTX 3080 Ti 12GB', vram: 12, price: 500, tflops_fp16: 68, bandwidth_gbs: 912, power: 350, category: 'gaming' },
  { id: 'rtx3090', vendor: 'NVIDIA', name: 'RTX 3090 24GB', vram: 24, price: 700, tflops_fp16: 71, bandwidth_gbs: 936, power: 350, category: 'gaming' },
  { id: 'rtx3090ti', vendor: 'NVIDIA', name: 'RTX 3090 Ti 24GB', vram: 24, price: 800, tflops_fp16: 80, bandwidth_gbs: 936, power: 450, category: 'gaming' },
  // NVIDIA Gaming — 40xx series
  { id: 'rtx4060', vendor: 'NVIDIA', name: 'RTX 4060 8GB', vram: 8, price: 300, tflops_fp16: 30, bandwidth_gbs: 272, power: 115, category: 'gaming' },
  { id: 'rtx4060ti8', vendor: 'NVIDIA', name: 'RTX 4060 Ti 8GB', vram: 8, price: 400, tflops_fp16: 44, bandwidth_gbs: 288, power: 160, category: 'gaming' },
  { id: 'rtx4060ti16', vendor: 'NVIDIA', name: 'RTX 4060 Ti 16GB', vram: 16, price: 500, tflops_fp16: 44, bandwidth_gbs: 288, power: 165, category: 'gaming' },
  { id: 'rtx4070', vendor: 'NVIDIA', name: 'RTX 4070 12GB', vram: 12, price: 550, tflops_fp16: 58, bandwidth_gbs: 504, power: 200, category: 'gaming' },
  { id: 'rtx4070s', vendor: 'NVIDIA', name: 'RTX 4070 Super 12GB', vram: 12, price: 590, tflops_fp16: 71, bandwidth_gbs: 504, power: 220, category: 'gaming' },
  { id: 'rtx4070ti', vendor: 'NVIDIA', name: 'RTX 4070 Ti 12GB', vram: 12, price: 700, tflops_fp16: 80, bandwidth_gbs: 504, power: 285, category: 'gaming' },
  { id: 'rtx4070tis', vendor: 'NVIDIA', name: 'RTX 4070 Ti Super 16GB', vram: 16, price: 790, tflops_fp16: 88, bandwidth_gbs: 672, power: 285, category: 'gaming' },
  { id: 'rtx4080s', vendor: 'NVIDIA', name: 'RTX 4080 Super 16GB', vram: 16, price: 1000, tflops_fp16: 104, bandwidth_gbs: 736, power: 320, category: 'gaming' },
  { id: 'rtx4090', vendor: 'NVIDIA', name: 'RTX 4090 24GB', vram: 24, price: 1800, tflops_fp16: 165, bandwidth_gbs: 1008, power: 450, category: 'gaming' },
  // NVIDIA Gaming — 50xx series
  { id: 'rtx5070', vendor: 'NVIDIA', name: 'RTX 5070 12GB', vram: 12, price: 600, tflops_fp16: 61, bandwidth_gbs: 672, power: 250, category: 'gaming' },
  { id: 'rtx5070ti', vendor: 'NVIDIA', name: 'RTX 5070 Ti 16GB', vram: 16, price: 750, tflops_fp16: 88, bandwidth_gbs: 896, power: 300, category: 'gaming' },
  { id: 'rtx5080', vendor: 'NVIDIA', name: 'RTX 5080 16GB', vram: 16, price: 1200, tflops_fp16: 113, bandwidth_gbs: 960, power: 360, category: 'gaming' },
  { id: 'rtx5090', vendor: 'NVIDIA', name: 'RTX 5090 32GB', vram: 32, price: 2400, tflops_fp16: 209, bandwidth_gbs: 1792, power: 575, category: 'gaming' },
  // AMD RDNA3 Gaming — RX 7000 series (tflops_fp16 = peak FP32 w/ dual-issue; ROCm/llama.cpp perf is bandwidth-bound for decode)
  { id: 'rx7600', vendor: 'AMD', name: 'RX 7600 8GB', vram: 8, price: 250, tflops_fp16: 22, bandwidth_gbs: 288, power: 165, category: 'gaming' },
  { id: 'rx7700xt', vendor: 'AMD', name: 'RX 7700 XT 12GB', vram: 12, price: 380, tflops_fp16: 34, bandwidth_gbs: 432, power: 245, category: 'gaming' },
  { id: 'rx7800xt', vendor: 'AMD', name: 'RX 7800 XT 16GB', vram: 16, price: 480, tflops_fp16: 37, bandwidth_gbs: 624, power: 263, category: 'gaming' },
  { id: 'rx7900gre', vendor: 'AMD', name: 'RX 7900 GRE 16GB', vram: 16, price: 450, tflops_fp16: 46, bandwidth_gbs: 576, power: 260, category: 'gaming' },
  { id: 'rx7900xt', vendor: 'AMD', name: 'RX 7900 XT 20GB', vram: 20, price: 700, tflops_fp16: 52, bandwidth_gbs: 800, power: 315, category: 'gaming' },
  { id: 'rx7900xtx', vendor: 'AMD', name: 'RX 7900 XTX 24GB', vram: 24, price: 900, tflops_fp16: 61, bandwidth_gbs: 960, power: 355, category: 'gaming' },
  // NVIDIA Workstation — Ampere
  { id: 'rtxa2000_12', vendor: 'NVIDIA', name: 'RTX A2000 12GB', vram: 12, price: 500, tflops_fp16: 16, bandwidth_gbs: 192, power: 70, category: 'workstation' },
  { id: 'rtxa4000', vendor: 'NVIDIA', name: 'RTX A4000 16GB', vram: 16, price: 900, tflops_fp16: 38, bandwidth_gbs: 448, power: 140, category: 'workstation' },
  { id: 'rtxa5000', vendor: 'NVIDIA', name: 'RTX A5000 24GB', vram: 24, price: 1600, tflops_fp16: 56, bandwidth_gbs: 768, power: 230, category: 'workstation' },
  { id: 'a6000', vendor: 'NVIDIA', name: 'RTX A6000 48GB', vram: 48, price: 4800, tflops_fp16: 75, bandwidth_gbs: 768, power: 300, category: 'workstation' },
  // NVIDIA Workstation — Ada Lovelace
  { id: 'rtx4000ada', vendor: 'NVIDIA', name: 'RTX 4000 Ada 20GB', vram: 20, price: 1200, tflops_fp16: 38, bandwidth_gbs: 360, power: 130, category: 'workstation' },
  { id: 'rtx4000sffada', vendor: 'NVIDIA', name: 'RTX 4000 SFF Ada 20GB', vram: 20, price: 1200, tflops_fp16: 38, bandwidth_gbs: 360, power: 70, category: 'workstation' },
  { id: 'rtx4500ada', vendor: 'NVIDIA', name: 'RTX 4500 Ada 24GB', vram: 24, price: 2000, tflops_fp16: 50, bandwidth_gbs: 432, power: 210, category: 'workstation' },
  { id: 'rtx5000ada', vendor: 'NVIDIA', name: 'RTX 5000 Ada 32GB', vram: 32, price: 4500, tflops_fp16: 130, bandwidth_gbs: 576, power: 250, category: 'workstation' },
  { id: 'a6000ada', vendor: 'NVIDIA', name: 'RTX 6000 Ada 48GB', vram: 48, price: 6800, tflops_fp16: 182, bandwidth_gbs: 960, power: 300, category: 'workstation' },
  // AMD Radeon PRO W — RDNA3 workstation
  { id: 'prow7600', vendor: 'AMD', name: 'Radeon PRO W7600 16GB', vram: 16, price: 600, tflops_fp16: 24, bandwidth_gbs: 288, power: 130, category: 'workstation' },
  { id: 'prow7800', vendor: 'AMD', name: 'Radeon PRO W7800 32GB', vram: 32, price: 2400, tflops_fp16: 45, bandwidth_gbs: 576, power: 260, category: 'workstation' },
  { id: 'prow7900', vendor: 'AMD', name: 'Radeon PRO W7900 48GB', vram: 48, price: 3800, tflops_fp16: 61, bandwidth_gbs: 864, power: 295, category: 'workstation' },
  // NVIDIA Datacenter
  { id: 'a100_40', vendor: 'NVIDIA', name: 'A100 40GB', vram: 40, price: 8500, tflops_fp16: 312, bandwidth_gbs: 1555, power: 400, category: 'datacenter' },
  { id: 'a100_80', vendor: 'NVIDIA', name: 'A100 80GB', vram: 80, price: 15000, tflops_fp16: 312, bandwidth_gbs: 2039, power: 400, category: 'datacenter' },
  { id: 'h100', vendor: 'NVIDIA', name: 'H100 80GB', vram: 80, price: 27000, tflops_fp16: 989, bandwidth_gbs: 3350, power: 700, category: 'datacenter' },
  { id: 'h200', vendor: 'NVIDIA', name: 'H200 141GB', vram: 141, price: 32000, tflops_fp16: 989, bandwidth_gbs: 4800, power: 700, category: 'datacenter' },
  { id: 'b200', vendor: 'NVIDIA', name: 'B200 192GB', vram: 192, price: 45000, tflops_fp16: 2250, bandwidth_gbs: 8000, power: 1000, category: 'datacenter' },
  // AMD Instinct — datacenter
  { id: 'mi210', vendor: 'AMD', name: 'Instinct MI210 64GB', vram: 64, price: 6000, tflops_fp16: 181, bandwidth_gbs: 1638, power: 300, category: 'datacenter' },
  { id: 'mi250x', vendor: 'AMD', name: 'Instinct MI250X 128GB', vram: 128, price: 12000, tflops_fp16: 383, bandwidth_gbs: 3277, power: 560, category: 'datacenter' },
  { id: 'mi300x', vendor: 'AMD', name: 'Instinct MI300X 192GB', vram: 192, price: 15000, tflops_fp16: 1307, bandwidth_gbs: 5300, power: 750, category: 'datacenter' },
  // NVIDIA DGX Systems (turnkey boxes, prices include node)
  { id: 'dgx_spark', vendor: 'NVIDIA', name: 'DGX Spark', vram: 128, price: 4000, tflops_fp16: 250, bandwidth_gbs: 273, power: 240, category: 'dgx', units: 1, note: '1× GB10, unified memory' },
  { id: 'dgx_station', vendor: 'NVIDIA', name: 'DGX Station', vram: 784, price: 75000, tflops_fp16: 4500, bandwidth_gbs: 8000, power: 1500, category: 'dgx', units: 1, note: '1× GB300 Ultra, desktop' },
  { id: 'dgx_a100', vendor: 'NVIDIA', name: 'DGX A100 (8× A100 80GB)', vram: 640, price: 199000, tflops_fp16: 2496, bandwidth_gbs: 16312, power: 6500, category: 'dgx', units: 8, note: '8× A100 80GB, NVLink' },
  { id: 'dgx_h100', vendor: 'NVIDIA', name: 'DGX H100 (8× H100)', vram: 640, price: 480000, tflops_fp16: 7912, bandwidth_gbs: 26800, power: 10200, category: 'dgx', units: 8, note: '8× H100 80GB, NVLink' },
  { id: 'dgx_h200', vendor: 'NVIDIA', name: 'DGX H200 (8× H200)', vram: 1128, price: 520000, tflops_fp16: 7912, bandwidth_gbs: 38400, power: 10200, category: 'dgx', units: 8, note: '8× H200 141GB, NVLink' },
  { id: 'dgx_b200', vendor: 'NVIDIA', name: 'DGX B200 (8× B200)', vram: 1536, price: 515000, tflops_fp16: 18000, bandwidth_gbs: 64000, power: 14300, category: 'dgx', units: 8, note: '8× B200 192GB, NVLink 5' },
  { id: 'gb200_nvl72', vendor: 'NVIDIA', name: 'GB200 NVL72 (rack)', vram: 13824, price: 3000000, tflops_fp16: 180000, bandwidth_gbs: 576000, power: 120000, category: 'dgx', units: 72, note: '72× B200 + 36× Grace CPU, full rack' },
  // Apple
  // Mac mini M4 / M4 Pro (popular as local AI server — small, efficient, unified memory)
  { id: 'mini_m4_16', vendor: 'Apple', name: 'Mac mini M4 16GB', vram: 12, price: 599, tflops_fp16: 8, bandwidth_gbs: 120, power: 65, category: 'apple', totalRam: 16 },
  { id: 'mini_m4_24', vendor: 'Apple', name: 'Mac mini M4 24GB', vram: 18, price: 799, tflops_fp16: 8, bandwidth_gbs: 120, power: 65, category: 'apple', totalRam: 24 },
  { id: 'mini_m4_32', vendor: 'Apple', name: 'Mac mini M4 32GB', vram: 24, price: 999, tflops_fp16: 8, bandwidth_gbs: 120, power: 65, category: 'apple', totalRam: 32 },
  { id: 'mini_m4pro_24', vendor: 'Apple', name: 'Mac mini M4 Pro 24GB', vram: 18, price: 1399, tflops_fp16: 17, bandwidth_gbs: 273, power: 65, category: 'apple', totalRam: 24 },
  { id: 'mini_m4pro_48', vendor: 'Apple', name: 'Mac mini M4 Pro 48GB', vram: 36, price: 1799, tflops_fp16: 17, bandwidth_gbs: 273, power: 65, category: 'apple', totalRam: 48 },
  { id: 'mini_m4pro_64', vendor: 'Apple', name: 'Mac mini M4 Pro 64GB', vram: 48, price: 2199, tflops_fp16: 17, bandwidth_gbs: 273, power: 65, category: 'apple', totalRam: 64 },
  // MacBook Pro
  { id: 'mbp_m4max_128', vendor: 'Apple', name: 'MacBook Pro M4 Max 128GB', vram: 98, price: 4700, tflops_fp16: 34, bandwidth_gbs: 546, power: 140, category: 'apple', totalRam: 128 },
  { id: 'mbp_m3max_128', vendor: 'Apple', name: 'MacBook Pro M3 Max 128GB', vram: 98, price: 4500, tflops_fp16: 28, bandwidth_gbs: 400, power: 140, category: 'apple', totalRam: 128 },
  // Mac Studio
  { id: 'studio_m4max_64', vendor: 'Apple', name: 'Mac Studio M4 Max 64GB', vram: 48, price: 1999, tflops_fp16: 34, bandwidth_gbs: 546, power: 160, category: 'apple', totalRam: 64 },
  { id: 'studio_m4max_128', vendor: 'Apple', name: 'Mac Studio M4 Max 128GB', vram: 98, price: 3499, tflops_fp16: 34, bandwidth_gbs: 546, power: 160, category: 'apple', totalRam: 128 },
  { id: 'studio_m2ultra_192', vendor: 'Apple', name: 'Mac Studio M2 Ultra 192GB', vram: 147, price: 6200, tflops_fp16: 27, bandwidth_gbs: 800, power: 295, category: 'apple', totalRam: 192 },
  { id: 'studio_m3ultra_256', vendor: 'Apple', name: 'Mac Studio M3 Ultra 256GB', vram: 192, price: 5599, tflops_fp16: 43, bandwidth_gbs: 819, power: 270, category: 'apple', totalRam: 256 },
  { id: 'studio_m3ultra_512', vendor: 'Apple', name: 'Mac Studio M3 Ultra 512GB', vram: 384, price: 9499, tflops_fp16: 43, bandwidth_gbs: 819, power: 270, category: 'apple', totalRam: 512 },
];

// Known models as fallback (when HF API fails or doesn't know size)
// activeParams (optional): for MoE models, the params active per token.
// If omitted, model is treated as dense (active = total).
const KNOWN_MODELS = [
  // Qwen 3.6 — latest (June 2026, verified on HuggingFace)
  { id: 'qwen-3.6-35b-a3b', name: 'Qwen 3.6 35B-A3B (MoE)', params: 36, activeParams: 3 },
  { id: 'qwen-3.6-27b',     name: 'Qwen 3.6 27B',            params: 28 },
  // Qwen 3.5
  { id: 'qwen-3.5-235b-a22b', name: 'Qwen 3.5 235B-A22B (MoE)', params: 235, activeParams: 22 },
  { id: 'qwen-3.5-72b',       name: 'Qwen 3.5 72B',              params: 72 },
  // Qwen 3
  { id: 'qwen-3-32b', name: 'Qwen 3 32B', params: 32 },
  { id: 'qwen-3-14b', name: 'Qwen 3 14B', params: 14 },
  // Llama 4 (verified on HuggingFace)
  { id: 'llama-4-scout',    name: 'Llama 4 Scout (MoE)',    params: 109, activeParams: 17 },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick (MoE)', params: 402, activeParams: 17 },
  // Llama 3
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', params: 70 },
  { id: 'llama-3.1-8b',  name: 'Llama 3.1 8B',  params: 8  },
  // DeepSeek (verified on HuggingFace)
  { id: 'deepseek-v4-pro',   name: 'DeepSeek V4 Pro (MoE)',   params: 862, activeParams: 37 },
  { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash (MoE)', params: 158, activeParams: 18 },
  { id: 'deepseek-v3',  name: 'DeepSeek V3 (MoE)',  params: 685, activeParams: 37 },
  { id: 'deepseek-r1',  name: 'DeepSeek R1 (MoE)',  params: 685, activeParams: 37 },
  // Others
  { id: 'openai-gpt-oss-120b', name: 'OpenAI GPT-OSS 120B', params: 120 },
  { id: 'gemma-3-27b',   name: 'Gemma 3 27B',    params: 27  },
  { id: 'phi-4',         name: 'Phi 4',           params: 14  },
  { id: 'phi-4-mini',    name: 'Phi 4 Mini',      params: 3.8 },
  { id: 'mistral-large', name: 'Mistral Large 2', params: 123 },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B (MoE)', params: 141, activeParams: 39 },
];

// Model families — maps family label to KNOWN_MODELS ids in display order
const MODEL_FAMILIES = {
  Qwen:     ['qwen-3.6-35b-a3b', 'qwen-3.6-27b', 'qwen-3.5-235b-a22b', 'qwen-3.5-72b', 'qwen-3-32b', 'qwen-3-14b'],
  Llama:    ['llama-4-scout', 'llama-4-maverick', 'llama-3.3-70b', 'llama-3.1-8b'],
  DeepSeek: ['deepseek-v4-pro', 'deepseek-v4-flash', 'deepseek-v3', 'deepseek-r1'],
  Gemma:    ['gemma-3-27b'],
  Phi:      ['phi-4', 'phi-4-mini'],
  Mistral:  ['mistral-large', 'mixtral-8x22b'],
  Other:    ['openai-gpt-oss-120b'],
};

// Quantization
const QUANT_OPTIONS = [
  { id: 'fp16', name: 'FP16 (16-bit)', bytesPerParam: 2 },
  { id: 'fp8', name: 'FP8 (8-bit float)', bytesPerParam: 1 },
  { id: 'int8', name: 'INT8 (8-bit)', bytesPerParam: 1 },
  { id: 'int4', name: 'INT4 / Q4 (4-bit)', bytesPerParam: 0.5 },
  { id: 'q5', name: 'Q5 (5-bit)', bytesPerParam: 0.625 },
  { id: 'q3', name: 'Q3 (3-bit)', bytesPerParam: 0.375 },
];

// ============ HELPERS ============

// Try to extract params from model name (e.g., "Llama-3-70B" -> 70)
function paramsFromName(name) {
  const m = name.match(/(\d+(?:\.\d+)?)\s*[bB]\b/);
  if (m) return parseFloat(m[1]);
  const moe = name.match(/(\d+)x(\d+(?:\.\d+)?)\s*[bB]/i);
  if (moe) return parseFloat(moe[1]) * parseFloat(moe[2]);
  return null;
}

// VRAM calculation
// activeParams: for MoE models, the active params per token (used to correct nLayers estimate)
function calcVRAM(params, quantId, context, mode, batchSize = 1, activeParams = null) {
  const quant = QUANT_OPTIONS.find(q => q.id === quantId) || QUANT_OPTIONS[0];
  // model weights (in GB)
  const weights = (params * 1e9 * quant.bytesPerParam) / 1e9;

  if (mode === 'simple') {
    // simple: weights + 20% overhead
    return {
      weights,
      kvCache: 0,
      overhead: weights * 0.2,
      total: weights * 1.2,
    };
  }

  // detailed: weights + KV cache + activation overhead
  //
  // KV cache formula: 2 (K+V) × nLayers × kvDim × context × batch × 2 bytes (FP16)
  //
  // kvDim = num_kv_heads × head_dim. Modern models use GQA with far fewer KV heads than
  // query heads (e.g. Llama/Qwen 70B: 8 KV heads × 128 head_dim = 1024). Using full dModel
  // (~8192 for 70B) would be 8× too large. 1024 is a reliable constant for 7B–235B models.
  //
  // nLayers: for MoE models total params greatly exceed the attention architecture. A MoE
  // with 235B total / 22B active behaves architecturally like a ~88B dense model for layer
  // count. Cap at sqrt(min(params, activeParams×4)) × 8 to avoid absurd layer estimates.
  const isMoE = activeParams != null && activeParams < params;
  const layerParams = isMoE ? Math.min(params, activeParams * 4) : params;
  const nLayers = Math.max(32, Math.round(Math.pow(layerParams, 0.5) * 8));
  const kvDim = 1024; // 8 KV heads × 128 head_dim — standard GQA in modern LLMs
  // KV cache assumed FP16 (conservative upper bound).
  // llama.cpp --cache-type-k q8_0 / q4_0 can halve this; vLLM also supports KV quantization.
  const kvBytes = 2;
  const kvCache = (2 * nLayers * kvDim * context * batchSize * kvBytes) / 1e9;
  const overhead = weights * 0.1 + 1; // activations + framework
  
  return {
    weights,
    kvCache,
    overhead,
    total: weights + kvCache + overhead,
  };
}

// Calculate prefill (prompt processing) and decode (generation) times.
// For MoE models, pass activeParams (params per token) separately from total params.
// - VRAM/weights uses total params (all experts loaded in memory).
// - Decode bandwidth read uses ACTIVE params only (only routed experts are read per token).
// - Prefill compute uses ACTIVE params (MoE FLOPs scale with active, not total).
function calcLatency(params, quantId, promptTokens, outputTokens, hw, hwCount = 1, activeParams = null) {
  const quant = QUANT_OPTIONS.find(q => q.id === quantId) || QUANT_OPTIONS[0];
  // For MoE: use active params for per-token math. For dense: active = total.
  const computeParams = activeParams ?? params;
  const decodeReadGB = computeParams * quant.bytesPerParam;
  const isMoE = activeParams != null && activeParams < params;

  // Multi-GPU scaling (tensor parallelism)
  const tpScale = hwCount === 1 ? 1 : Math.pow(hwCount, 0.85);
  const effectiveTflops = hw.tflops_fp16 * tpScale;
  const effectiveBandwidth = hw.bandwidth_gbs * tpScale;

  // ===== PREFILL =====
  // Compute-bound: process entire prompt at once.
  // FLOPs ≈ 2 × active_params × prompt_tokens (for MoE, only active experts compute).
  // 30% efficiency vs theoretical peak (FlashAttention, real-world utilization).
  const efficiency = 0.3;
  const prefillFlops = 2 * computeParams * 1e9 * promptTokens;
  const prefillSeconds = prefillFlops / (effectiveTflops * 1e12 * efficiency);
  const prefillMs = prefillSeconds * 1000;

  // ===== DECODE =====
  // Memory-bandwidth bound: read active weights per token.
  // Dense: efficiency ≈ 0.7. MoE: much lower (~0.2) due to expert routing overhead,
  // scattered memory access (experts aren't contiguous), and unoptimized MoE kernels
  // outside of vLLM/SGLang. Calibrated against Qwen 3.5 35B-A3B Q4 on Mac mini M4
  // measuring ~35 tok/s vs theoretical max ~127 tok/s.
  const decodeEfficiency = isMoE ? 0.2 : 0.7;
  const msPerToken = (decodeReadGB / (effectiveBandwidth * decodeEfficiency)) * 1000;
  const tokensPerSec = 1000 / msPerToken;
  const decodeTotalMs = msPerToken * outputTokens;

  const ttft = prefillMs;
  const totalMs = prefillMs + decodeTotalMs;

  return {
    prefillMs,
    decodeTotalMs,
    msPerToken,
    tokensPerSec,
    ttft,
    totalMs,
  };
}


const fmt = (n, d = 1) => {
  if (n === null || n === undefined || isNaN(n)) return '–';
  if (n >= 1000) return (n / 1000).toFixed(d) + 'k';
  return n.toFixed(d);
};
const fmtMoney = (n) => '$' + Math.round(n).toLocaleString('en-US');

// Format milliseconds nicely
const fmtMs = (ms) => {
  if (ms === null || ms === undefined || isNaN(ms)) return '–';
  if (ms < 1) return ms.toFixed(2) + 'ms';
  if (ms < 1000) return ms.toFixed(0) + 'ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + 's';
  return (ms / 60000).toFixed(1) + 'm';
};

// Build retailer search URLs for a given hardware item
function getRetailerLinks(hw) {
  const query = encodeURIComponent(hw.name);
  return {
    amazon: `https://www.amazon.com/s?k=${query}`,
    ebay: `https://www.ebay.com/sch/i.html?_nkw=${query}`,
    newegg: `https://www.newegg.com/p/pl?d=${query}`,
    // Apple products link directly to apple.com for accuracy
    apple: hw.vendor === 'Apple' ? `https://www.apple.com/shop/buy-mac/${hw.name.toLowerCase().includes('studio') ? 'mac-studio' : hw.name.toLowerCase().includes('mini') ? 'mac-mini' : 'macbook-pro'}` : null,
  };
}

// ============ AGENT MODE HELPERS ============

const isECC = (hw) => ['workstation', 'datacenter', 'dgx'].includes(hw.category);
const isSustained = (hw) => ['workstation', 'datacenter', 'dgx', 'apple'].includes(hw.category);

function parallelAgents(hw, modelVRAM) {
  return Math.max(0, Math.floor(hw.vram / Math.max(modelVRAM, 0.1)));
}

function agentScore(hw, modelVRAM) {
  const eccPts   = isECC(hw) ? 30 : 0;
  const sustPts  = isSustained(hw) ? 25 : 0;
  const agentPts = Math.min(parallelAgents(hw, modelVRAM), 4) * 5;
  const vpdPts   = Math.min((hw.vram / hw.price * 1000) / 0.3, 25);
  return Math.round(eccPts + sustPts + agentPts + vpdPts);
}

// ============ COMPONENTS ============

function TooltipIcon({ text }) {
  return (
    <span title={text} className="inline-flex items-center ml-1 text-neutral-600 hover:text-neutral-400 cursor-help align-middle">
      <Info size={11} />
    </span>
  );
}

function ModelCard({ model, onUpdate, onRemove, idx, favorites = [], onSaveFavorite, onDeleteFavorite }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [sortMode, setSortMode] = useState('trending'); // 'trending' | 'newest' | 'downloads'
  const [trendingModels, setTrendingModels] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [favName, setFavName] = useState(model.name);
  useEffect(() => { setFavName(model.name); }, [model.name]);

  const fetchTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch(
        'https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=25&pipeline_tag=text-generation'
      );
      const data = await res.json();
      const parsed = data
        .map(m => ({ ...m, detectedParams: paramsFromName(m.id) }))
        .filter(m => m.detectedParams && m.detectedParams > 0);
      setTrendingModels(parsed);
    } catch (e) {
      setTrendingModels([]);
    }
    setLoadingTrending(false);
  };

  const searchHF = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // No pipeline filter — many new/MoE/custom-code models don't set it,
      // and we'd rather show too many than hide new releases.
      // Sort options: trending (default), newest (lastModified), downloads (most popular).
      const sortParam = sortMode === 'newest'
        ? 'lastModified'
        : sortMode === 'downloads'
        ? 'downloads'
        : 'trendingScore';
      const res = await fetch(
        `https://huggingface.co/api/models?search=${encodeURIComponent(searchQuery)}&limit=25&sort=${sortParam}&direction=-1`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      setSearchResults([]);
    }
    setSearching(false);
  };

  const selectModel = async (hfModel) => {
    // try to get details including safetensors info for exact params
    let params = paramsFromName(hfModel.id);
    let activeParams = null;
    try {
      const res = await fetch(`https://huggingface.co/api/models/${hfModel.id}`);
      const detail = await res.json();
      if (detail.safetensors && detail.safetensors.total) {
        params = detail.safetensors.total / 1e9;
      } else if (!params) {
        params = paramsFromName(hfModel.id) || 7;
      }
    } catch (e) {
      if (!params) params = 7;
    }
    // Detect MoE active params from name patterns:
    //   "35B-A3B"  → total 35B, active 3B
    //   "235B-A22B" → total 235B, active 22B
    //   "8x7B"     → 8 experts of 7B (active ≈ 2 experts ≈ 13B for Mixtral-style top-2 routing)
    const aMatch = hfModel.id.match(/(\d+(?:\.\d+)?)\s*[bB][-_]?A(\d+(?:\.\d+)?)\s*[bB]/i);
    if (aMatch) {
      activeParams = parseFloat(aMatch[2]);
    } else {
      const moeMatch = hfModel.id.match(/(\d+)x(\d+(?:\.\d+)?)\s*[bB]/i);
      if (moeMatch) {
        // Top-2 routing typical for Mixtral-style: 2 experts active per token
        activeParams = 2 * parseFloat(moeMatch[2]);
      }
    }
    onUpdate({ ...model, name: hfModel.id, params, activeParams, source: 'huggingface' });
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const selectKnown = (km) => {
    onUpdate({ ...model, name: km.name, params: km.params, activeParams: km.activeParams ?? null, source: 'preset' });
    setShowSearch(false);
  };

  return (
    <div className="border border-neutral-700 bg-neutral-900/60 p-4 relative group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-amber-500 tracking-wider">MODEL_{String(idx + 1).padStart(2, '0')}</div>
        </div>
        <button
          onClick={onRemove}
          className="text-neutral-500 hover:text-red-400 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {model.name ? (
        <div className="mb-3">
          <div className="font-serif text-lg text-neutral-100 break-all">{model.name}</div>
          <div className="text-xs text-neutral-400 mt-1">
            {model.params}B parameters
            {model.activeParams && model.activeParams < model.params && (
              <span className="ml-2 text-orange-400">· MoE: {model.activeParams}B active/token</span>
            )}
            {model.source === 'huggingface' && <span className="ml-2 text-amber-500/80">· HF</span>}
            {model.source === 'preset' && <span className="ml-2 text-neutral-500">· preset</span>}
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="text-xs text-neutral-500 hover:text-amber-500 mt-2 underline"
          >
            change
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="w-full border border-dashed border-neutral-700 hover:border-amber-500 hover:text-amber-500 text-neutral-500 py-3 text-sm transition-colors"
        >
          + select model
        </button>
      )}

      {showSearch && (
        <div className="mt-3 border-t border-neutral-800 pt-3">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchHF()}
              placeholder="search HuggingFace..."
              className="flex-1 bg-neutral-950 border border-neutral-700 px-2 py-1 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={searchHF}
              disabled={searching}
              className="bg-amber-500 text-neutral-950 px-3 py-1 text-sm font-mono hover:bg-amber-400 disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </div>

          <div className="flex gap-1 mb-2 text-xs">
            <span className="text-neutral-500 font-mono uppercase self-center mr-1">sort:</span>
            {[
              { id: 'trending', label: 'trending' },
              { id: 'newest', label: 'newest' },
              { id: 'downloads', label: 'popular' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortMode(opt.id)}
                className={`px-2 py-0.5 font-mono ${sortMode === opt.id ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400 hover:text-amber-500'}`}
              >
                {opt.label}
              </button>
            ))}
            <a
              href={`https://huggingface.co/models?search=${encodeURIComponent(searchQuery)}&sort=modified`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-neutral-500 hover:text-amber-500 underline decoration-dotted self-center"
              title="Browse on HuggingFace directly"
            >
              browse on HF ↗
            </a>
          </div>

          {searchResults.length > 0 && (
            <div className="max-h-56 overflow-y-auto space-y-1 mb-3 border border-neutral-800">
              {searchResults.map((r) => {
                const modified = r.lastModified ? new Date(r.lastModified) : null;
                const daysAgo = modified ? Math.floor((Date.now() - modified.getTime()) / (1000 * 60 * 60 * 24)) : null;
                const dateLabel = daysAgo === null ? '' : daysAgo < 1 ? 'today' : daysAgo < 30 ? `${daysAgo}d ago` : daysAgo < 365 ? `${Math.floor(daysAgo / 30)}mo ago` : `${Math.floor(daysAgo / 365)}y ago`;
                const dl = r.downloads;
                const dlLabel = !dl ? '' : dl > 1e6 ? `${(dl / 1e6).toFixed(1)}M` : dl > 1e3 ? `${(dl / 1e3).toFixed(0)}k` : `${dl}`;
                return (
                  <button
                    key={r.id}
                    onClick={() => selectModel(r)}
                    className="block w-full text-left text-xs text-neutral-300 hover:bg-neutral-800 px-2 py-1.5"
                  >
                    <div className="truncate">{r.id}</div>
                    <div className="text-neutral-500 flex gap-3 mt-0.5">
                      {dateLabel && <span>📅 {dateLabel}</span>}
                      {dlLabel && <span>↓ {dlLabel}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !searching && (
            <div className="text-xs text-neutral-500 italic mb-3 px-1">
              No results. Try a different query or <a href={`https://huggingface.co/models?search=${encodeURIComponent(searchQuery)}`} target="_blank" rel="noopener noreferrer" className="text-amber-500 underline">browse HuggingFace directly</a>.
            </div>
          )}

          {/* Family-grouped presets */}
          <div className="flex items-center justify-between mb-1.5 mt-2">
            <span className="text-xs text-neutral-500">or from presets:</span>
            <button
              onClick={fetchTrending}
              disabled={loadingTrending}
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-amber-500 font-mono transition-colors disabled:opacity-50"
            >
              {loadingTrending ? <Loader2 size={11} className="animate-spin" /> : <TrendingUp size={11} />}
              {loadingTrending ? 'fetching…' : 'fetch live'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.keys(MODEL_FAMILIES).map(fam => (
              <button
                key={fam}
                onClick={() => setSelectedFamily(selectedFamily === fam ? null : fam)}
                className={`text-xs font-mono uppercase px-2.5 py-1 border transition-colors ${selectedFamily === fam ? 'bg-amber-500 text-neutral-950 border-amber-500' : 'border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-500'}`}
              >
                {fam}
              </button>
            ))}
            {trendingModels.length > 0 && (
              <button
                onClick={() => setSelectedFamily(selectedFamily === '__live__' ? null : '__live__')}
                className={`text-xs font-mono uppercase px-2.5 py-1 border transition-colors ${selectedFamily === '__live__' ? 'bg-amber-500 text-neutral-950 border-amber-500' : 'border-amber-500/50 text-amber-500/70 hover:border-amber-500 hover:text-amber-500'}`}
              >
                Live ↻
              </button>
            )}
            {favorites.length > 0 && (
              <button
                onClick={() => setSelectedFamily(selectedFamily === '__favs__' ? null : '__favs__')}
                className={`text-xs font-mono uppercase px-2.5 py-1 border transition-colors ${selectedFamily === '__favs__' ? 'bg-amber-500 text-neutral-950 border-amber-500' : 'border-amber-500/50 text-amber-500/70 hover:border-amber-500 hover:text-amber-500'}`}
              >
                ★ Favs ({favorites.length})
              </button>
            )}
          </div>
          {selectedFamily && selectedFamily !== '__live__' && selectedFamily !== '__favs__' && (
            <div className="border border-neutral-800 bg-neutral-950 mb-2">
              {MODEL_FAMILIES[selectedFamily].map(id => {
                const km = KNOWN_MODELS.find(m => m.id === id);
                if (!km) return null;
                const isMoE = km.activeParams && km.activeParams < km.params;
                return (
                  <button
                    key={km.id}
                    onClick={() => { selectKnown(km); setSelectedFamily(null); }}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 text-left"
                  >
                    <span className="text-neutral-200">{km.name}</span>
                    <span className="text-neutral-500 flex-shrink-0 ml-3">
                      {km.params}B{isMoE && <span className="text-orange-400/80 ml-1">· MoE {km.activeParams}B active</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {selectedFamily === '__live__' && trendingModels.length > 0 && (
            <div className="border border-neutral-800 bg-neutral-950 mb-2">
              {trendingModels.map(m => (
                <button
                  key={m.id}
                  onClick={() => { selectModel(m); setSelectedFamily(null); }}
                  title={`~${m.detectedParams}B params (name-parsed) · click for exact from HF`}
                  className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-neutral-800 transition-colors border-b border-neutral-800 last:border-b-0 text-left"
                >
                  <span className="text-neutral-200 truncate">{m.id.split('/')[1] ?? m.id}</span>
                  <span className="text-neutral-500 flex-shrink-0 ml-3">~{m.detectedParams}B</span>
                </button>
              ))}
            </div>
          )}
          {selectedFamily === '__favs__' && favorites.length > 0 && (
            <div className="border border-neutral-800 bg-neutral-950 mb-2">
              {favorites.map(f => (
                <div key={f.id} className="flex items-center border-b border-neutral-800 last:border-b-0 hover:bg-neutral-800 transition-colors">
                  <button
                    onClick={() => {
                      onUpdate({ ...model, name: f.modelName, params: f.params, activeParams: f.activeParams, source: f.source, quant: f.quant, context: f.context });
                      setSelectedFamily(null);
                      setFavName(f.name);
                    }}
                    className="flex-1 flex items-center justify-between px-3 py-2 text-xs text-left"
                  >
                    <span className="text-neutral-200">{f.name}</span>
                    <span className="text-neutral-500 flex-shrink-0 ml-3">
                      {f.quant.toUpperCase()} · {f.context >= 65536 ? '64k' : f.context >= 32768 ? '32k' : f.context >= 16384 ? '16k' : f.context >= 8192 ? '8k' : f.context >= 4096 ? '4k' : '2k'}
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteFavorite(f.id)}
                    className="px-3 py-2 text-neutral-700 hover:text-red-400 transition-colors text-sm flex-shrink-0"
                    title="Remove favorite"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {model.name && (
        <>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-neutral-500 block mb-1 font-mono uppercase">Quantization <TooltipIcon text="Bits used per weight. Lower = smaller & faster, slightly less accurate. INT4/Q4 is the sweet spot for most local use. FP16 = full quality, 2× the VRAM." /></label>
            <select
              value={model.quant}
              onChange={(e) => onUpdate({ ...model, quant: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 text-sm text-neutral-200"
            >
              {QUANT_OPTIONS.map((q) => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1 font-mono uppercase">Context <TooltipIcon text="Max tokens the model sees at once (prompt + history). Longer context = more VRAM for the KV cache. 8k is fine for most chats; 32k+ for long documents." /></label>
            <select
              value={model.context}
              onChange={(e) => onUpdate({ ...model, context: parseInt(e.target.value) })}
              className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 text-sm text-neutral-200"
            >
              <option value={2048}>2k</option>
              <option value={4096}>4k</option>
              <option value={8192}>8k</option>
              <option value={16384}>16k</option>
              <option value={32768}>32k</option>
              <option value={65536}>64k</option>
              <option value={131072}>128k</option>
            </select>
          </div>
        </div>

        {/* Favorites save bar */}
        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            value={favName}
            onChange={e => setFavName(e.target.value)}
            className="flex-1 min-w-0 bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-200 font-mono focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={() => {
              onSaveFavorite({ name: (favName || model.name).trim() || model.name, modelName: model.name, params: model.params, activeParams: model.activeParams ?? null, source: model.source, quant: model.quant, context: model.context });
              setFavName('');
            }}
            className="px-2 py-1 bg-amber-500 text-neutral-950 text-xs font-mono uppercase hover:bg-amber-400 transition-colors flex-shrink-0 whitespace-nowrap"
          >
            ★ save
          </button>
        </div>
        <div className="text-[10px] text-neutral-600 mt-1 mb-1">saves model + quant + context · max 8</div>
        </>
      )}
    </div>
  );
}

function VRAMBreakdownTooltip({ hw, totalVRAM, effectiveVRAM, needed, modelParams, modelQuant, modelActiveParams, modelContext }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  const quant = QUANT_OPTIONS.find(q => q.id === modelQuant) || QUANT_OPTIONS[0];
  const weights = modelParams ? (modelParams * 1e9 * quant.bytesPerParam) / 1e9 : 0;
  const overhead = weights * 0.1 + 1;
  const kvCache = Math.max(0, totalVRAM - weights - overhead);
  const ctxLabel = modelContext >= 131072 ? '128k' : modelContext >= 65536 ? '64k' : modelContext >= 32768 ? '32k' : modelContext >= 16384 ? '16k' : modelContext >= 8192 ? '8k' : modelContext >= 4096 ? '4k' : '2k';

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(true);
  };

  return (
    <>
      <span
        ref={ref}
        className="flex-shrink-0 cursor-help"
        onMouseEnter={show}
        onMouseLeave={() => setOpen(false)}
        onClick={e => { e.stopPropagation(); open ? setOpen(false) : show(); }}
      >
        <AlertTriangle size={12} className="text-red-400" />
      </span>
      {open && createPortal(
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-52 bg-neutral-900 border border-red-400/40 text-xs font-mono shadow-2xl pointer-events-none"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-1.5 bg-red-400/10 border-b border-red-400/20 text-red-400 text-[10px] uppercase tracking-wider">
            ▲ doesn't fit
          </div>
          {modelParams > 0 && (
            <div className="px-3 py-2 space-y-1 border-b border-neutral-800">
              <div className="flex justify-between">
                <span className="text-neutral-500">weights</span>
                <span className="text-neutral-300">{weights.toFixed(0)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">KV cache ({ctxLabel})</span>
                <span className="text-neutral-300">{kvCache.toFixed(0)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">overhead</span>
                <span className="text-neutral-300">{overhead.toFixed(0)} GB</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-800">
                <span className="text-neutral-400 font-medium">total needed</span>
                <span className="text-red-400 font-medium">{totalVRAM.toFixed(0)} GB</span>
              </div>
            </div>
          )}
          <div className="px-3 py-2 space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">this card</span>
              <span className="text-neutral-300">{hw.vram} GB</span>
            </div>
            {needed > 1 && (
              <div className="flex justify-between">
                <span className="text-neutral-500">{needed}× stacked</span>
                <span className="text-neutral-300">~{effectiveVRAM.toFixed(0)} GB</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function HardwareRow({ hw, totalVRAM, modelsCount, runtimeMonths, electricityRate, promptTokens, outputTokens, modelParams, modelQuant, modelActiveParams, modelContext, appleCluster, hwMode, compareMode, isSelected, canSelect, onToggleSelect }) {
  // How many units of this HW are needed to fit the model(s)?
  // NVIDIA standalone cards: stack via tensor parallelism
  // Apple machines: stack via EXO / llama.cpp RPC (only if appleCluster=true; performance penalty is severe)
  // DGX systems: already a box, can't be further stacked here
  const canMultiGPU = (hw.vendor === 'NVIDIA' && hw.category !== 'dgx') || (hw.vendor === 'Apple' && appleCluster);
  const needed = canMultiGPU && totalVRAM > 0 ? Math.ceil(totalVRAM / hw.vram) : 1;
  const fits = canMultiGPU ? true : hw.vram >= totalVRAM;
  // VRAM loss per extra unit:
  //   NVIDIA tensor parallelism: ~10% per extra GPU (NVLink/PCIe overhead)
  //   Apple cluster (Thunderbolt/Ethernet): ~15% per extra machine (replication, framework state)
  const vramOverhead = hw.vendor === 'Apple' ? 0.15 : 0.1;
  const effectiveVRAM = hw.vram * needed * (needed === 1 ? 1 : 1 - vramOverhead * (needed - 1) / needed);
  const reallyFits = effectiveVRAM >= totalVRAM;
  const headroom = totalVRAM > 0 ? ((effectiveVRAM - totalVRAM) / effectiveVRAM) * 100 : 0;
  const totalPrice = hw.price * needed;
  const totalPower = hw.power * needed;
  const costPerGB = totalPrice / (hw.vram * needed);
  // For DGX systems, internal multi-GPU is already accounted for - treat units as the scaling factor
  const internalGpus = hw.units || 1;
  // Latency calculations
  // For Apple clusters, the latency calc is heavily impacted by Thunderbolt bandwidth (40 Gbps ≈ 5 GB/s) between machines.
  // The effective bandwidth becomes min(per_unit_bandwidth, interconnect_bandwidth) for cross-machine traffic.
  // Simplification: apply a steeper scaling penalty (0.5 exponent) for Apple clusters vs 0.85 for NVIDIA.
  const latency = modelParams
    ? (() => {
        const base = calcLatency(modelParams, modelQuant, promptTokens, outputTokens, hw, Math.max(needed, internalGpus), modelActiveParams);
        if (hw.vendor === 'Apple' && needed > 1) {
          // Apple cluster scaling: Thunderbolt 4/5 (40-80 Gbps) is much slower than NVLink (7,200 Gbps).
          // Per-layer activations must cross the network. Pipeline parallelism + ring scheduling
          // (EXO, llama.cpp RPC) help, but bandwidth caps real-world scaling.
          // Recent EXO benchmarks: 2× nodes ≈ 1.4× speed, 4× ≈ 2.1× speed.
          const naiveScale = Math.pow(needed, 0.85);
          const realScale = Math.pow(needed, 0.55);
          const ratio = realScale / naiveScale;
          return {
            ...base,
            tokensPerSec: base.tokensPerSec * ratio,
            msPerToken: base.msPerToken / ratio,
            prefillMs: base.prefillMs / ratio,
          };
        }
        return base;
      })()
    : null;
  const yearlyKwh = (totalPower / 1000) * 24 * 30 * runtimeMonths * 0.5;
  const electricityCost = yearlyKwh * electricityRate;
  const totalCost = totalPrice + electricityCost;
  const links = getRetailerLinks(hw);
  const isAppleCluster = hw.vendor === 'Apple' && needed > 1;

  return (
    <div className={reallyFits ? '' : 'opacity-40'}>

      {/* Mobile / tablet card (< lg) */}
      <div className="lg:hidden border-b border-neutral-800 px-4 py-3">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {!reallyFits && <VRAMBreakdownTooltip hw={hw} totalVRAM={totalVRAM} effectiveVRAM={effectiveVRAM} needed={needed} modelParams={modelParams} modelQuant={modelQuant} modelActiveParams={modelActiveParams} modelContext={modelContext} />}
            {needed > 1 && (
              <span className="inline-flex items-center justify-center bg-amber-500 text-neutral-950 font-mono text-xs px-1.5 py-0.5 font-bold flex-shrink-0">
                {needed}×
              </span>
            )}
            <span className="font-serif text-neutral-100 truncate">{hw.name}</span>
            <button
              onClick={e => { e.stopPropagation(); if (isSelected || canSelect) onToggleSelect(); }}
              title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 10 items'}
              className={`flex-shrink-0 w-5 h-5 flex items-center justify-center border transition-colors ${isSelected ? 'bg-amber-500 border-amber-500 text-neutral-950' : canSelect ? 'border-neutral-700 text-neutral-600 hover:border-amber-500 hover:text-amber-500' : 'border-neutral-800 text-neutral-800 cursor-not-allowed'}`}
            >
              {isSelected ? <Check size={10} /> : <Plus size={10} />}
            </button>
          </div>
          <span className="font-mono text-amber-500 ml-3 flex-shrink-0">{fmtMoney(totalPrice)}</span>
        </div>
        <div className="text-xs text-neutral-500 font-mono uppercase tracking-wider mb-2">
          {hw.vendor} · {hw.category}
          {needed > 1 && !isAppleCluster && <span className="text-amber-500/70 ml-1">· multi-GPU</span>}
          {isAppleCluster && <span className="text-orange-400/80 ml-1" title="EXO/llama.cpp RPC — performance penalty">· cluster ⚠</span>}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2.5">
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">VRAM</span>
            <span className="font-mono">
              {hw.vram * needed}GB
              {reallyFits && <span className="text-emerald-500 ml-1">+{headroom.toFixed(0)}%</span>}
            </span>
          </div>
          {hwMode === 'agent' ? <>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Agents</span>
              <span className={`font-mono ${parallelAgents(hw, totalVRAM) >= 2 ? 'text-emerald-400' : parallelAgents(hw, totalVRAM) === 1 ? 'text-orange-400' : 'text-red-400'}`}>
                {parallelAgents(hw, totalVRAM) >= 1 ? `${parallelAgents(hw, totalVRAM)}×` : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">ECC</span>
              <span className={`font-mono ${isECC(hw) ? 'text-emerald-400' : 'text-neutral-600'}`}>{isECC(hw) ? 'ECC ✓' : 'no ECC'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Throttle</span>
              <span className={`font-mono ${isSustained(hw) ? 'text-emerald-400' : 'text-orange-400'}`}>{isSustained(hw) ? '✓ sustained' : '⚠ throttles'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Score</span>
              <span className={`font-mono font-bold ${agentScore(hw, totalVRAM) >= 70 ? 'text-emerald-400' : agentScore(hw, totalVRAM) >= 40 ? 'text-amber-500' : 'text-neutral-600'}`}>{agentScore(hw, totalVRAM)}</span>
            </div>
          </> : <>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">$/GB</span>
              <span className="font-mono">${costPerGB.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Bandwidth</span>
              <span className="font-mono">{fmt(hw.bandwidth_gbs, 0)} GB/s</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Power</span>
              <span className="font-mono">{totalPower}W</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Prefill</span>
              <span className="font-mono text-amber-500">{latency ? fmtMs(latency.prefillMs) : '–'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500">Decode</span>
              <span className="font-mono text-emerald-400">{latency ? `~${fmt(latency.tokensPerSec, 0)} tok/s` : '–'}</span>
            </div>
          </>}
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">Energy</span>
            <span className="font-mono text-neutral-400">+{fmtMoney(electricityCost)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-neutral-500">TCO</span>
            <span className="font-mono text-amber-500">{fmtMoney(totalCost)}</span>
          </div>
        </div>
        <div className="flex gap-3 text-xs font-mono">
          {links.apple ? (
            <a href={links.apple} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted">apple.com</a>
          ) : (
            <>
              <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted">amzn</a>
              <a href={links.newegg} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted">newegg</a>
              <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted">ebay</a>
            </>
          )}
        </div>
      </div>

      {/* Desktop table row (≥ lg) */}
      <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2.5 border-b border-neutral-800 text-sm items-center">
        <div className="col-span-2 flex items-center gap-2">
          {!reallyFits && <VRAMBreakdownTooltip hw={hw} totalVRAM={totalVRAM} effectiveVRAM={effectiveVRAM} needed={needed} modelParams={modelParams} modelQuant={modelQuant} modelActiveParams={modelActiveParams} modelContext={modelContext} />}
          <div className="min-w-0 flex-1">
            <div className="font-serif text-neutral-100 flex items-center gap-2">
              {needed > 1 && (
                <span className="inline-flex items-center justify-center bg-amber-500 text-neutral-950 font-mono text-xs px-1.5 py-0.5 font-bold">
                  {needed}×
                </span>
              )}
              <span className="truncate">{hw.name}</span>
            </div>
            <div className="text-xs text-neutral-500 font-mono uppercase tracking-wider">
              {hw.vendor} · {hw.category}
              {needed > 1 && !isAppleCluster && <span className="text-amber-500/70 ml-1">· multi-GPU</span>}
              {isAppleCluster && <span className="text-orange-400/80 ml-1" title="EXO/llama.cpp RPC over Thunderbolt — significant performance penalty">· cluster ⚠</span>}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); if (isSelected || canSelect) onToggleSelect(); }}
            title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 10 items'}
            className={`flex-shrink-0 w-5 h-5 flex items-center justify-center border transition-colors ${isSelected ? 'bg-amber-500 border-amber-500 text-neutral-950' : canSelect ? 'border-neutral-700 text-neutral-600 hover:border-amber-500 hover:text-amber-500' : 'border-neutral-800 text-neutral-800 cursor-not-allowed'}`}
          >
            {isSelected ? <Check size={10} /> : <Plus size={10} />}
          </button>
        </div>
        <div className="col-span-1 text-right font-mono">
          <div className="text-neutral-100">
            {hw.vram * needed}<span className="text-neutral-500 text-xs ml-0.5">GB</span>
          </div>
          {needed > 1 && <div className="text-xs text-neutral-500">{needed}×{hw.vram}GB</div>}
          {reallyFits && <div className="text-xs text-emerald-500">+{headroom.toFixed(0)}%</div>}
        </div>
        <div className="col-span-2 text-right">
          <div className="font-mono text-neutral-100">{fmtMoney(totalPrice)}</div>
          {needed > 1 && <div className="text-xs text-neutral-500">{fmtMoney(hw.price)} ea.</div>}
          <div className="flex gap-1.5 justify-end mt-1 text-xs font-mono">
            {links.apple ? (
              <a href={links.apple} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted" title="Check price on apple.com">apple</a>
            ) : (
              <>
                <a href={links.amazon} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted" title="Search on Amazon">amzn</a>
                <a href={links.newegg} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted" title="Search on Newegg">newegg</a>
                <a href={links.ebay} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-amber-500 underline decoration-dotted" title="Search on eBay">ebay</a>
              </>
            )}
          </div>
        </div>
        {hwMode === 'agent' ? <>
          <div className="col-span-1 text-right">
            <div className={`font-mono ${parallelAgents(hw, totalVRAM) >= 2 ? 'text-emerald-400' : parallelAgents(hw, totalVRAM) === 1 ? 'text-orange-400' : 'text-red-400'}`}>
              {parallelAgents(hw, totalVRAM) >= 1 ? `${parallelAgents(hw, totalVRAM)}×` : '—'}
            </div>
            <div className="text-xs text-neutral-600">agents</div>
          </div>
          <div className="col-span-1 text-right">
            <div className={`font-mono text-xs ${isECC(hw) ? 'text-emerald-400' : 'text-neutral-600'}`}>{isECC(hw) ? 'ECC ✓' : 'no ECC'}</div>
          </div>
          <div className="col-span-1 text-right">
            <div className={`font-mono text-xs ${isSustained(hw) ? 'text-emerald-400' : 'text-orange-400'}`}>{isSustained(hw) ? '✓ sustain' : '⚠ throttle'}</div>
          </div>
          <div className="col-span-2 text-right">
            {(() => {
              const sc = agentScore(hw, totalVRAM);
              const cls = sc >= 70 ? 'text-emerald-400' : sc >= 40 ? 'text-amber-500' : 'text-neutral-600';
              return <>
                <div className={`font-mono font-bold ${cls}`}>{sc}</div>
                <div className="w-full h-1 bg-neutral-800 mt-1 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${sc >= 70 ? 'bg-emerald-400' : sc >= 40 ? 'bg-amber-500' : 'bg-neutral-600'}`} style={{ width: `${sc}%` }} />
                </div>
              </>;
            })()}
          </div>
        </> : <>
          <div className="col-span-1 text-right font-mono text-neutral-300 text-xs">${costPerGB.toFixed(0)}/GB</div>
          <div className="col-span-1 text-right font-mono text-neutral-300 text-xs">
            <div className="text-neutral-100">{fmt(hw.bandwidth_gbs, 0)}</div>
            <div className="text-neutral-600">GB/s</div>
          </div>
          <div className="col-span-1 text-right">
            <div className="font-mono text-amber-500">{latency ? fmtMs(latency.prefillMs) : '–'}</div>
            <div className="text-xs text-neutral-600">prefill (TTFT)</div>
          </div>
          <div className="col-span-1 text-right">
            <div className="font-mono text-emerald-400">{latency ? `~${fmt(latency.tokensPerSec, 0)}` : '–'}</div>
            <div className="text-xs text-neutral-600">tok/s decode</div>
          </div>
          <div className="col-span-1 text-right font-mono text-neutral-300">
            {totalPower}W
            {needed > 1 && <div className="text-xs text-neutral-500">{hw.power}W ea.</div>}
          </div>
        </>}
        <div className="col-span-2 text-right">
          <div className="font-mono text-amber-500">{fmtMoney(totalCost)}</div>
          <div className="text-xs text-neutral-500">+{fmtMoney(electricityCost)} energy</div>
        </div>
      </div>

    </div>
  );
}

function CompareTable({ items, totalVRAM, runtimeMonths, electricityRate, promptTokens, outputTokens, primaryModel, appleCluster, onClose, onRemove }) {
  const stats = items.map(hw => {
    const canStack = (hw.vendor === 'NVIDIA' && hw.category !== 'dgx') || (hw.vendor === 'Apple' && appleCluster);
    const needed = canStack && totalVRAM > 0 ? Math.ceil(totalVRAM / hw.vram) : 1;
    const vramOverhead = hw.vendor === 'Apple' ? 0.15 : 0.1;
    const effectiveVRAM = hw.vram * needed * (needed === 1 ? 1 : 1 - vramOverhead * (needed - 1) / needed);
    const reallyFits = effectiveVRAM >= totalVRAM;
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
        <table className="w-full text-xs font-mono border-collapse" style={{ minWidth: '720px' }}>
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

function deduplicateName(name, existing) {
  if (!existing.includes(name)) return name;
  let n = 2;
  while (existing.includes(`${name} (${n})`)) n++;
  return `${name} (${n})`;
}

const LS_KEY = 'selfsilicon-v1';
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

export default function App() {
  const saved = loadSaved();
  const [models, setModels] = useState(
    saved.models?.length ? saved.models : [{ id: 1, name: '', params: 0, quant: 'fp16', context: 8192, source: null, activeParams: null }]
  );
  const [calcMode, setCalcMode] = useState(saved.calcMode ?? 'detailed');
  const [concurrent, setConcurrent] = useState(saved.concurrent ?? true);
  const [vendorFilter, setVendorFilter] = useState(saved.vendorFilter ?? 'all');
  const [categoryFilter, setCategoryFilter] = useState(saved.categoryFilter ?? 'all');
  const [runtimeMonths, setRuntimeMonths] = useState(saved.runtimeMonths ?? 12);
  const [electricityRate, setElectricityRate] = useState(saved.electricityRate ?? 0.15);
  const [sortBy, setSortBy] = useState(saved.sortBy ?? 'price');
  const [promptTokens, setPromptTokens] = useState(saved.promptTokens ?? 1024);
  const [outputTokens, setOutputTokens] = useState(saved.outputTokens ?? 256);
  const [appleCluster, setAppleCluster] = useState(saved.appleCluster ?? false);
  const [maxPrice, setMaxPrice] = useState(saved.maxPrice ?? 10000);
  const [maxPriceEnabled, setMaxPriceEnabled] = useState(saved.maxPriceEnabled ?? true);
  const [hwSearch, setHwSearch] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState(new Set());
  const [hwMode, setHwMode] = useState(saved.hwMode ?? 'inference');
  const [favorites, setFavorites] = useState(saved.favorites ?? []);

  // Persist state to localStorage on every meaningful change (not transient UI like search/compare)
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        models, calcMode, concurrent, vendorFilter, categoryFilter,
        runtimeMonths, electricityRate, sortBy, promptTokens, outputTokens,
        appleCluster, maxPrice, maxPriceEnabled, hwMode, favorites,
      }));
    } catch {}
  }, [models, calcMode, concurrent, vendorFilter, categoryFilter,
      runtimeMonths, electricityRate, sortBy, promptTokens, outputTokens,
      appleCluster, maxPrice, maxPriceEnabled, hwMode, favorites]);

  const saveFavorite = (entry) => {
    setFavorites(prev => {
      const name = deduplicateName(entry.name, prev.map(f => f.name));
      return [...prev, { ...entry, id: Date.now(), name }].slice(-8);
    });
  };

  const deleteFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const addModel = () => {
    setModels([...models, { id: Date.now(), name: '', params: 0, quant: 'fp16', context: 8192, source: null, activeParams: null }]);
  };

  const updateModel = (id, updated) => {
    setModels(models.map(m => m.id === id ? updated : m));
  };

  const removeModel = (id) => {
    setModels(models.filter(m => m.id !== id));
  };

  // VRAM calculations
  const vramBreakdown = useMemo(() => {
    return models.map(m => {
      if (!m.params) return null;
      return calcVRAM(m.params, m.quant, m.context, calcMode, 1, m.activeParams);
    });
  }, [models, calcMode]);

  const totalVRAM = useMemo(() => {
    const valid = vramBreakdown.filter(Boolean);
    if (valid.length === 0) return 0;
    if (concurrent) {
      return valid.reduce((sum, b) => sum + b.total, 0);
    }
    return Math.max(...valid.map(b => b.total));
  }, [vramBreakdown, concurrent]);

  // Primary model = largest model (representative for latency calc)
  const primaryModel = useMemo(() => {
    const valid = models.filter(m => m.params);
    if (valid.length === 0) return null;
    return valid.reduce((biggest, m) => (m.params > biggest.params ? m : biggest), valid[0]);
  }, [models]);

  // Filter & sort HW
  const filteredHW = useMemo(() => {
    let hw = [...HARDWARE];
    if (vendorFilter !== 'all') hw = hw.filter(h => h.vendor === vendorFilter);
    if (categoryFilter !== 'all') hw = hw.filter(h => h.category === categoryFilter);
    if (hwSearch.trim()) hw = hw.filter(h => h.name.toLowerCase().includes(hwSearch.trim().toLowerCase()));
    if (maxPriceEnabled && maxPrice > 0) {
      hw = hw.filter(h => {
        const stackable = (h.vendor === 'NVIDIA' && h.category !== 'dgx') || (h.vendor === 'Apple' && appleCluster);
        const n = stackable && totalVRAM > 0 ? Math.ceil(totalVRAM / h.vram) : 1;
        return (h.price * n) <= maxPrice;
      });
    }

    // Helper: how many of this HW are needed
    const canStack = (h) => (h.vendor === 'NVIDIA' && h.category !== 'dgx') || (h.vendor === 'Apple' && appleCluster);
    const neededCount = (h) => {
      if (!canStack(h)) return 1;
      return totalVRAM > 0 ? Math.ceil(totalVRAM / h.vram) : 1;
    };
    const fitsScaled = (h) => {
      if (canStack(h)) return true;
      return h.vram >= totalVRAM;
    };

    hw.sort((a, b) => {
      const aFits = fitsScaled(a) ? 0 : 1;
      const bFits = fitsScaled(b) ? 0 : 1;
      if (aFits !== bFits) return aFits - bFits;
      // Agent mode: sort by composite agent score descending
      if (hwMode === 'agent') return agentScore(b, totalVRAM) - agentScore(a, totalVRAM);
      const aN = neededCount(a);
      const bN = neededCount(b);
      const aPrice = a.price * aN;
      const bPrice = b.price * bN;
      const aPower = a.power * aN;
      const bPower = b.power * bN;
      if (sortBy === 'price') return aPrice - bPrice;
      if (sortBy === 'vram') return (b.vram * bN) - (a.vram * aN);
      if (sortBy === 'costPerGB') return (aPrice / (a.vram * aN)) - (bPrice / (b.vram * bN));
      if (sortBy === 'perf') return b.tflops_fp16 - a.tflops_fp16;
      if (sortBy === 'bandwidth') return b.bandwidth_gbs - a.bandwidth_gbs;
      if (sortBy === 'prefill' && primaryModel) {
        const aL = calcLatency(primaryModel.params, primaryModel.quant, promptTokens, outputTokens, a, Math.max(aN, a.units || 1), primaryModel.activeParams);
        const bL = calcLatency(primaryModel.params, primaryModel.quant, promptTokens, outputTokens, b, Math.max(bN, b.units || 1), primaryModel.activeParams);
        return aL.prefillMs - bL.prefillMs;
      }
      if (sortBy === 'decode' && primaryModel) {
        const aL = calcLatency(primaryModel.params, primaryModel.quant, promptTokens, outputTokens, a, Math.max(aN, a.units || 1), primaryModel.activeParams);
        const bL = calcLatency(primaryModel.params, primaryModel.quant, promptTokens, outputTokens, b, Math.max(bN, b.units || 1), primaryModel.activeParams);
        return bL.tokensPerSec - aL.tokensPerSec;
      }
      if (sortBy === 'power') return aPower - bPower;
      if (sortBy === 'total') {
        const aTotal = aPrice + (aPower / 1000) * 24 * 30 * runtimeMonths * 0.5 * electricityRate;
        const bTotal = bPrice + (bPower / 1000) * 24 * 30 * runtimeMonths * 0.5 * electricityRate;
        return aTotal - bTotal;
      }
      return 0;
    });
    return hw;
  }, [vendorFilter, categoryFilter, sortBy, totalVRAM, runtimeMonths, electricityRate, promptTokens, outputTokens, primaryModel, appleCluster, hwSearch, maxPrice, maxPriceEnabled, hwMode]);

  // Items selected for side-by-side compare panel
  const compareItems = useMemo(() => {
    if (!compareMode || compareSelected.size < 2) return [];
    return HARDWARE.filter(h => compareSelected.has(h.id));
  }, [compareMode, compareSelected]);

  // Find best (cheapest) fit considering multi-GPU configs
  const bestPick = useMemo(() => {
    const canStack = (h) => (h.vendor === 'NVIDIA' && h.category !== 'dgx') || (h.vendor === 'Apple' && appleCluster);
    const candidates = filteredHW
      .filter(h => canStack(h) || h.vram >= totalVRAM)
      .map(h => {
        const n = canStack(h) && totalVRAM > 0 ? Math.ceil(totalVRAM / h.vram) : 1;
        return { hw: h, count: n, totalPrice: h.price * n };
      });
    candidates.sort((a, b) => a.totalPrice - b.totalPrice);
    return candidates[0];
  }, [filteredHW, totalVRAM, appleCluster]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700&family=Fraunces:opsz,wght@9..144,300;9..144,700&display=swap');
        body { background: #0a0a0a; }
        .font-serif { font-family: 'Fraunces', serif; font-feature-settings: 'ss01', 'ss02'; }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(245, 158, 11, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        select { background-color: #0a0a0a; color: #e5e5e5; }
        select option { background: #0a0a0a; }
        .educ-ai {
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: .02em;
          margin: 0 2px;
          vertical-align: -1px;
          display: inline-block;
          text-shadow: 0 0 6px rgba(255,255,255,.4), 0 0 12px rgba(255,255,255,.18);
          animation: educ-glow 3s ease-in-out infinite;
          transform-origin: center bottom;
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), letter-spacing .2s ease, text-shadow .2s ease;
        }
        @keyframes educ-glow {
          0%,100% { text-shadow: 0 0 6px rgba(255,255,255,.35), 0 0 12px rgba(255,255,255,.15); }
          50%     { text-shadow: 0 0 14px rgba(255,255,255,.85), 0 0 28px rgba(255,255,255,.28); }
        }
        .educ-ai-btn:hover .educ-ai {
          transform: scale(1.22);
          letter-spacing: .06em;
          text-shadow: 0 0 16px rgba(255,255,255,.95), 0 0 32px rgba(255,255,255,.55), 0 0 50px rgba(255,220,100,.3);
          animation: educ-glow-hot .55s ease-in-out infinite;
        }
        @keyframes educ-glow-hot {
          0%,100% { text-shadow: 0 0 12px rgba(255,255,255,.9), 0 0 24px rgba(255,255,255,.5); }
          50%     { text-shadow: 0 0 20px rgba(255,255,255,1), 0 0 40px rgba(255,255,255,.7), 0 0 60px rgba(255,220,80,.45); }
        }
      `}</style>

      {/* HEADER */}
      <div className="grid-bg border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between mb-2">
            <div className="text-xs font-mono text-amber-500 tracking-[0.3em] uppercase">
              ▮▮▮ GPU / VRAM / COST_CALCULATOR
            </div>
            <div className="flex items-center gap-4">
              <a href="/docs/EducAItion.html" target="_blank" rel="noopener noreferrer" className="educ-ai-btn inline-flex items-baseline bg-amber-500 text-neutral-950 px-4 py-1.5 transition-opacity hover:opacity-90" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '14px', letterSpacing: '.01em', lineHeight: 1 }}>Educ<span className="educ-ai">AI</span>tion<span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', fontWeight: 400, marginLeft: '5px', opacity: 0.7 }}>↗</span></a>
              <div className="text-xs font-mono text-neutral-600">v1.0 · {new Date().toISOString().slice(0,10)}</div>
            </div>
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-neutral-100 leading-none tracking-tight">
            how much <span className="italic text-amber-500">silicon</span> do you need
          </h1>
          <p className="text-neutral-400 mt-3 max-w-2xl text-sm">
            Pick AI models, calculate VRAM, compare NVIDIA vs Apple. Model data pulled from HuggingFace, GPU prices are approximate (USD).
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: MODELS */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-2xl">
              <span className="text-amber-500">01.</span> Models
            </h2>
            <button
              onClick={addModel}
              className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider border border-amber-500 text-amber-500 px-3 py-1.5 hover:bg-amber-500 hover:text-neutral-950 transition-colors"
            >
              <Plus size={14} /> add
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((m, i) => (
              <ModelCard
                key={m.id}
                model={m}
                idx={i}
                onUpdate={(u) => updateModel(m.id, u)}
                onRemove={() => removeModel(m.id)}
                favorites={favorites}
                onSaveFavorite={saveFavorite}
                onDeleteFavorite={deleteFavorite}
              />
            ))}
          </div>

          {/* MODE */}
          <div className="mt-6 border border-neutral-800 p-4 bg-neutral-900/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calculator size={16} className="text-amber-500" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-300">VRAM calculation mode <TooltipIcon text="Simple: weights × 1.2 flat overhead — fast 'will it fit?' check. Detailed: adds KV cache (grows with context length) + framework overhead. Use Detailed when context window matters." /></span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalcMode('simple')}
                  className={`px-3 py-1 text-xs font-mono uppercase ${calcMode === 'simple' ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
                >
                  simple
                </button>
                <button
                  onClick={() => setCalcMode('detailed')}
                  className={`px-3 py-1 text-xs font-mono uppercase ${calcMode === 'detailed' ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
                >
                  detailed
                </button>
              </div>
            </div>
            <div className="text-xs text-neutral-500 mt-2 leading-relaxed">
              {calcMode === 'simple' 
                ? 'Params × bytes/param + 20% overhead. Ignores KV cache and context.'
                : 'Weights + KV cache (depends on context) + framework overhead. KV cache assumed FP16 — the default in most tools. llama.cpp/vLLM support KV quantization (Q8/Q4) which can halve this; calc uses FP16 as a conservative upper bound.'}
            </div>
          </div>

          {/* CONCURRENT */}
          {models.filter(m => m.params).length > 1 && (
            <div className="mt-3 border border-neutral-800 p-4 bg-neutral-900/40">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-neutral-300">Models run concurrently <TooltipIcon text="ON: all models loaded in VRAM at once (VRAMs summed). OFF: models hot-swapped one at a time — only the largest needs to fit. Most home setups run one model at a time." /></div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {concurrent ? 'VRAM is summed (Hermes + Honcho + ... loaded at once)' : 'Loaded sequentially, VRAM = the largest one'}
                  </div>
                </div>
                <button
                  onClick={() => setConcurrent(!concurrent)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${concurrent ? 'bg-amber-500' : 'bg-neutral-700'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-neutral-950 transition-transform ${concurrent ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
              </label>
            </div>
          )}
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="lg:col-span-1">
          <div className="border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-6 sticky top-6">
            <div className="text-xs font-mono uppercase tracking-[0.3em] text-amber-500 mb-4">▮▮ SUMMARY</div>
            
            <div className="mb-6">
              <div className="text-xs text-neutral-500 font-mono uppercase mb-1">Total VRAM</div>
              <div className="font-serif text-6xl text-neutral-100 leading-none">
                {fmt(totalVRAM, 1)}
                <span className="text-2xl text-neutral-500 ml-2">GB</span>
              </div>
            </div>

            {/* Breakdown */}
            {vramBreakdown.filter(Boolean).length > 0 && (
              <div className="space-y-2 mb-6 text-xs">
                {models.map((m, i) => {
                  const b = vramBreakdown[i];
                  if (!b) return null;
                  return (
                    <div key={m.id} className="border-l-2 border-amber-500/30 pl-3 py-1">
                      <div className="text-neutral-300 truncate">{m.name}</div>
                      <div className="text-neutral-500 font-mono">
                        weights: {b.weights.toFixed(1)}GB
                        {calcMode === 'detailed' && ` · KV: ${b.kvCache.toFixed(1)}GB`}
                        {' '}· OH: {b.overhead.toFixed(1)}GB
                      </div>
                      <div className="text-amber-500 font-mono">= {b.total.toFixed(1)}GB</div>
                    </div>
                  );
                })}
              </div>
            )}

            {bestPick && (
              <div className="border-t border-neutral-800 pt-4 mb-4">
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1">Cheapest fit</div>
                <div className="font-serif text-xl text-amber-500 flex items-center gap-2 flex-wrap">
                  {bestPick.count > 1 && (
                    <span className="inline-flex items-center justify-center bg-amber-500 text-neutral-950 font-mono text-sm px-2 py-0.5 font-bold">
                      {bestPick.count}×
                    </span>
                  )}
                  <span>{bestPick.hw.name}</span>
                </div>
                <div className="text-sm text-neutral-300 font-mono">{fmtMoney(bestPick.totalPrice)}</div>
                {bestPick.count > 1 && (
                  <div className="text-xs text-neutral-500 font-mono">{bestPick.count} × {fmtMoney(bestPick.hw.price)}</div>
                )}
                {bestPick.count > 1 && (
                  <div className="text-xs text-amber-500/50 mt-2 leading-relaxed">
                    ↑ Cards stacked via tensor parallelism — the table shows combined VRAM and total price.
                  </div>
                )}
              </div>
            )}

            {/* Settings */}
            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500/80 mb-2">▮ Latency inputs</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-mono uppercase text-neutral-500">Prompt tokens <TooltipIcon text="Length of input sent to the model. ~¾ of a word per token. Drives time-to-first-token (prefill) — compute-bound." /></label>
                  <input
                    type="number"
                    value={promptTokens}
                    onChange={(e) => setPromptTokens(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-neutral-500">Output tokens <TooltipIcon text="Tokens the model generates. Drives decode time — memory-bandwidth-bound. 256 ≈ a short paragraph." /></label>
                  <input
                    type="number"
                    value={outputTokens}
                    onChange={(e) => setOutputTokens(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 mt-1 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1 -mt-1">
                {[
                  { label: 'chat', p: 512, o: 256 },
                  { label: 'RAG', p: 4096, o: 512 },
                  { label: 'codebase', p: 32000, o: 1024 },
                  { label: 'long-ctx', p: 100000, o: 2048 },
                ].map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => { setPromptTokens(preset.p); setOutputTokens(preset.o); }}
                    className="text-xs border border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-500 px-1.5 py-0.5"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-amber-500/80 mb-2 pt-2 border-t border-neutral-800/50">▮ Cost inputs</div>
              <div>
                <label className="text-xs font-mono uppercase text-neutral-500">Runtime (months)</label>
                <input
                  type="number"
                  value={runtimeMonths}
                  onChange={(e) => setRuntimeMonths(parseInt(e.target.value) || 0)}
                  className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-neutral-500">Electricity ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-neutral-950 border border-neutral-700 px-2 py-1 mt-1 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <h2 className="font-serif text-2xl">
            <span className="text-amber-500">02.</span> Hardware comparison
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-neutral-500 font-mono">
              {filteredHW.filter(h => ((h.vendor === 'NVIDIA' && h.category !== 'dgx') || (h.vendor === 'Apple' && appleCluster)) || h.vram >= totalVRAM).length} / {filteredHW.length} fit
              {totalVRAM > 0 && <span className="ml-2 text-amber-500/70">· need {fmt(totalVRAM, 1)}GB total</span>}
            </div>
            <button
              onClick={() => {
                if (compareMode) {
                  setCompareMode(false);
                } else if (compareSelected.size >= 2) {
                  setCompareMode(true);
                }
              }}
              className={`text-xs font-mono uppercase px-3 py-1 border transition-colors ${
                compareMode ? 'bg-amber-500 text-neutral-950 border-amber-500'
                : compareSelected.size >= 2 ? 'border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-neutral-950'
                : compareSelected.size === 1 ? 'border-neutral-600 text-neutral-400'
                : 'border-neutral-700 text-neutral-500'
              }`}
            >
              {compareMode ? '× exit compare'
                : compareSelected.size === 0 ? 'compare'
                : compareSelected.size === 1 ? '+1 more to compare'
                : `compare (${compareSelected.size}) →`}
            </button>
          </div>
        </div>

        {/* Hardware search */}
        <div className="flex items-center gap-2 mb-3 border border-neutral-800 px-3 py-1.5 bg-neutral-900/40">
          <Search size={12} className="text-neutral-500 flex-shrink-0" />
          <input
            type="text"
            value={hwSearch}
            onChange={(e) => setHwSearch(e.target.value)}
            placeholder="filter by name…"
            className="flex-1 bg-transparent text-xs text-neutral-200 focus:outline-none placeholder-neutral-600"
          />
          {hwSearch && (
            <button onClick={() => setHwSearch('')} className="text-neutral-500 hover:text-neutral-300 flex-shrink-0">
              <X size={12} />
            </button>
          )}
        </div>
        {/* Mobile sort */}
        <div className="flex items-center gap-2 lg:hidden mb-3">
          <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider flex-shrink-0">sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs text-neutral-200"
          >
            {[
              { id: 'price', label: 'Price (cheapest first)' },
              { id: 'vram', label: 'VRAM (most first)' },
              { id: 'costPerGB', label: 'Cost / GB' },
              { id: 'bandwidth', label: 'Memory bandwidth' },
              { id: 'prefill', label: 'Prefill speed (TTFT)' },
              { id: 'decode', label: 'Decode speed (tok/s)' },
              { id: 'power', label: 'Power (lowest first)' },
              { id: 'total', label: 'Total cost (TCO)' },
            ].map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Filters — row 1: vendor + category */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-neutral-500 font-mono uppercase mr-1 flex-shrink-0">vendor:</span>
            {['all', 'NVIDIA', 'AMD', 'Apple'].map(v => (
              <button
                key={v}
                onClick={() => setVendorFilter(v)}
                className={`px-3 py-1 text-xs font-mono uppercase ${vendorFilter === v ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-neutral-500 font-mono uppercase mr-1 flex-shrink-0">category:</span>
            {['all', 'gaming', 'workstation', 'datacenter', 'dgx', 'apple'].map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 text-xs font-mono uppercase ${categoryFilter === c ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Filters — row 2: budget cap slider */}
        <div className="flex items-center gap-3 mb-2 px-3 py-2 border border-neutral-800 bg-neutral-900/30">
          <button
            onClick={() => setMaxPriceEnabled(e => !e)}
            className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${maxPriceEnabled ? 'bg-amber-500' : 'bg-neutral-700'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${maxPriceEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
          </button>
          <span className="text-xs font-mono text-neutral-500 uppercase flex-shrink-0">Budget cap</span>
          {maxPriceEnabled ? (
            <>
              <span className="text-xs text-neutral-700 flex-shrink-0 hidden sm:inline">$500</span>
              <input
                type="range"
                min={500}
                max={100000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="flex-1 min-w-0 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs text-neutral-700 flex-shrink-0 hidden sm:inline">$100k</span>
              <span className="text-xs font-mono text-amber-400 flex-shrink-0 w-16 text-right">{fmtMoney(maxPrice)}</span>
            </>
          ) : (
            <span className="text-xs text-neutral-600 italic">off — showing all prices</span>
          )}
        </div>

        {/* Filters — row 3: Apple cluster (advanced, contextual) */}
        <div className={`mb-4 px-3 py-2.5 border text-xs transition-colors ${appleCluster ? 'border-orange-500/30 bg-orange-950/20' : 'border-neutral-800 bg-neutral-900/20'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setAppleCluster(!appleCluster)}
                className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${appleCluster ? 'bg-orange-500' : 'bg-neutral-700'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${appleCluster ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
              </button>
              <div className="min-w-0">
                <span className={`font-mono uppercase tracking-wider ${appleCluster ? 'text-orange-400' : 'text-neutral-500'}`}>
                  Apple cluster {appleCluster && '⚠'}
                </span>
                <span className="text-neutral-600 ml-2">
                  {appleCluster
                    ? 'active — table now shows stacked Apple configs'
                    : 'run one model split across multiple Macs via EXO / Thunderbolt'}
                </span>
              </div>
            </div>
          </div>
          {appleCluster && (
            <div className="mt-2 text-orange-400/70 leading-relaxed pl-10">
              ⚠ Sublinear scaling: 2 nodes ≈ 1.4× speed, 4 nodes ≈ 2.1× speed — Thunderbolt bandwidth is ~180× slower than NVLink. Good for fitting huge models; not for maximum tok/s. Uses <a href="https://github.com/exo-explore/exo" target="_blank" rel="noopener noreferrer" className="text-orange-300 underline">EXO</a> or llama.cpp RPC.
            </div>
          )}
        </div>

        {/* Compare panel — appears when ≥2 items checked */}
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

        {/* Compare mode hint */}
        {!compareMode && compareSelected.size >= 1 && compareSelected.size < 2 && (
          <div className="mb-4 px-3 py-2 border border-dashed border-neutral-700 text-xs text-neutral-500 font-mono">
            + select 1 more item then click compare →
          </div>
        )}

        {/* Mode toggle — Inference vs Agent */}
        <div className="flex items-center gap-3 mb-3 px-3 py-2.5 border border-neutral-800 bg-neutral-900/30">
          <div className="flex gap-1">
            <button
              onClick={() => setHwMode('inference')}
              className={`px-3 py-1 text-xs font-mono uppercase ${hwMode === 'inference' ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-500'}`}
            >
              ⚡ Inference
            </button>
            <button
              onClick={() => setHwMode('agent')}
              className={`px-3 py-1 text-xs font-mono uppercase ${hwMode === 'agent' ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-500'}`}
            >
              🤖 Agent
            </button>
          </div>
          <span className="text-xs text-neutral-500">
            {hwMode === 'inference'
              ? 'decode speed · prefill TTFT · TCO'
              : 'parallel capacity · ECC · sustained load · agent score ↓'}
          </span>
        </div>

        {/* Agent mode callout */}
        {hwMode === 'agent' && (
          <div className="mb-3 px-3 py-2.5 border border-amber-500/20 bg-amber-950/10 text-xs text-neutral-400 leading-relaxed">
            <span className="text-amber-500 font-mono uppercase tracking-wider">🤖 Agent mode</span>
            <span className="ml-2">— ranked by suitability for 24/7 agentic workloads. </span>
            <span className="text-neutral-500">
              <strong className="text-neutral-300">Agents</strong> = simultaneous instances in VRAM. &nbsp;
              <strong className="text-neutral-300">ECC</strong> = error-correcting memory (prevents silent bit-flips over long runs). &nbsp;
              <strong className="text-neutral-300">Throttle</strong> = gaming GPUs reduce clock speed under sustained AI load. &nbsp;
              <strong className="text-neutral-300">Score</strong> = ECC(30) + sustained(25) + parallel agents(up to 20) + VRAM/$(up to 25).
            </span>
          </div>
        )}

        {/* Table */}
        <div className="border border-neutral-800 bg-neutral-900/30">
          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-mono uppercase text-neutral-500 border-b border-neutral-800 bg-neutral-900/60">
            {hwMode === 'inference' ? <>
              <button onClick={() => setSortBy('name')} className="col-span-2 text-left">Hardware</button>
              <button onClick={() => setSortBy('vram')} className="col-span-1 text-right hover:text-amber-500">VRAM {sortBy === 'vram' && '↓'}</button>
              <button onClick={() => setSortBy('price')} className="col-span-2 text-right hover:text-amber-500">Price {sortBy === 'price' && '↓'}</button>
              <button onClick={() => setSortBy('costPerGB')} className="col-span-1 text-right hover:text-amber-500">$/GB {sortBy === 'costPerGB' && '↓'}</button>
              <button onClick={() => setSortBy('bandwidth')} className="col-span-1 text-right hover:text-amber-500">Mem BW {sortBy === 'bandwidth' && '↓'}</button>
              <button onClick={() => setSortBy('prefill')} className="col-span-1 text-right hover:text-amber-500">Prefill {sortBy === 'prefill' && '↓'}</button>
              <button onClick={() => setSortBy('decode')} className="col-span-1 text-right hover:text-amber-500">Decode {sortBy === 'decode' && '↓'}</button>
              <button onClick={() => setSortBy('power')} className="col-span-1 text-right hover:text-amber-500">Power {sortBy === 'power' && '↓'}</button>
              <button onClick={() => setSortBy('total')} className="col-span-2 text-right hover:text-amber-500">TCO {sortBy === 'total' && '↓'}</button>
            </> : <>
              <div className="col-span-2">Hardware</div>
              <div className="col-span-1 text-right">VRAM</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1 text-right">Agents</div>
              <div className="col-span-1 text-right">ECC</div>
              <div className="col-span-1 text-right">Throttle</div>
              <div className="col-span-2 text-right text-amber-500">Score ↓</div>
              <div className="col-span-2 text-right">TCO</div>
            </>}
          </div>

          {(compareMode ? compareItems : filteredHW).map(hw => (
            <div key={hw.id} className={!compareMode && compareSelected.has(hw.id) ? 'border-l-2 border-amber-500' : 'border-l-2 border-transparent'}>
              <HardwareRow
                hw={hw}
                totalVRAM={totalVRAM}
                modelsCount={models.filter(m => m.params).length}
                runtimeMonths={runtimeMonths}
                electricityRate={electricityRate}
                promptTokens={promptTokens}
                outputTokens={outputTokens}
                modelParams={primaryModel ? primaryModel.params : 0}
                modelQuant={primaryModel ? primaryModel.quant : 'fp16'}
                modelActiveParams={primaryModel ? primaryModel.activeParams : null}
                modelContext={primaryModel ? primaryModel.context : 8192}
                appleCluster={appleCluster}
                hwMode={hwMode}
                compareMode={compareMode}
                isSelected={compareSelected.has(hw.id)}
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
              />
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-neutral-500 space-y-1 leading-relaxed border-t border-neutral-800 pt-4">
          <div><span className="text-amber-500">★</span> <strong className="text-neutral-300">Prefill (TTFT)</strong> = time to process the prompt before generating first token. Compute-bound (depends on TFLOPS). Scales linearly with prompt length.</div>
          <div><span className="text-amber-500">★</span> <strong className="text-neutral-300">Decode</strong> = how fast tokens stream out after prefill. Memory-bandwidth-bound (depends on VRAM bandwidth, not TFLOPS). Roughly constant regardless of context length.</div>
          <div><span className="text-amber-500">★</span> <strong className="text-neutral-300">MoE models</strong> (Mixtral, Qwen 3.5 35B-A3B, DeepSeek V3) keep all experts in VRAM but read only the active subset per token, so decode is much faster than param count suggests. Decode efficiency is much lower (~0.2 vs 0.7 dense) due to expert routing overhead and scattered memory access. Calibrated against Qwen 3.5 35B-A3B Q4 on Mac mini M4 measured at ~35 tok/s.</div>
          <div><span className="text-amber-500">★</span> <strong className="text-neutral-300">DGX systems</strong> are turnkey 8-GPU servers (or 72-GPU racks for GB200 NVL72). They can't be further stacked in this calc — pick a bigger DGX if one isn't enough.</div>
          <div><span className="text-amber-500">★</span> <strong className="text-neutral-300">Multi-GPU</strong>: standalone NVIDIA cards stack via tensor parallelism over NVLink/PCIe (~85% scaling efficiency). Apple machines can be clustered via <a href="https://github.com/exo-explore/exo" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">EXO</a> or llama.cpp RPC over Thunderbolt — toggle the <em>Apple cluster</em> switch above, but expect 2-5× worse decode performance per node than single-machine setups.</div>
          <div><span className="text-amber-500">★</span> Latency uses the <em>largest</em> selected model as reference. Real-world numbers depend on inference framework (vLLM, SGLang, llama.cpp, MLX), batch size, and attention impl (flash attn, paged attn).</div>
          <div><span className="text-amber-500">★</span> Price links (amzn / newegg / ebay / apple) open a search in a new tab.</div>
          <div><span className="text-amber-500">★</span> Apple unified memory: usable VRAM ≈ 75% of total RAM (reserve for system).</div>
          <div><span className="text-amber-500">★</span> TCO = HW price + power × 24h × 30d × 50% utilization × months × $/kWh.</div>
          <div><span className="text-amber-500">★</span> GPU prices change over time - table is approximate as of 2025.</div>
          {hwMode === 'agent' && <>
            <div className="mt-2 pt-2 border-t border-neutral-800/50"><span className="text-amber-500">★</span> <strong className="text-neutral-300">Agent mode</strong>: <strong className="text-neutral-300">Agents</strong> = simultaneous instances that fit in VRAM (total VRAM ÷ model size). <strong className="text-neutral-300">ECC</strong> = error-correcting memory — workstation/datacenter only; prevents silent data corruption on 24/7 runs. <strong className="text-neutral-300">Throttle</strong> = gaming GPUs reduce clock speed under sustained load; workstation, datacenter, and Apple Silicon hold rated speed. <strong className="text-neutral-300">Score</strong> = ECC(30) + sustained(25) + agents(up to 20) + VRAM/$(up to 25).</div>
          </>}
          <div className="pt-3 mt-2 border-t border-neutral-800/50">
            New to AI terminology? <a href="/docs/EducAItion.html" target="_blank" rel="noopener noreferrer" className="text-amber-500/70 hover:text-amber-500 underline decoration-dotted">EducAItion — plain-English guide to VRAM, quantization, MoE, and more ↗</a>
          </div>
        </div>
      </div>
    </div>
  );
}

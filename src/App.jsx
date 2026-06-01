import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Cpu, Zap, DollarSign, HardDrive, AlertTriangle, Loader2, TrendingUp, Calculator, ExternalLink } from 'lucide-react';

// ============ DATA: GPU & APPLE ============
// Prices are approximate (USD, 2025), edit as needed
// bandwidth_gbs = memory bandwidth in GB/s (critical for decode speed)
const HARDWARE = [
  // NVIDIA Consumer
  { id: 'rtx4090', vendor: 'NVIDIA', name: 'RTX 4090', vram: 24, price: 1800, tflops_fp16: 165, bandwidth_gbs: 1008, power: 450, category: 'consumer' },
  { id: 'rtx5090', vendor: 'NVIDIA', name: 'RTX 5090', vram: 32, price: 2400, tflops_fp16: 209, bandwidth_gbs: 1792, power: 575, category: 'consumer' },
  { id: 'rtx4080s', vendor: 'NVIDIA', name: 'RTX 4080 Super', vram: 16, price: 1000, tflops_fp16: 104, bandwidth_gbs: 736, power: 320, category: 'consumer' },
  { id: 'rtx3090', vendor: 'NVIDIA', name: 'RTX 3090', vram: 24, price: 900, tflops_fp16: 71, bandwidth_gbs: 936, power: 350, category: 'consumer' },
  { id: 'rtx5080', vendor: 'NVIDIA', name: 'RTX 5080', vram: 16, price: 1200, tflops_fp16: 113, bandwidth_gbs: 960, power: 360, category: 'consumer' },
  // NVIDIA Pro
  { id: 'a6000', vendor: 'NVIDIA', name: 'RTX A6000', vram: 48, price: 4800, tflops_fp16: 75, bandwidth_gbs: 768, power: 300, category: 'workstation' },
  { id: 'a6000ada', vendor: 'NVIDIA', name: 'RTX 6000 Ada', vram: 48, price: 6800, tflops_fp16: 182, bandwidth_gbs: 960, power: 300, category: 'workstation' },
  { id: 'rtx5000ada', vendor: 'NVIDIA', name: 'RTX 5000 Ada', vram: 32, price: 4500, tflops_fp16: 130, bandwidth_gbs: 576, power: 250, category: 'workstation' },
  // NVIDIA Datacenter
  { id: 'a100_40', vendor: 'NVIDIA', name: 'A100 40GB', vram: 40, price: 8500, tflops_fp16: 312, bandwidth_gbs: 1555, power: 400, category: 'datacenter' },
  { id: 'a100_80', vendor: 'NVIDIA', name: 'A100 80GB', vram: 80, price: 15000, tflops_fp16: 312, bandwidth_gbs: 2039, power: 400, category: 'datacenter' },
  { id: 'h100', vendor: 'NVIDIA', name: 'H100 80GB', vram: 80, price: 27000, tflops_fp16: 989, bandwidth_gbs: 3350, power: 700, category: 'datacenter' },
  { id: 'h200', vendor: 'NVIDIA', name: 'H200 141GB', vram: 141, price: 32000, tflops_fp16: 989, bandwidth_gbs: 4800, power: 700, category: 'datacenter' },
  { id: 'b200', vendor: 'NVIDIA', name: 'B200 192GB', vram: 192, price: 45000, tflops_fp16: 2250, bandwidth_gbs: 8000, power: 1000, category: 'datacenter' },
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
  // Qwen 3.5 (MoE & dense)
  { id: 'qwen-3.5-35b-a3b', name: 'Qwen 3.5 35B-A3B (MoE)', params: 35, activeParams: 3 },
  { id: 'qwen-3.5-235b-a22b', name: 'Qwen 3.5 235B-A22B (MoE)', params: 235, activeParams: 22 },
  { id: 'qwen-3.5-72b', name: 'Qwen 3.5 72B', params: 72 },
  // Qwen 3
  { id: 'qwen-3-32b', name: 'Qwen 3 32B', params: 32 },
  { id: 'qwen-3-72b', name: 'Qwen 3 72B', params: 72 },
  { id: 'qwen-3-14b', name: 'Qwen 3 14B', params: 14 },
  // Llama 4
  { id: 'llama-4-scout', name: 'Llama 4 Scout (MoE)', params: 109, activeParams: 17 },
  { id: 'llama-4-maverick', name: 'Llama 4 Maverick (MoE)', params: 402, activeParams: 17 },
  // Llama 3
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', params: 70 },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', params: 8 },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', params: 405 },
  // Mistral / Mixtral
  { id: 'mistral-large', name: 'Mistral Large 2', params: 123 },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B (MoE)', params: 47, activeParams: 13 },
  { id: 'mixtral-8x22b', name: 'Mixtral 8x22B (MoE)', params: 141, activeParams: 39 },
  // DeepSeek
  { id: 'deepseek-v3', name: 'DeepSeek V3 (MoE)', params: 685, activeParams: 37 },
  { id: 'deepseek-r1', name: 'DeepSeek R1 (MoE)', params: 685, activeParams: 37 },
  // Others
  { id: 'gemma-3-27b', name: 'Gemma 3 27B', params: 27 },
  { id: 'gemma-2-27b', name: 'Gemma 2 27B', params: 27 },
  { id: 'phi-4', name: 'Phi 4', params: 14 },
  { id: 'phi-4-mini', name: 'Phi 4 Mini', params: 3.8 },
  { id: 'command-r-plus', name: 'Command R+', params: 104 },
  { id: 'yi-34b', name: 'Yi 34B', params: 34 },
];

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
function calcVRAM(params, quantId, context, mode, batchSize = 1) {
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
  // KV cache: 2 (K+V) * n_layers * d_model * context * batch * bytes
  // rough estimate: n_layers ~ scaling, using heuristic
  const nLayers = Math.max(32, Math.round(Math.pow(params, 0.5) * 8));
  const dModel = Math.max(2048, Math.round(Math.pow(params, 0.5) * 600));
  // KV cache usually FP16 even with INT4 weights
  const kvBytes = 2;
  const kvCache = (2 * nLayers * dModel * context * batchSize * kvBytes) / 1e9;
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

// ============ COMPONENTS ============

function TooltipIcon({ text }) {
  return (
    <span title={text} className="inline-flex items-center ml-1 text-neutral-600 hover:text-neutral-400 cursor-help align-middle">
      <Info size={11} />
    </span>
  );
}

function ModelCard({ model, onUpdate, onRemove, idx }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [sortMode, setSortMode] = useState('trending'); // 'trending' | 'newest' | 'downloads'

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

          <div className="text-xs text-neutral-500 mb-1 mt-2">or from presets:</div>
          <div className="flex flex-wrap gap-1">
            {KNOWN_MODELS.map((km) => (
              <button
                key={km.id}
                onClick={() => selectKnown(km)}
                className="text-xs border border-neutral-700 text-neutral-300 hover:border-amber-500 hover:text-amber-500 px-2 py-0.5"
              >
                {km.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {model.name && (
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
      )}
    </div>
  );
}

function HardwareRow({ hw, totalVRAM, modelsCount, runtimeMonths, electricityRate, promptTokens, outputTokens, modelParams, modelQuant, modelActiveParams, appleCluster, compareMode, isSelected, onToggleSelect }) {
  // How many units of this HW are needed to fit the model(s)?
  // NVIDIA standalone cards: stack via tensor parallelism
  // Apple machines: stack via EXO / llama.cpp RPC (only if appleCluster=true; performance penalty is severe)
  // DGX systems: already a box, can't be further stacked here
  const canMultiGPU = (hw.vendor === 'NVIDIA' && hw.category !== 'dgx') || (hw.vendor === 'Apple' && appleCluster);
  const rawNeeded = totalVRAM > 0 ? Math.ceil(totalVRAM / hw.vram) : 1;
  const needed = canMultiGPU ? rawNeeded : 1;
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
            {compareMode && <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="flex-shrink-0 w-4 h-4 cursor-pointer accent-amber-500 mt-0.5" />}
            {!reallyFits && <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />}
            {needed > 1 && (
              <span className="inline-flex items-center justify-center bg-amber-500 text-neutral-950 font-mono text-xs px-1.5 py-0.5 font-bold flex-shrink-0">
                {needed}×
              </span>
            )}
            <span className="font-serif text-neutral-100 truncate">{hw.name}</span>
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
          {compareMode && <input type="checkbox" checked={isSelected} onChange={onToggleSelect} className="flex-shrink-0 w-3.5 h-3.5 cursor-pointer accent-amber-500" />}
          {!reallyFits && <AlertTriangle size={12} className="text-red-400" />}
          <div className="min-w-0">
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
        <div className="col-span-2 text-right">
          <div className="font-mono text-amber-500">{fmtMoney(totalCost)}</div>
          <div className="text-xs text-neutral-500">+{fmtMoney(electricityCost)} energy</div>
        </div>
      </div>

    </div>
  );
}

export default function App() {
  const [models, setModels] = useState([
    { id: 1, name: '', params: 0, quant: 'fp16', context: 8192, source: null, activeParams: null },
  ]);
  const [calcMode, setCalcMode] = useState('detailed'); // simple | detailed
  const [concurrent, setConcurrent] = useState(true);
  const [vendorFilter, setVendorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [runtimeMonths, setRuntimeMonths] = useState(12);
  const [electricityRate, setElectricityRate] = useState(0.15); // USD/kWh
  const [sortBy, setSortBy] = useState('price');
  const [promptTokens, setPromptTokens] = useState(1024);
  const [outputTokens, setOutputTokens] = useState(256);
  const [appleCluster, setAppleCluster] = useState(false); // allow stacking Apple machines via EXO/llama.cpp RPC
  const [maxPrice, setMaxPrice] = useState(10000);
  const [maxPriceEnabled, setMaxPriceEnabled] = useState(true);
  const [hwSearch, setHwSearch] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState(new Set());

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
      return calcVRAM(m.params, m.quant, m.context, calcMode);
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
  }, [vendorFilter, categoryFilter, sortBy, totalVRAM, runtimeMonths, electricityRate, promptTokens, outputTokens, primaryModel, appleCluster, hwSearch, maxPrice, maxPriceEnabled]);

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
      `}</style>

      {/* HEADER */}
      <div className="grid-bg border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between mb-2">
            <div className="text-xs font-mono text-amber-500 tracking-[0.3em] uppercase">
              ▮▮▮ GPU / VRAM / COST_CALCULATOR
            </div>
            <div className="text-xs font-mono text-neutral-600">v1.0 · {new Date().toISOString().slice(0,10)}</div>
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
                : 'Weights + KV cache (depends on context) + framework overhead. KV cache always in FP16 even for quantized models.'}
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
              onClick={() => { setCompareMode(m => !m); setCompareSelected(new Set()); }}
              className={`text-xs font-mono uppercase px-3 py-1 border transition-colors ${compareMode ? 'bg-amber-500 text-neutral-950 border-amber-500' : 'border-neutral-700 text-neutral-400 hover:border-amber-500 hover:text-amber-500'}`}
            >
              {compareMode ? `comparing ${compareSelected.size} selected` : 'compare'}
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
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-neutral-500 font-mono uppercase mr-2 self-center">vendor:</span>
            {['all', 'NVIDIA', 'Apple'].map(v => (
              <button
                key={v}
                onClick={() => setVendorFilter(v)}
                className={`px-3 py-1 text-xs font-mono uppercase ${vendorFilter === v ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 ml-2">
            <span className="text-xs text-neutral-500 font-mono uppercase mr-2 self-center">category:</span>
            {['all', 'consumer', 'workstation', 'datacenter', 'dgx', 'apple'].map(c => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1 text-xs font-mono uppercase ${categoryFilter === c ? 'bg-amber-500 text-neutral-950' : 'border border-neutral-700 text-neutral-400'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="flex gap-1.5 ml-2 items-center cursor-pointer">
            <button
              onClick={() => setAppleCluster(!appleCluster)}
              className={`w-8 h-4 rounded-full relative transition-colors ${appleCluster ? 'bg-orange-500' : 'bg-neutral-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${appleCluster ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
            </button>
            <span className={`text-xs font-mono uppercase tracking-wider ${appleCluster ? 'text-orange-400' : 'text-neutral-500'}`}>
              Apple cluster {appleCluster && '⚠'}
            </span>
            <TooltipIcon text="Stack multiple Apple machines via EXO or llama.cpp RPC over Thunderbolt. Fits huge models but scaling is poor (~1.4× speed for 2 nodes) due to Thunderbolt bandwidth limits vs NVLink." />
          </label>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={() => setMaxPriceEnabled(e => !e)}
              className={`w-8 h-4 rounded-full relative transition-colors flex-shrink-0 ${maxPriceEnabled ? 'bg-amber-500' : 'bg-neutral-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-neutral-950 transition-transform ${maxPriceEnabled ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
            </button>
            <span className="text-xs font-mono text-neutral-500 uppercase">max $</span>
            {maxPriceEnabled && (
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
                className="w-20 bg-neutral-950 border border-neutral-700 px-2 py-0.5 text-xs text-neutral-200 font-mono"
              />
            )}
          </div>
        </div>
        {appleCluster && (
          <div className="text-xs text-orange-400/80 mb-3 -mt-2 leading-relaxed">
            ⚠ Apple machines clustered via <a href="https://github.com/exo-explore/exo" target="_blank" rel="noopener noreferrer" className="text-orange-300 underline">EXO</a> or llama.cpp RPC over Thunderbolt. Sublinear scaling: 2 nodes ≈ 1.4× speed, 4 nodes ≈ 2.1× speed (Thunderbolt bandwidth is ~80× slower than NVLink). Great for fitting huge models you couldn't otherwise run; not great if you need maximum tok/s.
          </div>
        )}

        {/* Table */}
        <div className="border border-neutral-800 bg-neutral-900/30">
          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 text-xs font-mono uppercase text-neutral-500 border-b border-neutral-800 bg-neutral-900/60">
            <button onClick={() => setSortBy('name')} className="col-span-2 text-left">Hardware</button>
            <button onClick={() => setSortBy('vram')} className="col-span-1 text-right hover:text-amber-500">VRAM {sortBy === 'vram' && '↓'}</button>
            <button onClick={() => setSortBy('price')} className="col-span-2 text-right hover:text-amber-500">Price {sortBy === 'price' && '↓'}</button>
            <button onClick={() => setSortBy('costPerGB')} className="col-span-1 text-right hover:text-amber-500">$/GB {sortBy === 'costPerGB' && '↓'}</button>
            <button onClick={() => setSortBy('bandwidth')} className="col-span-1 text-right hover:text-amber-500">Mem BW {sortBy === 'bandwidth' && '↓'}</button>
            <button onClick={() => setSortBy('prefill')} className="col-span-1 text-right hover:text-amber-500">Prefill {sortBy === 'prefill' && '↓'}</button>
            <button onClick={() => setSortBy('decode')} className="col-span-1 text-right hover:text-amber-500">Decode {sortBy === 'decode' && '↓'}</button>
            <button onClick={() => setSortBy('power')} className="col-span-1 text-right hover:text-amber-500">Power {sortBy === 'power' && '↓'}</button>
            <button onClick={() => setSortBy('total')} className="col-span-2 text-right hover:text-amber-500">TCO {sortBy === 'total' && '↓'}</button>
          </div>

          {(compareMode && compareSelected.size > 0 ? filteredHW.filter(h => compareSelected.has(h.id)) : filteredHW).map(hw => (
            <HardwareRow
              key={hw.id}
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
              appleCluster={appleCluster}
              compareMode={compareMode}
              isSelected={compareSelected.has(hw.id)}
              onToggleSelect={() => setCompareSelected(prev => {
                const next = new Set(prev);
                next.has(hw.id) ? next.delete(hw.id) : next.add(hw.id);
                return next;
              })}
            />
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
        </div>
      </div>
    </div>
  );
}

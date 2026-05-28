import { estimateWeightBytes, effectiveQuantType } from "./quantization";
import type { GPUInfo } from "../types/hardware";
import type { ModelInfo, GGUFVariant } from "../types/model";

const QUANT_EFFICIENCY: Record<string, number> = {
  "F32": 0.30,
  "F16": 0.40,
  "BF16": 0.40,
  "Q8_0": 0.45,
  "Q6_K": 0.50,
  "Q5_K_M": 0.52,
  "Q5_K_S": 0.52,
  "Q5_0": 0.50,
  "Q4_K_M": 0.55,
  "Q4_K_S": 0.55,
  "Q4_0": 0.53,
  "Q3_K_M": 0.50,
  "Q3_K_S": 0.48,
  "Q3_K_L": 0.50,
  "Q2_K": 0.45,
  "IQ4_XS": 0.52,
  "IQ4_NL": 0.50,
  "IQ3_S": 0.45,
  "IQ3_M": 0.45,
  "IQ3_XS": 0.45,
  "IQ3_XXS": 0.42,
  "IQ2_S": 0.40,
  "IQ2_M": 0.40,
  "IQ2_XXS": 0.38,
  "IQ1_M": 0.35,
  "IQ1_S": 0.35,
  "Q2_0": 0.38,
  "Q1_0": 0.32,
  "TQ2_0": 0.35,
  "TQ1_0": 0.32,
};

const DEFAULT_QUANT_EFFICIENCY = 0.45;

const BACKEND_FACTOR: Record<string, number> = {
  "nvidia": 1.00,
  "amd": 0.78,
  "apple": 0.82,
  "intel": 0.65,
};

const MOE_REFERENCE_BANDWIDTH_GBPS = 256.0;
const MOE_MIN_READ_RATIO_AT_REFERENCE = 0.05;
const MOE_MAX_READ_RATIO_FLOOR = 0.25;

const SPEED_CONFIDENCE_RANGE_FACTORS: Record<string, [number, number]> = {
  "high": [0.85, 1.20],
  "medium": [0.60, 1.60],
  "low": [0.35, 2.00],
};

const SPEED_CONFIDENCE_ORDER: Record<string, number> = {
  "low": 0,
  "medium": 1,
  "high": 2,
};

function backendFactor(gpu: GPUInfo): number {
  return BACKEND_FACTOR[gpu.vendor] ?? 0.7;
}

function quantEfficiency(model: ModelInfo, variant?: GGUFVariant): number {
  const quant = effectiveQuantType(model, variant);
  if (!quant) {
    return DEFAULT_QUANT_EFFICIENCY;
  }
  return QUANT_EFFICIENCY[quant.toUpperCase()] ?? DEFAULT_QUANT_EFFICIENCY;
}

function moeEffectiveReadRatio(model: ModelInfo, gpu: GPUInfo): number {
  if (!model.isMoe || !model.parameterCountActive) {
    return 1.0;
  }
  if (model.parameterCount <= 0) {
    return 1.0;
  }

  const activeRatio = model.parameterCountActive / model.parameterCount;
  if (activeRatio <= 0) {
    return 1.0;
  }

  let floor: number;
  const bandwidth = gpu.memoryBandwidthGbps ?? 0.0;
  if (bandwidth > 0) {
    floor = MOE_MIN_READ_RATIO_AT_REFERENCE * Math.max(1.0, bandwidth / MOE_REFERENCE_BANDWIDTH_GBPS);
  } else {
    floor = MOE_MAX_READ_RATIO_FLOOR;
  }
  floor = Math.min(MOE_MAX_READ_RATIO_FLOOR, floor);

  return Math.min(1.0, Math.max(activeRatio, floor));
}

function lowerSpeedConfidence(current: string, candidate: string): string {
  if (SPEED_CONFIDENCE_ORDER[candidate] < SPEED_CONFIDENCE_ORDER[current]) {
    return candidate;
  }
  return current;
}

function looksSyntheticGguf(model: ModelInfo, variant?: GGUFVariant): boolean {
  if (!variant) {
    return false;
  }
  if (!variant.filename) {
    return false;
  }
  const expected = `${model.name}.${variant.quantType}.gguf`;
  return variant.filename === expected;
}

export interface SpeedEstimate {
  confidence: "low" | "medium" | "high";
  speedRange?: [number, number];
  notes: string[];
  tokPerSec: number;
}

export function estimateTokPerSec(
  model: ModelInfo,
  variant: GGUFVariant | undefined,
  gpu: GPUInfo | undefined,
  fitType: "full_gpu" | "partial_offload" | "cpu_only" = "full_gpu"
): number {
  if (!gpu || fitType === "cpu_only") {
    let paramsB = model.parameterCount / 1e9;
    if (model.isMoe && model.parameterCountActive) {
      paramsB = model.parameterCountActive / 1e9;
    }
    if (paramsB <= 0) {
      return 0.0;
    }
    const quantFactor = quantEfficiency(model, variant) / DEFAULT_QUANT_EFFICIENCY;
    return Math.max(0.3, 18.0 / Math.max(paramsB, 0.5) * quantFactor);
  }

  const modelSize = estimateWeightBytes(model, variant);

  let effectiveRead: number;
  if (model.isMoe && model.parameterCountActive) {
    effectiveRead = modelSize * moeEffectiveReadRatio(model, gpu);
  } else {
    effectiveRead = modelSize;
  }

  const bandwidth = (gpu.memoryBandwidthGbps ?? 0) * 1e9;
  if (bandwidth === 0) {
    return 0.0;
  }

  const theoretical = bandwidth / effectiveRead;

  let efficiency = quantEfficiency(model, variant) * backendFactor(gpu);

  if (fitType === "partial_offload") {
    if (gpu.vendor === "apple" || gpu.sharedMemory) {
      efficiency *= 0.85;
    } else {
      efficiency *= 0.45;
    }
  }

  return theoretical * efficiency;
}

export function estimateSpeedUncertainty(
  model: ModelInfo,
  variant: GGUFVariant | undefined,
  gpu: GPUInfo | undefined,
  fitType: "full_gpu" | "partial_offload" | "cpu_only",
  estimatedTokPerSec: number | undefined
): Omit<SpeedEstimate, "tokPerSec"> {
  const notes = [
    "Speed is estimated from memory bandwidth, quantization, backend, and fit type.",
  ];
  let confidence: "low" | "medium" | "high" = "medium";

  if (estimatedTokPerSec === undefined || estimatedTokPerSec <= 0) {
    return {
      confidence: "low",
      speedRange: undefined,
      notes: [...notes, "No usable bandwidth estimate was available for this setup."],
    };
  }

  if (!gpu || fitType === "cpu_only") {
    confidence = "low";
    notes.push("CPU-only speed varies heavily with memory channels and BLAS/kernel path.");
  } else {
    if (!gpu.memoryBandwidthGbps) {
      confidence = "low";
      notes.push("GPU memory bandwidth is unknown, so speed is especially uncertain.");
    }

    if (fitType === "partial_offload") {
      confidence = "low";
      if (gpu.vendor === "apple" || gpu.sharedMemory) {
        notes.push("Partial offload on unified memory is backend-sensitive but avoids a PCIe cliff.");
      } else {
        notes.push("Partial offload on a discrete GPU depends strongly on PCIe and CPU RAM bandwidth.");
      }
    }

    if (model.isMoe) {
      notes.push("MoE speed uses active parameters plus a bandwidth-scaled dispatch/read floor.");
      if (gpu.vendor === "apple") {
        confidence = lowerSpeedConfidence(confidence, "low") as "low" | "medium" | "high";
        notes.push("Apple Silicon MoE throughput is especially sensitive to Metal/MLX runtime kernels.");
      } else if (gpu.vendor === "amd" && gpu.sharedMemory) {
        confidence = lowerSpeedConfidence(confidence, "medium") as "low" | "medium" | "high";
        notes.push("AMD shared-memory APU estimates are calibrated by bandwidth, but ROCm/Vulkan kernels can differ.");
      }
    }
  }

  if (looksSyntheticGguf(model, variant)) {
    confidence = lowerSpeedConfidence(confidence, "medium") as "low" | "medium" | "high";
    notes.push("This is a synthetic GGUF estimate for an official repo, not a measured GGUF file.");
  }

  const [lowFactor, highFactor] = SPEED_CONFIDENCE_RANGE_FACTORS[confidence];
  const speedRange: [number, number] = [
    Math.round(estimatedTokPerSec * lowFactor * 10) / 10,
    Math.round(estimatedTokPerSec * highFactor * 10) / 10,
  ];

  return {
    confidence,
    speedRange,
    notes,
  };
}

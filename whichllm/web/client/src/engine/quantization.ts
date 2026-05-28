import { QUANT_BYTES_PER_WEIGHT, QUANT_QUALITY_PENALTY } from "../constants";
import type { ModelInfo, GGUFVariant } from "../types/model";

const NON_GGUF_PATTERNS: [RegExp, string][] = [
  [/(^|[-_/])awq($|[-_/])/i, "AWQ"],
  [/(^|[-_/])gptq($|[-_/])/i, "GPTQ"],
  [/(bnb[-_/]?4bit|nf4|int4|4bit)/i, "BNB_4BIT"],
  [/(int8|8bit)/i, "INT8"],
  [/(^|[-_/])fp8($|[-_/])/i, "FP8"],
  [/(^|[-_/])bf16($|[-_/])/i, "BF16"],
  [/(^|[-_/])(fp16|f16)($|[-_/])/i, "FP16"],
];

const NON_GGUF_BYTES_PER_WEIGHT: Record<string, number> = {
  "AWQ": 0.5,
  "GPTQ": 0.5,
  "BNB_4BIT": 0.5,
  "INT8": 1.0,
  "FP8": 1.0,
  "BF16": 2.0,
  "FP16": 2.0,
};

const NON_GGUF_QUALITY_PENALTY: Record<string, number> = {
  "AWQ": 0.05,
  "GPTQ": 0.05,
  "BNB_4BIT": 0.07,
  "INT8": 0.02,
  "FP8": 0.02,
  "BF16": 0.0,
  "FP16": 0.0,
};

export function inferNonGgufQuantType(modelId: string): string {
  const lower = modelId.toLowerCase();
  for (const [pattern, quantType] of NON_GGUF_PATTERNS) {
    if (pattern.test(lower)) {
      return quantType;
    }
  }
  return "FP16";
}

export function effectiveQuantType(model: ModelInfo, variant?: GGUFVariant): string {
  if (variant) {
    return variant.quantType.toUpperCase();
  }
  return inferNonGgufQuantType(model.id);
}

export function estimateWeightBytes(model: ModelInfo, variant?: GGUFVariant): number {
  if (variant) {
    return variant.fileSizeBytes;
  }
  const quantType = inferNonGgufQuantType(model.id);
  const bytesPerWeight = NON_GGUF_BYTES_PER_WEIGHT[quantType] ?? 2.0;
  return Math.floor(model.parameterCount * bytesPerWeight);
}

export function getBytesPerWeight(quantType: string): number {
  const upper = quantType.toUpperCase();
  if (upper in QUANT_BYTES_PER_WEIGHT) {
    return QUANT_BYTES_PER_WEIGHT[upper];
  }
  return NON_GGUF_BYTES_PER_WEIGHT[upper] ?? 2.0;
}

export function quantQualityPenalty(model: ModelInfo, variant?: GGUFVariant): number {
  const quantType = effectiveQuantType(model, variant).toUpperCase();
  if (quantType in QUANT_QUALITY_PENALTY) {
    return QUANT_QUALITY_PENALTY[quantType];
  }
  return NON_GGUF_QUALITY_PENALTY[quantType] ?? 0.05;
}

import { FRAMEWORK_OVERHEAD_BYTES } from "../constants";
import { estimateWeightBytes } from "./quantization";
import type { ModelInfo, GGUFVariant } from "../types/model";

const KV_BYTES_PER_BPARAM_PER_KCTX = 3.5 * 1024 * 1024;
const MOE_ATTENTION_PARAM_MULTIPLIER = 4.0;

export function estimateKvCache(model: ModelInfo, contextLength: number): number {
  let paramsB: number;
  if (model.isMoe && model.parameterCountActive) {
    const activeB = model.parameterCountActive / 1e9;
    paramsB = activeB * MOE_ATTENTION_PARAM_MULTIPLIER;
  } else {
    paramsB = model.parameterCount / 1e9;
  }

  const ctxK = contextLength / 1024;
  const kvBytes = Math.floor(paramsB * ctxK * KV_BYTES_PER_BPARAM_PER_KCTX);
  return Math.max(kvBytes, 0);
}

function activationBytes(model: ModelInfo, contextLength: number): number {
  let effectiveP: number;
  if (model.isMoe && model.parameterCountActive) {
    effectiveP = model.parameterCountActive;
  } else {
    effectiveP = model.parameterCount;
  }

  const base = 400_000_000;
  const paramTerm = Math.floor(effectiveP * 0.08);
  const ctxTerm = Math.floor((contextLength / 4096) * 150_000_000);
  return base + paramTerm + ctxTerm;
}

export function estimateVram(
  model: ModelInfo,
  variant?: GGUFVariant,
  contextLength: number = 4096
): number {
  const weights = estimateWeightBytes(model, variant);
  const kvCache = estimateKvCache(model, contextLength);
  const activation = activationBytes(model, contextLength);
  const framework = FRAMEWORK_OVERHEAD_BYTES;
  return weights + kvCache + activation + framework;
}

export function bytesToGiB(bytes: number): number {
  return bytes / (1024 ** 3);
}

export function formatBytes(bytes: number): string {
  const gib = bytesToGiB(bytes);
  if (gib >= 1) {
    return `${gib.toFixed(1)} GB`;
  }
  const mib = bytes / (1024 ** 2);
  return `${mib.toFixed(0)} MB`;
}

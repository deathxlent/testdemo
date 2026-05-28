import { GiB, MIN_COMPUTE_CAPABILITY_OLLAMA } from "../constants";
import { estimateWeightBytes } from "./quantization";
import { estimateVram } from "./vram";
import type { GPUInfo, HardwareInfo } from "../types/hardware";
import type { ModelInfo, GGUFVariant } from "../types/model";

export interface CompatibilityResult {
  model: ModelInfo;
  ggufVariant?: GGUFVariant;
  canRun: boolean;
  vramRequiredBytes: number;
  vramAvailableBytes: number;
  warnings: string[];
  fitType: "full_gpu" | "partial_offload" | "cpu_only";
  estimatedTokPerSec?: number;
  speedConfidence: "low" | "medium" | "high";
  speedRangeTokPerSec?: [number, number];
  speedNotes: string[];
  qualityScore: number;
  benchmarkStatus: "none" | "direct" | "estimated" | "self_reported";
  benchmarkSource: string;
  benchmarkConfidence: number;
}

function gpuAvailableMemory(gpu: GPUInfo, usableRam: number): number {
  if (gpu.sharedMemory && gpu.vramBytes < 2 * GiB) {
    return usableRam;
  }
  return gpu.vramBytes;
}

function usesSharedSystemPool(gpu: GPUInfo): boolean {
  return gpu.sharedMemory && gpu.vramBytes < 2 * GiB;
}

function fitCandidateGpus(gpus: GPUInfo[]): GPUInfo[] {
  const hasDedicatedGpu = gpus.some(
    (gpu) => !usesSharedSystemPool(gpu) && gpu.vramBytes > 0
  );
  if (!hasDedicatedGpu) {
    return gpus;
  }
  return gpus.filter((gpu) => !usesSharedSystemPool(gpu));
}

export function checkCompatibility(
  model: ModelInfo,
  variant: GGUFVariant | undefined,
  hardware: HardwareInfo,
  contextLength: number = 4096
): CompatibilityResult {
  const warnings: string[] = [];

  const vramRequired = estimateVram(model, variant, contextLength);

  const usableRam = Math.floor(hardware.ramBytes * 0.8);

  let bestGpu: GPUInfo | undefined = undefined;
  let bestGpuAvailable = 0;
  let totalVram = 0;
  const candidateGpus = fitCandidateGpus(hardware.gpus);

  for (const gpu of candidateGpus) {
    const gpuAvailable = gpuAvailableMemory(gpu, usableRam);
    totalVram += gpuAvailable;
    if (bestGpu === undefined || gpuAvailable > bestGpuAvailable) {
      bestGpu = gpu;
      bestGpuAvailable = gpuAvailable;
    }
  }

  const vramAvailable = totalVram > 0 ? totalVram : 0;
  const offloadRamAvailable =
    bestGpu && (bestGpu.sharedMemory || bestGpu.vendor === "apple")
      ? 0
      : usableRam;

  if (bestGpu && bestGpu.vendor === "nvidia" && bestGpu.computeCapability) {
    const [major, minor] = bestGpu.computeCapability;
    const [minMajor, minMinor] = MIN_COMPUTE_CAPABILITY_OLLAMA;
    if (major < minMajor || (major === minMajor && minor < minMinor)) {
      warnings.push(
        `Compute capability ${major}.${minor} is below minimum ${minMajor}.${minMinor} for Ollama`
      );
    }
  }

  let fitType: "full_gpu" | "partial_offload" | "cpu_only";
  let canRun: boolean;

  if (vramAvailable >= vramRequired) {
    fitType = "full_gpu";
    canRun = true;
  } else if (
    vramAvailable > 0 &&
    vramAvailable + offloadRamAvailable >= vramRequired
  ) {
    fitType = "partial_offload";
    canRun = true;
    const offloadPct =
      vramRequired > 0
        ? ((vramRequired - vramAvailable) / vramRequired) * 100
        : 0;
    if (bestGpu && (bestGpu.sharedMemory || bestGpu.vendor === "apple")) {
      warnings.push("Will use shared system memory");
    } else {
      warnings.push(
        `~${Math.round(offloadPct)}% of layers will be offloaded to CPU RAM`
      );
    }
  } else if (usableRam >= vramRequired) {
    fitType = "cpu_only";
    canRun = true;
    warnings.push("Will run on CPU only (much slower)");
  } else {
    fitType = "cpu_only";
    canRun = false;
    warnings.push("Insufficient memory (GPU VRAM + RAM) to run this model");
  }

  if (
    contextLength > 8192 &&
    model.contextLength &&
    model.contextLength >= contextLength
  ) {
    warnings.push(
      `Large context (${contextLength}) increases VRAM usage significantly`
    );
  }

  const fileSize = estimateWeightBytes(model, variant);
  if (hardware.diskFreeBytes > 0 && fileSize > hardware.diskFreeBytes) {
    warnings.push("Insufficient disk space to download this model");
    canRun = false;
  }

  return {
    model,
    ggufVariant: variant,
    canRun,
    vramRequiredBytes: vramRequired,
    vramAvailableBytes: vramAvailable,
    warnings,
    fitType,
    speedConfidence: "medium",
    speedNotes: [],
    qualityScore: 0,
    benchmarkStatus: "none",
    benchmarkSource: "none",
    benchmarkConfidence: 0,
  };
}

export interface GGUFVariant {
  filename: string;
  quantType: string;
  fileSizeBytes: number;
}

export interface ModelInfo {
  id: string;
  familyId: string;
  name: string;
  parameterCount: number;
  parameterCountActive?: number;
  architecture: string;
  isMoe: boolean;
  contextLength?: number;
  license?: string;
  publishedAt?: string;
  downloads: number;
  likes: number;
  ggufVariants: GGUFVariant[];
  benchmarkScores: Record<string, number>;
  baseModel?: string;
}

export interface ModelFamily {
  familyId: string;
  displayName: string;
  baseModel: ModelInfo;
  variants: ModelInfo[];
  bestBenchmark: Record<string, number>;
}

export interface RankedModel {
  model: ModelInfo;
  variant?: GGUFVariant;
  rankScore: number;
  vramBytes: number;
  estimatedTokPerSec?: number;
  fitType: "full_gpu" | "partial_offload" | "cpu_only";
  speedConfidence: "low" | "medium" | "high";
  speedRange?: [number, number];
  speedNotes: string[];
}

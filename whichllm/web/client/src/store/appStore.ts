import { create } from "zustand";
import type { GPUInfo, HardwareInfo } from "../types/hardware";
import type { ModelInfo, RankedModel } from "../types/model";
import { createSyntheticGpu } from "../lib/gpuSimulator";
import { estimateVram } from "../engine/vram";
import { estimateTokPerSec } from "../engine/performance";
import { checkCompatibility } from "../engine/compatibility";

function getDemoModels(): ModelInfo[] {
  return [
    {
      id: "meta-llama/Meta-Llama-3-8B",
      familyId: "meta-llama",
      name: "Llama 3 8B",
      parameterCount: 8e9,
      parameterCountActive: undefined,
      architecture: "llama",
      isMoe: false,
      contextLength: 8192,
      license: "llama3",
      publishedAt: "2024-04-18",
      downloads: 1000000,
      likes: 50000,
      ggufVariants: [],
      benchmarkScores: {},
      baseModel: undefined,
    },
    {
      id: "Qwen/Qwen2-7B-Instruct",
      familyId: "Qwen",
      name: "Qwen2 7B Instruct",
      parameterCount: 7e9,
      parameterCountActive: undefined,
      architecture: "qwen2",
      isMoe: false,
      contextLength: 131072,
      license: "apache-2.0",
      publishedAt: "2024-06-06",
      downloads: 500000,
      likes: 25000,
      ggufVariants: [],
      benchmarkScores: {},
      baseModel: undefined,
    },
    {
      id: "deepseek-ai/DeepSeek-V2-Chat",
      familyId: "deepseek-ai",
      name: "DeepSeek V2 Chat",
      parameterCount: 236e9,
      parameterCountActive: 21e9,
      architecture: "deepseek",
      isMoe: true,
      contextLength: 128000,
      license: "deepseek",
      publishedAt: "2024-05-06",
      downloads: 200000,
      likes: 15000,
      ggufVariants: [],
      benchmarkScores: {},
      baseModel: undefined,
    },
    {
      id: "microsoft/phi-2",
      familyId: "microsoft",
      name: "Phi-2",
      parameterCount: 2.7e9,
      parameterCountActive: undefined,
      architecture: "phi",
      isMoe: false,
      contextLength: 2048,
      license: "mit",
      publishedAt: "2023-12-12",
      downloads: 800000,
      likes: 40000,
      ggufVariants: [],
      benchmarkScores: {},
      baseModel: undefined,
    },
    {
      id: "google/gemma-7b-it",
      familyId: "google",
      name: "Gemma 7B IT",
      parameterCount: 7e9,
      parameterCountActive: undefined,
      architecture: "gemma",
      isMoe: false,
      contextLength: 8192,
      license: "gemma",
      publishedAt: "2024-02-21",
      downloads: 600000,
      likes: 30000,
      ggufVariants: [],
      benchmarkScores: {},
      baseModel: undefined,
    },
  ];
}

interface AppState {
  hardware: HardwareInfo;
  selectedGpu: string;
  customVram: number;
  contextLength: number;
  models: ModelInfo[];
  rankedModels: RankedModel[];
  isLoading: boolean;
  searchQuery: string;
  selectedModelId: string | null;
  setSelectedGpu: (gpu: string) => void;
  setCustomVram: (vram: number) => void;
  setContextLength: (length: number) => void;
  setSearchQuery: (query: string) => void;
  setSelectedModelId: (id: string | null) => void;
  searchModels: () => Promise<void>;
  rankModels: () => void;
}

const defaultHardware: HardwareInfo = {
  gpus: [],
  cpuName: "Unknown",
  cpuCores: 8,
  hasAvx2: true,
  hasAvx512: false,
  ramBytes: 16 * 1024 ** 3,
  diskFreeBytes: 100 * 1024 ** 3,
  os: "linux",
};

export const useAppStore = create<AppState>((set, get) => ({
  hardware: defaultHardware,
  selectedGpu: "NVIDIA GeForce RTX 4090",
  customVram: 24,
  contextLength: 4096,
  models: [],
  rankedModels: [],
  isLoading: false,
  searchQuery: "",
  selectedModelId: null,
  setSelectedGpu: (gpu) => {
    set({ selectedGpu: gpu });
    try {
      const gpuInfo = createSyntheticGpu(gpu);
      set((state) => ({
        hardware: { ...state.hardware, gpus: [gpuInfo] },
      }));
    } catch (e) {
      console.error("Failed to create GPU:", e);
    }
  },
  setCustomVram: (vram) => {
    set({ customVram: vram });
    const { selectedGpu } = get();
    try {
      const gpuInfo = createSyntheticGpu(selectedGpu, vram);
      set((state) => ({
        hardware: { ...state.hardware, gpus: [gpuInfo] },
      }));
    } catch (e) {
      console.error("Failed to create GPU:", e);
    }
  },
  setContextLength: (length) => set({ contextLength: length }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  searchModels: async () => {
    set({ isLoading: true });
    try {
      const { searchQuery } = get();
      const response = await fetch(
        `/api/models?search=${encodeURIComponent(searchQuery || "llama 3 qwen deepseek phi gemma")}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        throw new Error("API response is not an array");
      }
      
      const models: ModelInfo[] = data.map((item: any) => ({
        id: item.id,
        familyId: item.id.split("/")[0] || item.id,
        name: item.modelName || item.id.split("/")[1] || item.id,
        parameterCount: item.safetensors?.total || 0,
        parameterCountActive: undefined,
        architecture: item.config?.model_type || "",
        isMoe: false,
        contextLength: item.config?.max_position_embeddings || undefined,
        license: item.license || undefined,
        publishedAt: item.createdAt || undefined,
        downloads: item.downloads || 0,
        likes: item.likes || 0,
        ggufVariants: [],
        benchmarkScores: {},
        baseModel: item.baseModel || undefined,
      }));
      
      set({ models });
    } catch (error) {
      console.error("Failed to fetch models:", error);
      set({ models: getDemoModels() });
    } finally {
      set({ isLoading: false });
    }
  },
  rankModels: () => {
    const { models, hardware, contextLength } = get();
    const ranked: RankedModel[] = models.slice(0, 10).map((model) => ({
      model,
      rankScore: 0,
      vramBytes: 0,
      estimatedTokPerSec: 0,
      fitType: "full_gpu",
      speedConfidence: "medium",
      speedNotes: [],
    }));
    set({ rankedModels: ranked });
  },
}));

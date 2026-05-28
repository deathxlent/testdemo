export interface GPUInfo {
  name: string;
  vendor: "nvidia" | "amd" | "apple" | "intel";
  vramBytes: number;
  computeCapability?: [number, number];
  cudaVersion?: string;
  rocmVersion?: string;
  memoryBandwidthGbps?: number;
  sharedMemory: boolean;
}

export interface HardwareInfo {
  gpus: GPUInfo[];
  cpuName: string;
  cpuCores: number;
  hasAvx2: boolean;
  hasAvx512: boolean;
  ramBytes: number;
  diskFreeBytes: number;
  os: "linux" | "darwin" | "windows";
}

export interface GPUSpec {
  name: string;
  manufacturer: string;
  memorySizeGb: number;
  memoryBandwidthGbS?: number;
  cudaMajorVersion?: number;
  cudaMinorVersion?: number;
}

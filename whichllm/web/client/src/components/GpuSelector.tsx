import React, { useState, useEffect } from "react";
import { useAppStore } from "../store/appStore";
import { GPU_LIST } from "../lib/gpuDatabase";
import { Search, Cpu } from "lucide-react";

export const GpuSelector: React.FC = () => {
  const { selectedGpu, setSelectedGpu, customVram, setCustomVram } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredGpus = GPU_LIST.filter((gpu) =>
    gpu.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 20);

  useEffect(() => {
    if (selectedGpu) {
      setSelectedGpu(selectedGpu);
    }
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-blue-400" />
        Select GPU
      </h2>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search GPU..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {isOpen && searchTerm && (
          <div className="absolute z-10 w-full mt-2 bg-slate-700 border border-slate-600 rounded-lg max-h-60 overflow-y-auto">
            {filteredGpus.length > 0 ? (
              filteredGpus.map((gpu) => (
                <button
                  key={gpu}
                  onClick={() => {
                    setSelectedGpu(gpu);
                    setSearchTerm(gpu);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-200 hover:bg-slate-600 transition-colors"
                >
                  {gpu}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-slate-400">No GPUs found</div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Selected GPU
          </label>
          <div className="p-3 bg-slate-700 rounded-lg text-white">
            {selectedGpu || "None selected"}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            VRAM Override (GB)
          </label>
          <input
            type="number"
            value={customVram}
            onChange={(e) => setCustomVram(Number(e.target.value))}
            min={1}
            max={192}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { useAppStore } from "../store/appStore";
import { formatNumber, formatBytes } from "../lib/utils";
import { Cpu, Zap, HardDrive, Download, Heart } from "lucide-react";
import type { ModelInfo } from "../types/model";
import { estimateVram } from "../engine/vram";

interface ModelCardProps {
  model: ModelInfo;
  isSelected: boolean;
  onSelect: () => void;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, isSelected, onSelect }) => {
  const vramEstimate = estimateVram(model, undefined, 4096);
  const paramsB = model.parameterCount / 1e9;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl cursor-pointer transition-all ${
        isSelected
          ? "bg-blue-600/20 border-2 border-blue-500"
          : "bg-slate-800 border-2 border-transparent hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{model.name}</h3>
          <p className="text-sm text-slate-400">{model.id}</p>
        </div>
        {paramsB > 0 && (
          <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
            {paramsB.toFixed(1)}B
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-300">
          <HardDrive className="w-4 h-4 text-purple-400" />
          <span>{formatBytes(vramEstimate)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Download className="w-4 h-4 text-green-400" />
          <span>{formatNumber(model.downloads)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Heart className="w-4 h-4 text-red-400" />
          <span>{formatNumber(model.likes)}</span>
        </div>
        {model.contextLength && (
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>{model.contextLength.toLocaleString()} ctx</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const ModelList: React.FC = () => {
  const { models, isLoading, selectedModelId, setSelectedModelId } = useAppStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No models loaded. Click "Search Models" to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={model.id === selectedModelId}
          onSelect={() => setSelectedModelId(model.id === selectedModelId ? null : model.id)}
        />
      ))}
    </div>
  );
};

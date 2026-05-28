import React, { useEffect } from "react";
import { useAppStore } from "./store/appStore";
import { GpuSelector } from "./components/GpuSelector";
import { ModelList } from "./components/ModelList";
import { Search, Cpu, Database } from "lucide-react";

function App() {
  const { searchModels, searchQuery, setSearchQuery, hardware } = useAppStore();

  useEffect(() => {
    searchModels();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Which LLM</h1>
                <p className="text-sm text-slate-400">
                  Find the best LLM for your hardware
                </p>
              </div>
            </div>
            
            {hardware.gpus.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg">
                <Cpu className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-300">
                  {hardware.gpus[0].name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <GpuSelector />
            
            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-purple-400" />
                Search Models
              </h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                
                <button
                  onClick={searchModels}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search Models
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-400" />
                  Available Models
                </h2>
                <span className="text-sm text-slate-400">
                  Click a model to see details
                </span>
              </div>
              
              <ModelList />
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-16 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          <p>WhichLLM Web - Find the best local LLM for your hardware</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

import React from 'react';
import {
  FilePlus2,
  FolderOpen,
  Save,
  RotateCcw,
  RotateCw,
  MousePointer,
  Move,
  PlusCircle,
  Network,
  Anchor,
  Layers,
  Play,
  Maximize2,
  Eye,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface AnalysisToolbarProps {
  activeTool: 'select' | 'move' | 'add_node' | 'add_member' | 'add_support' | 'add_load';
  onSelectTool: (tool: 'select' | 'move' | 'add_node' | 'add_member' | 'add_support' | 'add_load') => void;
  onNewModel: () => void;
  onSaveModel: () => void;
  onRunAnalysis: () => void;
  onResetView?: () => void;
  isAnalyzing?: boolean;
  modelSummaryText?: string;
}

export const AnalysisToolbar: React.FC<AnalysisToolbarProps> = ({
  activeTool,
  onSelectTool,
  onNewModel,
  onSaveModel,
  onRunAnalysis,
  onResetView,
  isAnalyzing = false,
  modelSummaryText = ''
}) => {
  return (
    <div className="bg-[#0f172a] border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-2 select-none shadow-md">
      {/* File & Edit Action Group */}
      <div className="flex items-center gap-1">
        <button
          onClick={onNewModel}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
          title="Model Baru (New Model)"
        >
          <FilePlus2 className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Baru</span>
        </button>

        <button
          onClick={onSaveModel}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 text-xs font-medium"
          title="Simpan Model (Save Model)"
        >
          <Save className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Simpan</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1"></div>

        {/* CAD Interaction Tools */}
        <button
          onClick={() => onSelectTool('select')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'select'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Pilih Objek (Select)"
        >
          <MousePointer className="w-4 h-4" />
          <span className="hidden md:inline">Pilih</span>
        </button>

        <button
          onClick={() => onSelectTool('move')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'move'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Geser / Pan Kanvas"
        >
          <Move className="w-4 h-4" />
          <span className="hidden md:inline">Pan</span>
        </button>

        <button
          onClick={() => onSelectTool('add_node')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'add_node'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tambah Titik Buhul (Add Node)"
        >
          <PlusCircle className="w-4 h-4 text-blue-400" />
          <span className="hidden lg:inline">+ Node</span>
        </button>

        <button
          onClick={() => onSelectTool('add_member')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'add_member'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tambah Elemen Batang (Add Member)"
        >
          <Network className="w-4 h-4 text-indigo-400" />
          <span className="hidden lg:inline">+ Batang</span>
        </button>

        <button
          onClick={() => onSelectTool('add_support')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'add_support'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tambah Tumpuan (Add Support)"
        >
          <Anchor className="w-4 h-4 text-amber-400" />
          <span className="hidden lg:inline">+ Tumpuan</span>
        </button>

        <button
          onClick={() => onSelectTool('add_load')}
          className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            activeTool === 'add_load'
              ? 'bg-cyan-600 text-white shadow ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Tambah Beban Struktural (Add Load)"
        >
          <Layers className="w-4 h-4 text-rose-400" />
          <span className="hidden lg:inline">+ Beban</span>
        </button>
      </div>

      {/* Model status & Run Button */}
      <div className="flex items-center gap-3">
        {modelSummaryText && (
          <span className="text-[11px] font-mono text-slate-400 hidden xl:inline">
            {modelSummaryText}
          </span>
        )}

        {onResetView && (
          <button
            onClick={onResetView}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset Tampilan Kanvas (Fit to Screen)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95 transition"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menghitung...
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Run Analysis
            </>
          )}
        </button>
      </div>
    </div>
  );
};

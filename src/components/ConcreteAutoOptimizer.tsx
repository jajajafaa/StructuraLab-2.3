import React, { useState, useMemo } from 'react';
import {
  AutoOptimizerInput,
  AutoOptimizerOutput,
  OptimizedSectionCandidate,
  OptimizationObjective,
  DeflectionSupportCondition,
  STANDARD_REBARS,
  ConcreteMaterial
} from '../types/concrete';
import { optimizeConcreteSection } from '../services/concreteEngine';
import { ConcreteSectionVisualizer } from './ConcreteSectionVisualizer';
import {
  Sparkles,
  Zap,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  BookmarkCheck,
  Check,
  Info,
  Maximize2,
  Minimize2,
  Award,
  Hammer,
  DollarSign
} from 'lucide-react';

interface ConcreteAutoOptimizerProps {
  initialMu?: number;
  initialVu?: number;
  initialFc?: number;
  initialFy?: number;
  initialFyt?: number;
  onApplyConfiguration: (config: {
    b: number;
    h: number;
    tensionCount: number;
    tensionDia: number;
    layers: number;
    compCount?: number;
    compDia?: number;
    sectionType: 'rectangular_single' | 'rectangular_double';
    Mu: number;
    Vu?: number;
  }) => void;
  onSaveToHistory?: (record: any) => void;
}

export const ConcreteAutoOptimizer: React.FC<ConcreteAutoOptimizerProps> = ({
  initialMu = 260,
  initialVu = 180,
  initialFc = 25,
  initialFy = 400,
  initialFyt = 400,
  onApplyConfiguration,
  onSaveToHistory
}) => {
  // Load & geometry inputs
  const [Mu, setMu] = useState<number>(initialMu);
  const [Vu, setVu] = useState<number>(initialVu);
  const [spanL, setSpanL] = useState<number>(6.0);
  const [supportCondition, setSupportCondition] = useState<DeflectionSupportCondition>('simply_supported');

  // Materials
  const [fc, setFc] = useState<number>(initialFc);
  const [fy, setFy] = useState<number>(initialFy);
  const [fyt, setFyt] = useState<number>(initialFyt);
  const [cover, setCover] = useState<number>(40);
  const [stirrupDia, setStirrupDia] = useState<number>(10);

  // Optimization preferences & constraints
  const [targetObjective, setTargetObjective] = useState<OptimizationObjective>('balanced_cost');
  const [bMin, setBMin] = useState<number>(200);
  const [bMax, setBMax] = useState<number>(450);
  const [hMin, setHMin] = useState<number>(300);
  const [hMax, setHMax] = useState<number>(850);
  const [aspectRatioMin, setAspectRatioMin] = useState<number>(1.2);
  const [aspectRatioMax, setAspectRatioMax] = useState<number>(2.5);
  const [preferredBarDia, setPreferredBarDia] = useState<number>(0); // 0 = all
  const [allowDoubly, setAllowDoubly] = useState<boolean>(true);
  const [showAdvancedConstraints, setShowAdvancedConstraints] = useState<boolean>(false);

  // Selected candidate for deep inspection
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Run the optimizer engine deterministically
  const optimizerResult: AutoOptimizerOutput = useMemo(() => {
    const input: AutoOptimizerInput = {
      Mu: Math.max(10, Mu || 10),
      Vu: Math.max(0, Vu || 0),
      spanLength: Math.max(1, spanL || 6),
      supportCondition,
      material: {
        fc: Math.max(15, fc || 25),
        fy: Math.max(240, fy || 400),
        fyt: Math.max(240, fyt || 400),
        lambda: 1.0,
        Es: 200000
      },
      cover,
      stirrupDiameter: stirrupDia,
      bMin,
      bMax,
      hMin,
      hMax,
      aspectRatioMin,
      aspectRatioMax,
      preferredBarDiameter: preferredBarDia,
      allowDoublyReinforced: allowDoubly,
      targetObjective
    };

    return optimizeConcreteSection(input);
  }, [
    Mu,
    Vu,
    spanL,
    supportCondition,
    fc,
    fy,
    fyt,
    cover,
    stirrupDia,
    bMin,
    bMax,
    hMin,
    hMax,
    aspectRatioMin,
    aspectRatioMax,
    preferredBarDia,
    allowDoubly,
    targetObjective
  ]);

  // Determine currently active candidate
  const activeCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = optimizerResult.allCandidates.find(c => c.id === selectedCandidateId);
      if (found) return found;
    }
    return optimizerResult.bestOverall;
  }, [selectedCandidateId, optimizerResult]);

  const handleApply = (candidate: OptimizedSectionCandidate) => {
    onApplyConfiguration({
      b: candidate.b,
      h: candidate.h,
      tensionCount: candidate.tensionCount,
      tensionDia: candidate.tensionDia,
      layers: candidate.layers,
      compCount: candidate.compressionCount,
      compDia: candidate.compressionDia,
      sectionType: candidate.reinforcementType === 'Doubly Reinforced' ? 'rectangular_double' : 'rectangular_single',
      Mu,
      Vu
    });
    setAppliedFeedback(true);
    setTimeout(() => setAppliedFeedback(false), 2200);
  };

  const handleSave = (candidate: OptimizedSectionCandidate) => {
    if (onSaveToHistory) {
      onSaveToHistory({
        title: `Auto-Optimizer: Balok ${candidate.b}×${candidate.h} mm (${candidate.tensionBarSummary})`,
        category: 'concrete_design',
        subType: 'auto_optimizer',
        standard: 'SNI 2847:2013',
        summary: `Mu = ${Mu} kN.m, φMn = ${candidate.phiMn} kN.m, ρ = ${(candidate.rho * 100).toFixed(2)}%, Estimasi Biaya = Rp ${candidate.estimatedCostIndex.toLocaleString('id-ID')}/m`,
        status: 'optimized',
        inputData: { Mu, Vu, spanL, fc, fy, targetObjective },
        resultData: candidate
      });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/60 border border-indigo-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> SNI 2847:2013 Automated Sizing Engine
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Auto-Optimizer Dimensi & Rasio Tulangan Balok
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Mengeksplorasi ribuan kombinasi dimensi penampang (<code className="text-cyan-300 font-mono">b × h</code>) dan konfigurasi tulangan (<code className="text-cyan-300 font-mono">n D db</code>). Menjamin batas daktilitas lentur (<code className="text-indigo-300 font-mono">ε_t ≥ 0.005</code>), rasio tulangan ekonomis (<code className="text-indigo-300 font-mono">0.35 s/d 0.50 ρ_b</code>), batas lendutan SNI (<code className="text-emerald-300 font-mono">h ≥ h_min</code>), dan keamanan geser diagonal (<code className="text-amber-300 font-mono">Vs ≤ Vs_maks</code>).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start md:self-auto shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Kandidat Teruji</span>
              <span className="text-sm font-bold text-cyan-400 font-mono">
                {optimizerResult.totalCompliant} <span className="text-slate-500 font-normal">/ {optimizerResult.totalEvaluated} opsi</span>
              </span>
            </div>
          </div>
        </div>

        {/* Objective Selector Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Pilih Sasaran Optimasi Desain (Optimization Objective):
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => { setTargetObjective('balanced_cost'); setSelectedCandidateId(null); }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                targetObjective === 'balanced_cost'
                  ? 'bg-cyan-500/15 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${targetObjective === 'balanced_cost' ? 'text-cyan-300' : 'text-slate-200'}`}>
                  1. Paling Ekonomis
                </span>
                <DollarSign className={`w-4 h-4 ${targetObjective === 'balanced_cost' ? 'text-cyan-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Kombinasi biaya beton + tulangan + bekisting paling murah. Rasio ρ seimbang (~0.45 ρb).
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetObjective('min_concrete'); setSelectedCandidateId(null); }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                targetObjective === 'min_concrete'
                  ? 'bg-indigo-500/15 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${targetObjective === 'min_concrete' ? 'text-indigo-300' : 'text-slate-200'}`}>
                  2. Penampang Ramping
                </span>
                <Minimize2 className={`w-4 h-4 ${targetObjective === 'min_concrete' ? 'text-indigo-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Volume beton minimum (m³/m). Mengurangi beban mati struktur dan beban pondasi gedung.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetObjective('min_height'); setSelectedCandidateId(null); }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                targetObjective === 'min_height'
                  ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${targetObjective === 'min_height' ? 'text-amber-300' : 'text-slate-200'}`}>
                  3. Tinggi Minimum
                </span>
                <TrendingDown className={`w-4 h-4 ${targetObjective === 'min_height' ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Penampang dangkal untuk ruang plafon maksimal atau batasan arsitektur lantai gedung.
              </p>
            </button>

            <button
              type="button"
              onClick={() => { setTargetObjective('constructability'); setSelectedCandidateId(null); }}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                targetObjective === 'constructability'
                  ? 'bg-emerald-500/15 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${targetObjective === 'constructability' ? 'text-emerald-300' : 'text-slate-200'}`}>
                  4. Praktis Lapangan
                </span>
                <Hammer className={`w-4 h-4 ${targetObjective === 'constructability' ? 'text-emerald-400' : 'text-slate-600'}`} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                1 lapis tulangan, spasi antar batang lega (&gt;35mm), mudah dipadatkan vibrator.
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left inputs & Right spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Load & Constraint Inputs */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Beban & Parameter Struktur
            </h3>
            <span className="font-mono text-[10px] text-slate-400">SNI 2847:2013</span>
          </div>

          {/* Primary Loads */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <span className="font-semibold text-slate-300 block">Beban Rencana Terfaktor (Ultimate Loads)</span>
            <div>
              <label className="text-slate-400 block mb-1">Momen Lentur Terfaktor Mu (kN.m)</label>
              <input
                type="number"
                value={Mu}
                onChange={e => setMu(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white font-bold text-sm"
                min="10"
                step="any"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Gaya Geser Terfaktor Vu (kN) (Opsional)</label>
              <input
                type="number"
                value={Vu}
                onChange={e => setVu(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-white font-bold text-sm"
                min="0"
                step="any"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Memastikan batas kegagalan geser diagonal beton (Vs ≤ 0.66√f'c bw d).
              </span>
            </div>
          </div>

          {/* Deflection & Span Parameters */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <span className="font-semibold text-slate-300 block">Kontrol Bentang & Lendutan SNI Tabel 9.5(a)</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">Panjang Bentang L (m)</label>
                <input
                  type="number"
                  value={spanL}
                  onChange={e => setSpanL(parseFloat(e.target.value.replace(',', '.')) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  min="1"
                  step="0.5"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tebal Min. h_min</label>
                <div className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-400 font-mono font-bold">
                  {optimizerResult.bestOverall.hMinDeflection} mm
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Kondisi Tumpuan Lendutan</label>
              <select
                value={supportCondition}
                onChange={e => setSupportCondition(e.target.value as DeflectionSupportCondition)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
              >
                <option value="simply_supported">Tumpuan Sederhana (L / 16)</option>
                <option value="one_end_continuous">Satu Ujung Menerus (L / 18.5)</option>
                <option value="both_ends_continuous">Kedua Ujung Menerus (L / 21)</option>
                <option value="cantilever">Kantilever (L / 8)</option>
              </select>
            </div>
          </div>

          {/* Material Strengths */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
            <span className="font-semibold text-slate-300 block">Karakteristik Material</span>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-slate-400 block mb-1">Beton f'c (MPa)</label>
                <input
                  type="number"
                  value={fc}
                  onChange={e => setFc(parseFloat(e.target.value.replace(',', '.')) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  min="15"
                  max="60"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Baja Lentur fy (MPa)</label>
                <input
                  type="number"
                  value={fy}
                  onChange={e => setFy(parseFloat(e.target.value.replace(',', '.')) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                  min="240"
                  max="500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-slate-400 block mb-1">Selimut Beton (mm)</label>
                <input
                  type="number"
                  value={cover}
                  onChange={e => setCover(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                  min="20"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Sengkang (mm)</label>
                <select
                  value={stirrupDia}
                  onChange={e => setStirrupDia(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value={10}>D10</option>
                  <option value={12}>D12</option>
                  <option value={13}>D13</option>
                </select>
              </div>
            </div>
          </div>

          {/* Collapsible Advanced Constraints */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowAdvancedConstraints(!showAdvancedConstraints)}
              className="w-full p-3 flex items-center justify-between text-slate-300 font-semibold hover:bg-slate-850 transition"
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Batasan Geometri & Preferensi Tulangan
              </span>
              <span className="text-[10px] text-cyan-400">{showAdvancedConstraints ? 'Sembunyikan' : 'Atur'}</span>
            </button>

            {showAdvancedConstraints && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/80">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1">Lebar Min. b (mm)</label>
                    <input
                      type="number"
                      value={bMin}
                      onChange={e => setBMin(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      step="50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Lebar Maks. b (mm)</label>
                    <input
                      type="number"
                      value={bMax}
                      onChange={e => setBMax(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      step="50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1">Tinggi Maks. h (mm)</label>
                    <input
                      type="number"
                      value={hMax}
                      onChange={e => setHMax(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                      step="50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Preferensi Batang</label>
                    <select
                      value={preferredBarDia}
                      onChange={e => setPreferredBarDia(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    >
                      <option value={0}>Auto (Cari Semua)</option>
                      {STANDARD_REBARS.filter(r => r.diameter >= 16).map(r => (
                        <option key={r.diameter} value={r.diameter}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={allowDoubly}
                      onChange={e => setAllowDoubly(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span>Izinkan Tulangan Rangkap bila penampang terbatas</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info callout */}
          <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 flex items-start gap-2.5 text-[11px] text-indigo-300">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p>
              Target rasio tulangan SNI direkomendasikan pada <strong className="text-white">ρ = 0.35 s/d 0.50 ρb</strong> untuk menjamin daktilitas lentur tinggi dengan perilaku keruntuhan tarik bertahap (under-reinforced).
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Best Archetype Spotlight & Deep Visualizer */}
        <div className="lg:col-span-8 space-y-6">
          {/* TOP CARDS: The 4 Archetype Suggestions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Best Overall / Balanced Cost */}
            <div
              onClick={() => setSelectedCandidateId(optimizerResult.archetypes.balancedCost.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeCandidate.id === optimizerResult.archetypes.balancedCost.id
                  ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  <Award className="w-3 h-3" /> PALING EKONOMIS
                </span>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  Rp {optimizerResult.archetypes.balancedCost.estimatedCostIndex.toLocaleString('id-ID')}/m
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-lg font-extrabold text-white">
                  {optimizerResult.archetypes.balancedCost.b} × {optimizerResult.archetypes.balancedCost.h} mm
                </h4>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {optimizerResult.archetypes.balancedCost.tensionBarSummary}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>φMn = {optimizerResult.archetypes.balancedCost.phiMn} kN.m</span>
                <span>ρ = {(optimizerResult.archetypes.balancedCost.rho * 100).toFixed(2)}% ({Math.round(optimizerResult.archetypes.balancedCost.rhoRatioToRhoB * 100)}% ρb)</span>
                <span>{optimizerResult.archetypes.balancedCost.layers} Lapis</span>
              </div>
            </div>

            {/* 2. Minimum Concrete Volume */}
            <div
              onClick={() => setSelectedCandidateId(optimizerResult.archetypes.minConcrete.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeCandidate.id === optimizerResult.archetypes.minConcrete.id
                  ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Minimize2 className="w-3 h-3" /> PENAMPANG RAMPING
                </span>
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {optimizerResult.archetypes.minConcrete.concreteVolumePerMeter} m³/m
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-lg font-extrabold text-white">
                  {optimizerResult.archetypes.minConcrete.b} × {optimizerResult.archetypes.minConcrete.h} mm
                </h4>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {optimizerResult.archetypes.minConcrete.tensionBarSummary}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Berat Baja: {optimizerResult.archetypes.minConcrete.steelWeightPerMeter} kg/m</span>
                <span>φMn = {optimizerResult.archetypes.minConcrete.phiMn} kN.m</span>
                <span>h/b = {optimizerResult.archetypes.minConcrete.aspectRatio}</span>
              </div>
            </div>

            {/* 3. Minimum Height */}
            <div
              onClick={() => setSelectedCandidateId(optimizerResult.archetypes.minHeight.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeCandidate.id === optimizerResult.archetypes.minHeight.id
                  ? 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <TrendingDown className="w-3 h-3" /> TINGGI MINIMUM
                </span>
                <span className="font-mono text-xs font-bold text-amber-300">
                  h = {optimizerResult.archetypes.minHeight.h} mm
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-lg font-extrabold text-white">
                  {optimizerResult.archetypes.minHeight.b} × {optimizerResult.archetypes.minHeight.h} mm
                </h4>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {optimizerResult.archetypes.minHeight.tensionBarSummary}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{optimizerResult.archetypes.minHeight.reinforcementType}</span>
                <span>φMn = {optimizerResult.archetypes.minHeight.phiMn} kN.m</span>
                <span>{optimizerResult.archetypes.minHeight.layers} Lapis</span>
              </div>
            </div>

            {/* 4. Constructability / Praktis Lapangan */}
            <div
              onClick={() => setSelectedCandidateId(optimizerResult.archetypes.constructability.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeCandidate.id === optimizerResult.archetypes.constructability.id
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <Hammer className="w-3 h-3" /> PRAKTIS LAPANGAN
                </span>
                <span className="font-mono text-xs font-bold text-emerald-300">
                  Skor: {optimizerResult.archetypes.constructability.constructabilityScore}/100
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <h4 className="text-lg font-extrabold text-white">
                  {optimizerResult.archetypes.constructability.b} × {optimizerResult.archetypes.constructability.h} mm
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-300">
                  {optimizerResult.archetypes.constructability.tensionBarSummary}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Spasi Bersih: {optimizerResult.archetypes.constructability.clearSpacing} mm</span>
                <span>1 Lapis Tulangan</span>
                <span>Mudah Dicor</span>
              </div>
            </div>
          </div>

          {/* ACTIVE CANDIDATE DEEP DIVE & VISUALIZER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                    Detail Penampang Terpilih: {activeCandidate.b} × {activeCandidate.h} mm
                  </h3>
                  {activeCandidate.archetypeBadge && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      {activeCandidate.archetypeBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tulangan Tarik: <strong className="text-cyan-300">{activeCandidate.tensionBarSummary}</strong> (As = {activeCandidate.As} mm²) | Sengkang Rekomendasi: <strong className="text-amber-300">{activeCandidate.suggestedStirrup}</strong>
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApply(activeCandidate)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition active:scale-95"
                >
                  {appliedFeedback ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Diterapkan ke Desain!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Terapkan ke Modul Utama
                    </>
                  )}
                </button>

                {onSaveToHistory && (
                  <button
                    type="button"
                    onClick={() => handleSave(activeCandidate)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                    title="Simpan ke Riwayat Perhitungan"
                  >
                    {savedFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkCheck className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Visualizer & Metrics Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-6 flex justify-center">
                <ConcreteSectionVisualizer
                  sectionType={activeCandidate.reinforcementType === 'Doubly Reinforced' ? 'rectangular_double' : 'rectangular_single'}
                  b={activeCandidate.b}
                  h={activeCandidate.h}
                  d={activeCandidate.d}
                  tensionCount={activeCandidate.tensionCount}
                  tensionDia={activeCandidate.tensionDia}
                  layers={activeCandidate.layers}
                  compressionCount={activeCandidate.compressionCount || 0}
                  compressionDia={activeCandidate.compressionDia || 13}
                  dPrime={activeCandidate.dPrime || 60}
                  a={activeCandidate.a}
                  c={activeCandidate.c}
                />
              </div>

              {/* Engineering Metrics Dashboard */}
              <div className="md:col-span-6 space-y-3 text-xs">
                {/* Capacity Status */}
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block">Kapasitas Momen Memenuhi Syarat</span>
                      <span className="text-[11px] opacity-90">
                        φMn = {activeCandidate.phiMn} kN.m ≥ Mu = {Mu} kN.m (Utilitas = {(activeCandidate.capacityRatio * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-cyan-400">
                    φ = {activeCandidate.phi.toFixed(2)}
                  </span>
                </div>

                {/* Key Numbers Grid */}
                <div className="grid grid-cols-2 gap-2.5 font-mono">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Rasio Tulangan ρ</span>
                    <span className="text-base font-bold text-cyan-400">{(activeCandidate.rho * 100).toFixed(3)}%</span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      {Math.round(activeCandidate.rhoRatioToRhoB * 100)}% dari ρb ({optimizerResult.rhoMin.toFixed(4)} s/d {optimizerResult.rhoMaxTension.toFixed(4)})
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Regangan Tarik Baja ε_t</span>
                    <span className="text-base font-bold text-emerald-400">{activeCandidate.eps_t.toFixed(5)}</span>
                    <span className="text-[10px] text-emerald-500/80 block font-sans">
                      Tension-Controlled (Daktail)
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Blok Tekan Whitney (a / c)</span>
                    <span className="text-base font-bold text-amber-400">{activeCandidate.a} / {activeCandidate.c} mm</span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      d = {activeCandidate.d.toFixed(1)} mm
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-sans">Spasi Bersih Antar Batang</span>
                    <span className={`text-base font-bold ${activeCandidate.clearSpacing >= 30 ? 'text-white' : 'text-amber-400'}`}>
                      {activeCandidate.clearSpacing} mm
                    </span>
                    <span className="text-[10px] text-slate-500 block font-sans">
                      {activeCandidate.layers} lapis (min 25 mm)
                    </span>
                  </div>
                </div>

                {/* Shear & Deflection compliance pills */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Kontrol Lendutan SNI Tabel 9.5(a):</span>
                    <span className={`font-semibold ${activeCandidate.isDeflectionCompliant ? 'text-emerald-400' : 'text-amber-400'}`}>
                      h = {activeCandidate.h} mm {activeCandidate.isDeflectionCompliant ? '≥' : '<'} h_min ({activeCandidate.hMinDeflection} mm)
                    </span>
                  </div>
                  {Vu > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Kapasitas Geser Penampang:</span>
                      <span className="font-semibold text-emerald-400">
                        Vs ({activeCandidate.VsRequired} kN) ≤ Vs_maks ({activeCandidate.VsMaxLimit} kN)
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Konsumsi Material per Meter:</span>
                    <span className="font-mono text-cyan-300">
                      Beton {activeCandidate.concreteVolumePerMeter} m³ | Baja {activeCandidate.steelWeightPerMeter} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compliance Badges Bar */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
              {activeCandidate.complianceBadges.map((badge, bIdx) => (
                <span key={bIdx} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {badge}
                </span>
              ))}
              {activeCandidate.warnings.map((warn, wIdx) => (
                <span key={wIdx} className="px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-500/40 text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  {warn}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ALL CANDIDATES COMPARISON TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Tabel Perbandingan Semua Konfigurasi Penampang Terverifikasi ({optimizerResult.allCandidates.length} Opsi)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Seluruh opsi telah lolos verifikasi tahanan momen lentur, batasan regangan tarik daktail SNI 2847:2013, dan batas geser.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Urutan: {targetObjective === 'balanced_cost' ? 'Biaya Terendah' : targetObjective === 'min_concrete' ? 'Volume Beton Terkecil' : targetObjective === 'min_height' ? 'Tinggi Terendah' : 'Kemudahan Pelaksanaan'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800 font-sans">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-mono">
              <tr>
                <th className="py-2.5 px-3">Dimensi (b × h)</th>
                <th className="py-2.5 px-3">Tulangan Tarik</th>
                <th className="py-2.5 px-3">Rasio ρ (ρ/ρb)</th>
                <th className="py-2.5 px-3">Kapasitas φMn</th>
                <th className="py-2.5 px-3">Lendutan</th>
                <th className="py-2.5 px-3">Sengkang</th>
                <th className="py-2.5 px-3">Vol. Beton</th>
                <th className="py-2.5 px-3">Berat Baja</th>
                <th className="py-2.5 px-3">Indeks Biaya</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {optimizerResult.allCandidates.slice(0, 15).map((cand) => {
                const isSelected = activeCandidate.id === cand.id;
                return (
                  <tr
                    key={cand.id}
                    className={`transition hover:bg-slate-850/60 ${isSelected ? 'bg-cyan-950/25 font-semibold text-white' : ''}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-white font-mono">
                        {cand.b} × {cand.h} mm
                      </div>
                      <span className="text-[10px] text-slate-500">h/b = {cand.aspectRatio}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-cyan-300 font-bold">{cand.tensionBarSummary}</div>
                      <span className="text-[10px] text-slate-400">
                        {cand.layers} lapis (spasi {cand.clearSpacing} mm)
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div>{(cand.rho * 100).toFixed(2)}%</div>
                      <span className="text-[10px] text-slate-500">({Math.round(cand.rhoRatioToRhoB * 100)}% ρb)</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-emerald-400 font-bold font-mono">{cand.phiMn} kN.m</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {(cand.capacityRatio * 100).toFixed(0)}% utilitas
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {cand.isDeflectionCompliant ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aman
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400" title="h < h_min lendutan SNI">
                          <AlertTriangle className="w-3.5 h-3.5" /> h &lt; hmin
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {cand.suggestedStirrup}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {cand.concreteVolumePerMeter} m³/m
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {cand.steelWeightPerMeter} kg/m
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                      Rp {cand.estimatedCostIndex.toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidateId(cand.id)}
                          className={`px-2.5 py-1 rounded text-[11px] transition ${
                            isSelected
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApply(cand)}
                          className="px-2.5 py-1 rounded text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition"
                          title="Terapkan konfigurasi ini ke modul perhitungan"
                        >
                          Pilih
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MATHEMATICAL DERIVATION ACCORDION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Tahapan Perhitungan & Batasan Desain SNI 2847:2013
        </h3>
        <div className="space-y-2.5 text-xs divide-y divide-slate-800">
          {optimizerResult.derivationSteps.map((step, idx) => (
            <div key={idx} className="pt-2.5 first:pt-0">
              <span className="font-semibold text-indigo-300">{step.title}</span>
              <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg my-1.5 border border-slate-800">
                <div>Rumus Dasar: {step.formula}</div>
                <div className="text-cyan-400">Substitusi: {step.substitution}</div>
                <div className="text-emerald-400 font-bold">Hasil: {step.result}</div>
              </div>
              <p className="text-[11px] text-slate-400">{step.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

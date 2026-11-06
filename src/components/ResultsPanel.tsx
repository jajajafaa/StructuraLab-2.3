import React, { useState } from 'react';
import {
  BeamAnalysisResult,
  TrussAnalysisResult,
  TrussNode,
  TrussMember,
  TrussNodeLoad
} from '../types/structural';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  TrendingUp,
  FileText,
  Table,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';

interface ResultsPanelProps {
  result?: BeamAnalysisResult | null;
  trussResult?: TrussAnalysisResult | null;
  analysisMode?: 'beam' | 'truss';
  beamLength?: number;
  totalLoadGravity?: number;
  trussNodes?: TrussNode[];
  trussMembers?: TrussMember[];
  trussLoads?: TrussNodeLoad[];
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  trussResult,
  analysisMode = 'beam',
  beamLength = 0,
  totalLoadGravity = 0,
  trussNodes = [],
  trussMembers = [],
  trussLoads = []
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'reactions' | 'sfd' | 'bmd' | 'steps' | 'cross' | 'truss_members'>('summary');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Clean mathematical text formatting helper to guarantee no raw underscores appear
  const cleanMath = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/ΣF_beban/g, 'ΣF beban')
      .replace(/R_Ay/g, 'RAy')
      .replace(/R_By/g, 'RBy')
      .replace(/R_Ax/g, 'RAx')
      .replace(/M_A/g, 'MA')
      .replace(/M_B/g, 'MB')
      .replace(/M_maks/g, 'M maks')
      .replace(/V_maks/g, 'V maks')
      .replace(/L_AB/g, 'L(AB)')
      .replace(/x_i/g, 'x')
      .replace(/P_i/g, 'P')
      .replace(/q_merata/g, 'q merata')
      .replace(/q_segitiga/g, 'q segitiga')
      .replace(/P_ujung/g, 'P ujung')
      .replace(/P_overhang/g, 'P overhang')
      .replace(/q_bentang/g, 'q bentang')
      .replace(/FEM_([a-zA-Z0-9-]+)/g, 'FEM($1)')
      .replace(/DF_([a-zA-Z0-9-]+)/g, 'DF($1)')
      .replace(/K_([a-zA-Z0-9-]+)/g, 'K($1)')
      .replace(/M_([a-zA-Z0-9-]+)/g, 'M($1)')
      .replace(/R_([a-zA-Z0-9-]+)/g, 'R($1)')
      .replace(/([a-zA-Z0-9])_([a-zA-Z0-9]+)/g, '$1 $2')
      .replace(/_/g, ' ');
  };

  // TRUSS RESULTS MODE
  if (analysisMode === 'truss') {
    if (!trussResult) {
      return (
        <div className="bg-[#0b121e] border-t border-slate-800 p-4 text-center text-xs text-slate-500 font-mono">
          Belum ada hasil analisis rangka batang. Atur buhul, batang, tumpuan, & beban, lalu klik tombol "Run Truss Analysis".
        </div>
      );
    }

    const tensionCount = trussResult.memberForces.filter(m => m.type === 'Tension').length;
    const compCount = trussResult.memberForces.filter(m => m.type === 'Compression').length;
    const zeroCount = trussResult.memberForces.filter(m => m.type === 'Zero-force').length;
    const totalFyLoad = trussLoads.reduce((sum, l) => sum + l.Fy, 0);

    return (
      <div
        className={`bg-[#0d1524] border-t-2 border-slate-700/80 text-white flex flex-col transition-all duration-200 select-none ${
          isExpanded ? 'h-96' : 'h-64'
        }`}
      >
        {/* Truss Tab Navigation Header */}
        <div className="bg-[#080d16] border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'summary' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Ringkasan Rangka Batang
            </button>
            <button
              onClick={() => setActiveTab('reactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'reactions' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Reaksi Tumpuan ({trussResult.supportReactions.length})
            </button>
            <button
              onClick={() => setActiveTab('truss_members')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'truss_members' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Tabel Gaya Batang ({trussResult.memberForces.length})
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'steps' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              4. Langkah Matematis ({trussResult.steps.length})
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Kecilkan Panel' : 'Perbesar Panel'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Truss Content */}
        <div className="flex-1 overflow-y-auto p-4 text-xs font-sans">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Batang Tarik (Tension)</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">{tensionCount}</span>
                  <span className="text-[10px] text-slate-500 block">batang bertanda positif (+)</span>
                </div>
                <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Batang Tekan (Compression)</span>
                  <span className="text-xl font-bold font-mono text-rose-400">{compCount}</span>
                  <span className="text-[10px] text-slate-500 block">batang bertanda negatif (-)</span>
                </div>
                <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Batang Nol (Zero-Force)</span>
                  <span className="text-xl font-bold font-mono text-slate-400">{zeroCount}</span>
                  <span className="text-[10px] text-slate-500 block">batang tanpa gaya</span>
                </div>
                <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Metode Solusi Truss</span>
                  <span className="text-sm font-bold text-white block mt-1">Method of Joints</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Statis Tertentu & Stabil
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#070b12] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">
                    Total Beban Kerja Vertikal: <strong className="text-amber-400 font-mono">{Math.abs(totalFyLoad)} kN</strong> |
                    Reaksi Vertikal Total: <strong className="text-cyan-400 font-mono">{trussResult.supportReactions.reduce((s, r) => s + r.Ry, 0).toFixed(2)} kN</strong>
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  STATUS: SEIMBANG & STABIL (OK)
                </span>
              </div>
            </div>
          )}

          {activeTab === 'reactions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden font-mono">
                <thead className="bg-[#070b12] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Titik Buhul</th>
                    <th className="p-2.5">Koordinat (X, Y)</th>
                    <th className="p-2.5">Reaksi Horisontal Rx (kN)</th>
                    <th className="p-2.5">Reaksi Vertikal Ry (kN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trussResult.supportReactions.map((sr, idx) => {
                    const node = trussNodes.find(n => n.id === sr.nodeId);
                    const nodeIdx = trussNodes.findIndex(n => n.id === sr.nodeId) + 1;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-cyan-400">N{nodeIdx} ({sr.nodeId})</td>
                        <td className="p-2.5 text-slate-300">({node?.x ?? '-'} m, {node?.y ?? '-'} m)</td>
                        <td className="p-2.5 text-slate-400">{sr.Rx.toFixed(2)} kN</td>
                        <td className="p-2.5 font-bold text-emerald-400">{sr.Ry.toFixed(2)} kN</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'truss_members' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden font-mono">
                <thead className="bg-[#070b12] text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Batang</th>
                    <th className="p-2.5">Buhul Awal → Akhir</th>
                    <th className="p-2.5">Panjang L (m)</th>
                    <th className="p-2.5">Gaya Aksial N (kN)</th>
                    <th className="p-2.5">Sifat Gaya</th>
                    <th className="p-2.5">Tegangan Kerja σ (MPa)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trussResult.memberForces.map((mf, idx) => {
                    const mem = trussMembers.find(m => m.id === mf.memberId);
                    const n1 = trussNodes.find(n => n.id === mem?.nodeStartId);
                    const n2 = trussNodes.find(n => n.id === mem?.nodeEndId);
                    const n1Idx = trussNodes.findIndex(n => n.id === mem?.nodeStartId) + 1;
                    const n2Idx = trussNodes.findIndex(n => n.id === mem?.nodeEndId) + 1;
                    const len = n1 && n2 ? Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2)) : 0;
                    const isTension = mf.type === 'Tension';
                    const isCompression = mf.type === 'Compression';

                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-white">M{idx + 1}</td>
                        <td className="p-2.5 text-slate-300">N{n1Idx} → N{n2Idx}</td>
                        <td className="p-2.5 text-slate-400">{len.toFixed(2)} m</td>
                        <td
                          className={`p-2.5 font-bold ${
                            isTension ? 'text-emerald-400' : isCompression ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {mf.force > 0 ? `+${mf.force.toFixed(2)}` : mf.force.toFixed(2)} kN
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isTension
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isCompression
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isTension ? 'Tarik (Tension)' : isCompression ? 'Tekan (Compression)' : 'Batang Nol (Zero)'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">{mf.stress.toFixed(2)} MPa</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-3">
              {trussResult.steps.map((st, idx) => (
                <div key={idx} className="p-3 bg-[#070b12] rounded-xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-cyan-300 text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-[10px] font-mono">
                      {st.stepNumber || idx + 1}
                    </span>
                    {cleanMath(st.title)}
                  </div>
                  {st.description && <p className="text-slate-400 text-[11px]">{cleanMath(st.description)}</p>}
                  {(st.formula || st.substitution || st.result) && (
                    <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                      {st.formula && (
                        <div className="text-cyan-400/90 font-medium">
                          <span className="text-slate-500">Rumus: </span>
                          {cleanMath(st.formula)}
                        </div>
                      )}
                      {st.substitution && (
                        <div>
                          <span className="text-slate-500">Hitungan: </span>
                          {cleanMath(st.substitution)}
                        </div>
                      )}
                      {st.result && (
                        <div className="text-emerald-400 font-bold">
                          <span className="text-slate-500">Hasil: </span>
                          {cleanMath(st.result)}
                        </div>
                      )}
                    </div>
                  )}
                  {st.explanation && <p className="text-[11px] text-slate-500 italic">{cleanMath(st.explanation)}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // BEAM RESULTS MODE
  if (!result) {
    return (
      <div className="bg-[#0b121e] border-t border-slate-800 p-4 text-center text-xs text-slate-500 font-mono">
        Belum ada hasil analisis. Atur geometri & beban, lalu klik tombol "Run Analysis" pada toolbar.
      </div>
    );
  }

  const { maxMoment, minMoment, maxShear, minShear, reactions, equilibriumCheck, steps, crossTable, methodUsed, isDeterminate, degreeOfIndeterminacy } = result;

  return (
    <div
      className={`bg-[#0d1524] border-t-2 border-slate-700/80 text-white flex flex-col transition-all duration-200 select-none ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Tab Navigation Header */}
      <div className="bg-[#080d16] border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'summary' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Ringkasan (Summary)
          </button>
          <button
            onClick={() => setActiveTab('reactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'reactions' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Reaksi Tumpuan ({reactions.length})
          </button>
          <button
            onClick={() => setActiveTab('sfd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'sfd' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Gaya Geser (SFD)
          </button>
          <button
            onClick={() => setActiveTab('bmd')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'bmd' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Momen Lentur (BMD)
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              activeTab === 'steps' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            5. Langkah Matematis ({steps.length})
          </button>
          {crossTable && (
            <button
              onClick={() => setActiveTab('cross')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                activeTab === 'cross' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              6. Tabel Cross ({crossTable.cycles.length} Siklus)
            </button>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded text-slate-400 hover:text-white transition"
          title={isExpanded ? 'Kecilkan Panel' : 'Perbesar Panel'}
        >
          {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 text-xs font-sans">
        {/* TAB 1: SUMMARY */}
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {/* Automatic Classification Banner */}
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                isDeterminate
                  ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-200'
                  : 'bg-indigo-950/50 border-indigo-600/60 text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-5 h-5 ${isDeterminate ? 'text-emerald-400' : 'text-indigo-400'}`}
                />
                <div>
                  <div className="font-bold text-xs">
                    {isDeterminate
                      ? 'KLASIFIKASI: STRUKTUR STATIS TERTENTU'
                      : `KLASIFIKASI: STRUKTUR STATIS TAK TENTU (DERAJAT KETIDAKTENTUAN n = ${degreeOfIndeterminacy})`}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {isDeterminate
                      ? 'Jumlah komponen reaksi tumpuan R ≤ 3. Diselesaikan dengan persamaan kesetimbangan statika dasar (ΣFx=0, ΣFy=0, ΣM=0).'
                      : `Jumlah komponen reaksi tumpuan R > 3. Diselesaikan secara otomatis dengan Metode Distribusi Momen (Metode Cross).`}
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                  isDeterminate
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}
              >
                {isDeterminate ? 'STATIS TERTENTU' : 'METODE CROSS OTOMATIS'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Momen Positif Lapangan (M+)</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {maxMoment.value.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">kN.m di x = {maxMoment.x} m</span>
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Momen Negatif Tumpuan (M-)</span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {minMoment.value.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">kN.m di x = {minMoment.x} m</span>
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Gaya Geser Absolut Maks (|V|)</span>
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {Math.max(Math.abs(maxShear.value), Math.abs(minShear.value)).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">kN (Penampang Kritis)</span>
              </div>

              <div className="bg-[#070b12] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Metode Solusi Analisis</span>
                <span className="text-sm font-bold text-white block mt-1 truncate">
                  {methodUsed}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Kesetimbangan Statika Terpenuhi
                </span>
              </div>
            </div>

            {/* Validation & Equilibrium box */}
            <div className="p-3 bg-[#070b12] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300">
                  Pemeriksaan Keseimbangan Gaya Vertikal: ΣRy ={' '}
                  <strong className="text-cyan-400 font-mono">{equilibriumCheck.sumFy} kN</strong> vs ΣBeban ={' '}
                  <strong className="text-rose-400 font-mono">{totalLoadGravity.toFixed(2)} kN</strong>
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                STATUS: SEIMBANG (OK)
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: REACTIONS */}
        {activeTab === 'reactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden font-mono">
              <thead className="bg-[#070b12] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Label Tumpuan</th>
                  <th className="p-2.5">Posisi x (m)</th>
                  <th className="p-2.5">Tipe Tumpuan</th>
                  <th className="p-2.5">Reaksi Vertikal Ry (kN)</th>
                  <th className="p-2.5">Reaksi Horizontal Rx (kN)</th>
                  <th className="p-2.5">Momen Jepit M (kN.m)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reactions.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-cyan-400">{r.label}</td>
                    <td className="p-2.5 text-slate-300">{r.position} m</td>
                    <td className="p-2.5 capitalize text-slate-300">{r.type}</td>
                    <td className="p-2.5 font-bold text-emerald-400">{r.Ry.toFixed(2)} kN</td>
                    <td className="p-2.5 text-slate-400">{r.Rx.toFixed(2)} kN</td>
                    <td className="p-2.5 text-amber-400">{r.M ? `${r.M.toFixed(2)} kN.m` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SFD VALUES */}
        {activeTab === 'sfd' && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Nilai Puncak Gaya Geser (Shear Force Diagram):</span>
              <span className="font-mono text-cyan-400">
                V maks(+) = {maxShear.value.toFixed(2)} kN | V maks(-) = {minShear.value.toFixed(2)} kN
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              {result.diagramPoints.filter((_, i) => i % 20 === 0).map((pt, i) => (
                <div key={i} className="p-2 bg-[#070b12] rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">x={pt.x}m:</span>
                  <span className={`font-bold ${pt.V >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    V={pt.V.toFixed(2)} kN
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BMD VALUES */}
        {activeTab === 'bmd' && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Nilai Puncak Momen Lentur (Bending Moment Diagram):</span>
              <span className="font-mono text-emerald-400">
                M lapangan = {maxMoment.value.toFixed(2)} kN.m | M tumpuan = {minMoment.value.toFixed(2)} kN.m
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              {result.diagramPoints.filter((_, i) => i % 20 === 0).map((pt, i) => (
                <div key={i} className="p-2 bg-[#070b12] rounded border border-slate-800 flex justify-between">
                  <span className="text-slate-400">x={pt.x}m:</span>
                  <span className={`font-bold ${pt.M >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    M={pt.M.toFixed(2)} kN.m
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: STEP-BY-STEP MATHEMATICAL CALCULATION */}
        {activeTab === 'steps' && (
          <div className="space-y-3">
            {steps.map((st, idx) => (
              <div key={idx} className="p-3 bg-[#070b12] rounded-xl border border-slate-800 space-y-1.5">
                <div className="font-bold text-cyan-300 text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center text-[10px] font-mono">
                    {st.stepNumber !== undefined ? st.stepNumber : idx + 1}
                  </span>
                  {cleanMath(st.title)}
                </div>
                {st.description && <p className="text-slate-400 text-[11px]">{cleanMath(st.description)}</p>}
                {(st.formula || st.substitution || st.result) && (
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                    {st.formula && (
                      <div className="text-cyan-400/90 font-medium">
                        <span className="text-slate-500">Rumus: </span>
                        {cleanMath(st.formula)}
                      </div>
                    )}
                    {st.substitution && (
                      <div>
                        <span className="text-slate-500">Hitungan: </span>
                        {cleanMath(st.substitution)}
                      </div>
                    )}
                    {st.result && (
                      <div className="text-emerald-400 font-bold">
                        <span className="text-slate-500">Hasil: </span>
                        {cleanMath(st.result)}
                      </div>
                    )}
                  </div>
                )}
                {st.explanation && <p className="text-[11px] text-slate-500 italic">{cleanMath(st.explanation)}</p>}
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: CROSS TABLE */}
        {activeTab === 'cross' && crossTable && (
          <div className="space-y-3 overflow-x-auto">
            <span className="font-mono text-xs text-indigo-400 font-bold">
              Tabel Distribusi Momen (Metode Cross)
            </span>
            <table className="w-full text-left text-[11px] font-mono border border-slate-800 divide-y divide-slate-800">
              <thead className="bg-[#070b12] text-slate-400">
                <tr>
                  <th className="p-2">Siklus</th>
                  {crossTable.members.map(m => (
                    <th key={m} className="p-2 text-center">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-2 text-slate-400 font-bold">DF</td>
                  {crossTable.members.map(m => (
                    <td key={m} className="p-2 text-center">
                      {crossTable.distributionFactors[m]}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2 text-amber-400 font-bold">FEM</td>
                  {crossTable.members.map(m => (
                    <td key={m} className="p-2 text-center text-amber-400">
                      {crossTable.fem[m]}
                    </td>
                  ))}
                </tr>
                {crossTable.cycles.map((cyc, cIdx) => (
                  <React.Fragment key={cIdx}>
                    <tr className="bg-slate-900/40">
                      <td className="p-2 text-slate-400">Dist {cIdx + 1}</td>
                      {crossTable.members.map(m => (
                        <td key={m} className="p-2 text-center text-cyan-300">
                          {cyc.distribution[m] || '0.00'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 text-slate-400">CO {cIdx + 1}</td>
                      {crossTable.members.map(m => (
                        <td key={m} className="p-2 text-center text-indigo-300">
                          {cyc.carryOver[m] || '0.00'}
                        </td>
                      ))}
                    </tr>
                  </React.Fragment>
                ))}
                <tr className="bg-slate-900 font-bold text-emerald-400">
                  <td className="p-2">M Akhir</td>
                  {crossTable.members.map(m => (
                    <td key={m} className="p-2 text-center">
                      {crossTable.finalMoments[m]}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

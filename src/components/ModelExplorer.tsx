import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Network,
  Anchor,
  Layers,
  Component,
  Boxes,
  Sliders,
  Trash2,
  Plus,
  ArrowDown,
  ArrowUp,
  RotateCw
} from 'lucide-react';
import { Support, StructuralLoad, SupportType, LoadType } from '../types/structural';

interface ModelExplorerProps {
  beamLength: number;
  onUpdateBeamLength: (len: number) => void;
  supports: Support[];
  onUpdateSupports: (supports: Support[]) => void;
  loads: StructuralLoad[];
  onUpdateLoads: (loads: StructuralLoad[]) => void;
  selectedId: string | null;
  onSelectObject: (type: 'support' | 'load' | 'beam' | null, id: string | null) => void;
  materialE: number;
  onUpdateMaterialE: (e: number) => void;
  sectionI: number;
  onUpdateSectionI: (i: number) => void;
}

export const ModelExplorer: React.FC<ModelExplorerProps> = ({
  beamLength,
  onUpdateBeamLength,
  supports,
  onUpdateSupports,
  loads,
  onUpdateLoads,
  selectedId,
  onSelectObject,
  materialE,
  onUpdateMaterialE,
  sectionI,
  onUpdateSectionI
}) => {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    geometry: true,
    supports: true,
    loads: true,
    materials: false,
    sections: false
  });

  // Helper to parse numbers supporting both comma (,) and dot (.)
  const parseNum = (val: string | number, fallback = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    const clean = String(val).replace(',', '.').trim();
    if (clean === '') return fallback;
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  };

  // Local string state for beamLength to allow typing decimals like 16.9 or 16,9 freely
  const [beamLengthStr, setBeamLengthStr] = useState<string>(beamLength > 0 ? String(beamLength) : '');

  React.useEffect(() => {
    setBeamLengthStr(beamLength > 0 ? String(beamLength) : '');
  }, [beamLength]);

  // Inline Add Support State (string format allows typing arbitrary decimals)
  const [showAddSupport, setShowAddSupport] = useState(false);
  const [newSuppType, setNewSuppType] = useState<SupportType>('roller');
  const [newSuppPos, setNewSuppPos] = useState<string>('0');
  const [newSuppLabel, setNewSuppLabel] = useState<string>('');

  // Inline Add Load State (string format allows typing arbitrary decimals)
  const [showAddLoad, setShowAddLoad] = useState(false);
  const [newLoadType, setNewLoadType] = useState<LoadType>('point');
  const [newLoadMag, setNewLoadMag] = useState<string>('20');
  const [newLoadMagEnd, setNewLoadMagEnd] = useState<string>('0');
  const [newLoadStartPos, setNewLoadStartPos] = useState<string>('0');
  const [newLoadEndPos, setNewLoadEndPos] = useState<string>(beamLength > 0 ? String(beamLength) : '6');
  const [newLoadDir, setNewLoadDir] = useState<'down' | 'up' | 'cw' | 'ccw'>('down');
  const [newLoadLabel, setNewLoadLabel] = useState<string>('');

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddSupport = (e: React.FormEvent) => {
    e.preventDefault();
    const nextChar = String.fromCharCode(65 + supports.length);
    const label = newSuppLabel.trim() || `Tumpuan ${nextChar}`;
    const newSupport: Support = {
      id: 'supp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      nodeId: nextChar,
      type: newSuppType,
      position: parseNum(newSuppPos, 0),
      label
    };
    onUpdateSupports([...supports, newSupport]);
    setNewSuppLabel('');
    setShowAddSupport(false);
  };

  const handleAddLoad = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLoadLabel.trim() || (newLoadType === 'point' ? `P${loads.length + 1}` : newLoadType === 'distributed' ? `q${loads.length + 1}` : `Beban ${loads.length + 1}`);
    const newLoad: StructuralLoad = {
      id: 'load-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      type: newLoadType,
      magnitude: parseNum(newLoadMag, 0),
      magnitudeEnd: (newLoadType === 'triangular' || newLoadType === 'trapezoidal') ? parseNum(newLoadMagEnd, 0) : undefined,
      startPos: parseNum(newLoadStartPos, 0),
      endPos: (newLoadType === 'distributed' || newLoadType === 'triangular' || newLoadType === 'trapezoidal') ? parseNum(newLoadEndPos, beamLength || 6) : undefined,
      direction: newLoadDir,
      label
    };
    onUpdateLoads([...loads, newLoad]);
    setNewLoadLabel('');
    setShowAddLoad(false);
  };

  const handleDeleteSupport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateSupports(supports.filter(s => s.id !== id));
    if (selectedId === id) onSelectObject(null, null);
  };

  const handleDeleteLoad = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateLoads(loads.filter(l => l.id !== id));
    if (selectedId === id) onSelectObject(null, null);
  };

  return (
    <div className="w-full bg-[#0b121e] border-r border-slate-800 text-xs text-slate-300 flex flex-col h-full overflow-y-auto divide-y divide-slate-800/80">
      {/* Explorer Header */}
      <div className="p-3 bg-[#0f172a] font-mono uppercase tracking-wider text-[11px] font-bold text-cyan-400 flex items-center justify-between">
        <span>MODEL EXPLORER</span>
        <span className="text-[10px] text-slate-500 font-normal">Panel Input Model</span>
      </div>

      {/* 1. MODEL GEOMETRY */}
      <div className="p-2">
        <button
          onClick={() => toggleSection('geometry')}
          className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-slate-800/60 rounded text-left font-bold text-slate-200 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.geometry ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            <Network className="w-3.5 h-3.5 text-cyan-400" /> 1. Geometri Balok
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">{beamLength} m</span>
        </button>

        {openSections.geometry && (
          <div className="pl-4 pr-2 py-2 space-y-2">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1 font-medium">Panjang Bentang Total (L, meter):</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={beamLengthStr}
                  placeholder="Ketik bentang L (m)... (misal: 16.9)"
                  onChange={e => {
                    const raw = e.target.value;
                    setBeamLengthStr(raw);
                    const parsed = parseFloat(raw.replace(',', '.'));
                    onUpdateBeamLength(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                  }}
                  className="flex-1 bg-slate-950 border border-cyan-700/60 focus:border-cyan-400 focus:outline-none rounded px-2.5 py-1 text-white font-mono font-bold placeholder:text-slate-600 placeholder:font-normal text-xs"
                  min="0"
                />
                <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs flex items-center">m</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Bebas memasukkan angka desimal berapapun (contoh: 16.9 atau 16,9).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. SUPPORTS */}
      <div className="p-2">
        <div className="flex items-center justify-between py-1.5 px-2">
          <button
            onClick={() => toggleSection('supports')}
            className="flex-1 flex items-center gap-1.5 text-left font-bold text-slate-200 hover:text-white transition"
          >
            {openSections.supports ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            <Anchor className="w-3.5 h-3.5 text-blue-400" /> 2. Tumpuan (Supports)
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 ml-1">
              {supports.length}
            </span>
          </button>
          <button
            onClick={() => setShowAddSupport(!showAddSupport)}
            className="px-2 py-0.5 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-semibold flex items-center gap-1 transition"
            title="Tambah Tumpuan Baru"
          >
            <Plus className="w-3 h-3" /> Tambah
          </button>
        </div>

        {openSections.supports && (
          <div className="pl-3 pr-1 py-1.5 space-y-2">
            {/* Inline Add Support Form */}
            {showAddSupport && (
              <form onSubmit={handleAddSupport} className="p-2.5 bg-[#09111e] border border-blue-500/50 rounded-lg space-y-2 text-[11px]">
                <div className="font-bold text-cyan-300 flex items-center justify-between">
                  <span>Input Tumpuan Baru</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSupport(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Tipe Tumpuan:</label>
                  <select
                    value={newSuppType}
                    onChange={e => setNewSuppType(e.target.value as SupportType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-medium focus:border-cyan-400 outline-none"
                  >
                    <option value="pin">Sendi (Pin) — Reaksi Vertikal & Horizontal</option>
                    <option value="roller">Rol (Roller) — Reaksi Vertikal saja</option>
                    <option value="fixed">Jepit (Fixed) — Reaksi V, H & Momen Jepit</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Posisi x (meter):</label>
                    <input
                      type="number"
                      step="any"
                      value={newSuppPos}
                      placeholder="misal: 16.9"
                      onChange={e => setNewSuppPos(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-0.5">Label (opsional):</label>
                    <input
                      type="text"
                      placeholder={`Tumpuan ${String.fromCharCode(65 + supports.length)}`}
                      value={newSuppLabel}
                      onChange={e => setNewSuppLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Simpan Tumpuan
                </button>
              </form>
            )}

            {/* List of existing supports */}
            {supports.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800/60">
                Belum ada tumpuan. Klik tombol "+ Tambah" di atas untuk memasukkan tumpuan (misal Sendi di x=0 dan Rol di x=L).
              </div>
            ) : (
              supports.map(supp => (
                <div
                  key={supp.id}
                  onClick={() => onSelectObject('support', supp.id)}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    selectedId === supp.id
                      ? 'bg-blue-950/50 border-cyan-400 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-cyan-300 flex items-center gap-1">
                      <CircleDot className="w-3 h-3 text-cyan-400" />
                      {supp.label || `Tumpuan ${supp.nodeId}`} ({supp.type === 'pin' ? 'Sendi' : supp.type === 'roller' ? 'Rol' : 'Jepit'})
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      x = {supp.position} m {supp.type === 'pin' ? '| Menahan Ux, Uy' : supp.type === 'roller' ? '| Menahan Uy' : '| Menahan Ux, Uy, M'}
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteSupport(supp.id, e)}
                    className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded transition"
                    title="Hapus Tumpuan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. LOADS */}
      <div className="p-2">
        <div className="flex items-center justify-between py-1.5 px-2">
          <button
            onClick={() => toggleSection('loads')}
            className="flex-1 flex items-center gap-1.5 text-left font-bold text-slate-200 hover:text-white transition"
          >
            {openSections.loads ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            <Layers className="w-3.5 h-3.5 text-rose-400" /> 3. Beban Bekerja (Loads)
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 ml-1">
              {loads.length}
            </span>
          </button>
          <button
            onClick={() => {
              if (newLoadEndPos === '0' && beamLength > 0) {
                setNewLoadEndPos(String(beamLength));
              }
              setShowAddLoad(!showAddLoad);
            }}
            className="px-2 py-0.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white text-[10px] font-semibold flex items-center gap-1 transition"
            title="Tambah Beban Baru"
          >
            <Plus className="w-3 h-3" /> Tambah
          </button>
        </div>

        {openSections.loads && (
          <div className="pl-3 pr-1 py-1.5 space-y-2">
            {/* Inline Add Load Form */}
            {showAddLoad && (
              <form onSubmit={handleAddLoad} className="p-2.5 bg-[#140b12] border border-rose-500/50 rounded-lg space-y-2 text-[11px]">
                <div className="font-bold text-rose-300 flex items-center justify-between">
                  <span>Input Beban Bekerja Baru</span>
                  <button
                    type="button"
                    onClick={() => setShowAddLoad(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Tipe Beban:</label>
                  <select
                    value={newLoadType}
                    onChange={e => setNewLoadType(e.target.value as LoadType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-medium focus:border-rose-400 outline-none"
                  >
                    <option value="point">Beban Terpusat (P) — Titik</option>
                    <option value="distributed">Beban Merata (q) — Panjang</option>
                    <option value="triangular">Beban Segitiga / Trapesium</option>
                    <option value="moment">Momen Titik Terpusat (M)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">
                      {newLoadType === 'distributed' ? 'Besar q (kN/m):' : newLoadType === 'moment' ? 'Momen M (kN.m):' : newLoadType === 'triangular' ? 'q Awal (kN/m):' : 'Besar P (kN):'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newLoadMag}
                      onChange={e => setNewLoadMag(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      placeholder="misal: 16.9"
                      required
                    />
                  </div>

                  {(newLoadType === 'triangular' || newLoadType === 'trapezoidal') ? (
                    <div>
                      <label className="text-slate-400 block mb-0.5">q Akhir (kN/m):</label>
                      <input
                        type="number"
                        step="any"
                        value={newLoadMagEnd}
                        onChange={e => setNewLoadMagEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        placeholder="misal: 25.5"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-slate-400 block mb-0.5">Arah Kerja:</label>
                      <select
                        value={newLoadDir}
                        onChange={e => setNewLoadDir(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white focus:border-rose-400 outline-none"
                      >
                        {newLoadType === 'moment' ? (
                          <>
                            <option value="cw">Searah Jarum Jam (CW)</option>
                            <option value="ccw">Berlawanan Arah (CCW)</option>
                          </>
                        ) : (
                          <>
                            <option value="down">Ke Bawah (Gravitasi ↓)</option>
                            <option value="up">Ke Atas (Angkat ↑)</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-0.5">Posisi x1 / Titik (m):</label>
                    <input
                      type="number"
                      step="any"
                      value={newLoadStartPos}
                      onChange={e => setNewLoadStartPos(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      min="0"
                      placeholder="misal: 16.9"
                      required
                    />
                  </div>

                  {(newLoadType === 'distributed' || newLoadType === 'triangular' || newLoadType === 'trapezoidal') && (
                    <div>
                      <label className="text-slate-400 block mb-0.5">Posisi x2 / Akhir (m):</label>
                      <input
                        type="number"
                        step="any"
                        value={newLoadEndPos}
                        onChange={e => setNewLoadEndPos(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        min="0"
                        placeholder="misal: 16.9"
                        required
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-slate-400 block mb-0.5">Label / Nama Beban (opsional):</label>
                  <input
                    type="text"
                    placeholder="Contoh: P1, q1, Beban Mati..."
                    value={newLoadLabel}
                    onChange={e => setNewLoadLabel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Simpan Beban
                </button>
              </form>
            )}

            {/* List of existing loads */}
            {loads.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-2 bg-slate-950/40 rounded border border-slate-800/60">
                Belum ada beban. Klik tombol "+ Tambah" di atas untuk memasukkan beban terpusat (P) atau beban merata (q).
              </div>
            ) : (
              loads.map(load => (
                <div
                  key={load.id}
                  onClick={() => onSelectObject('load', load.id)}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                    selectedId === load.id
                      ? 'bg-rose-950/50 border-rose-400 text-white'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-rose-300 flex items-center gap-1">
                      {load.direction === 'down' ? <ArrowDown className="w-3 h-3 text-rose-400" /> : load.direction === 'up' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <RotateCw className="w-3 h-3 text-amber-400" />}
                      {load.label || (load.type === 'point' ? 'Beban Terpusat P' : load.type === 'distributed' ? 'Beban Merata q' : 'Beban Segitiga')}: {load.magnitude} {load.type === 'distributed' ? 'kN/m' : load.type === 'moment' ? 'kN.m' : 'kN'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      x = {load.startPos}m {load.endPos ? `→ ${load.endPos}m` : ''} {load.magnitudeEnd !== undefined ? `(q2=${load.magnitudeEnd} kN/m)` : ''}
                    </div>
                  </div>
                  <button
                    onClick={e => handleDeleteLoad(load.id, e)}
                    className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-950/50 rounded transition"
                    title="Hapus Beban"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 4. MATERIAL PROPERTIES */}
      <div className="p-2">
        <button
          onClick={() => toggleSection('materials')}
          className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-slate-800/60 rounded text-left font-bold text-slate-200 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.materials ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            <Boxes className="w-3.5 h-3.5 text-amber-400" /> 4. Properti Material
          </span>
          <span className="text-[10px] font-mono text-slate-400">E={materialE/1000} GPa</span>
        </button>

        {openSections.materials && (
          <div className="pl-6 pr-2 py-2 space-y-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Modulus Elastisitas E (MPa)</label>
              <input
                type="number"
                step="any"
                value={materialE}
                onChange={e => onUpdateMaterialE(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. SECTION PROPERTIES */}
      <div className="p-2">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full flex items-center justify-between py-1.5 px-2 hover:bg-slate-800/60 rounded text-left font-bold text-slate-200 transition"
        >
          <span className="flex items-center gap-1.5">
            {openSections.sections ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
            <Component className="w-3.5 h-3.5 text-emerald-400" /> 5. Properti Penampang
          </span>
          <span className="text-[10px] font-mono text-slate-400">Inersia I</span>
        </button>

        {openSections.sections && (
          <div className="pl-6 pr-2 py-2 space-y-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Momen Inersia I (×10⁶ mm⁴)</label>
              <input
                type="number"
                step="any"
                value={sectionI}
                onChange={e => onUpdateSectionI(parseFloat(e.target.value.replace(',', '.')) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

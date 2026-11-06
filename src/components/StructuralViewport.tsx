import React, { useState, useRef, useMemo } from 'react';
import { DiagramPoint, SupportReaction, StructuralLoad, Support, SupportType, LoadType } from '../types/structural';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowDown,
  Anchor,
  CircleDot,
  X,
  Tag,
  Move,
  Activity,
  RotateCcw
} from 'lucide-react';

interface StructuralViewportProps {
  length: number;
  supports: Support[];
  loads: StructuralLoad[];
  reactions?: SupportReaction[];
  diagramPoints?: DiagramPoint[];
  selectedId: string | null;
  onSelectObject: (type: 'support' | 'load' | 'beam' | null, id: string | null) => void;
  activeViewMode: 'model' | 'loads' | 'sfd' | 'bmd' | 'all';
  onChangeViewMode: (mode: 'model' | 'loads' | 'sfd' | 'bmd' | 'all') => void;
  onAddSupportAt?: (pos: number, type: SupportType) => void;
  onAddLoadAt?: (pos: number, type: LoadType, mag: number) => void;
}

export const StructuralViewport: React.FC<StructuralViewportProps> = ({
  length,
  supports,
  loads,
  reactions = [],
  diagramPoints = [],
  selectedId,
  onSelectObject,
  activeViewMode,
  onChangeViewMode,
  onAddSupportAt,
  onAddLoadAt
}) => {
  const baseWidth = 880;
  const baseHeight = 490;
  const paddingX = 80;
  const beamY = 110;
  const usableWidth = baseWidth - 2 * paddingX;

  // Zoom & Pan State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Display toggles
  const [showValues, setShowValues] = useState<boolean>(true);
  const [hoverMeterX, setHoverMeterX] = useState<number | null>(null);
  const [quickActionPos, setQuickActionPos] = useState<{ xMeter: number; screenX: number; screenY: number } | null>(null);

  const safeLength = length > 0 ? length : 6;
  const toCanvasX = (x: number) => paddingX + (x / safeLength) * usableWidth;

  const svgRef = useRef<SVGSVGElement | null>(null);

  // ViewBox calculation based on zoom and pan
  const viewWidth = baseWidth / zoom;
  const viewHeight = baseHeight / zoom;
  const viewBoxX = (baseWidth - viewWidth) / 2 - pan.x;
  const viewBoxY = (baseHeight - viewHeight) / 2 - pan.y;

  // Convert mouse event coordinates into SVG viewBox space
  const getSvgCoords = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { svgX: 0, svgY: 0, screenRelX: 0, screenRelY: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const screenRelX = e.clientX - rect.left;
    const screenRelY = e.clientY - rect.top;
    const svgX = viewBoxX + (screenRelX / rect.width) * viewWidth;
    const svgY = viewBoxY + (screenRelY / rect.height) * viewHeight;
    return { svgX, svgY, screenRelX, screenRelY };
  };

  // Wheel Zoom (centered zoom)
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => {
      const next = Math.min(3.0, Math.max(0.5, Number((prev * factor).toFixed(2))));
      return next;
    });
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Middle click or clicking on canvas background / svg allows panning
    const target = e.target as HTMLElement;
    const isBg = target.tagName === 'svg' || target.getAttribute('data-bg') === 'true' || e.button === 1;
    if (isBg) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ x: pan.x, y: pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const factorX = viewWidth / rect.width;
      const factorY = viewHeight / rect.height;
      const dx = (e.clientX - dragStart.x) * factorX;
      const dy = (e.clientY - dragStart.y) * factorY;
      setPan({
        x: panStart.x + dx,
        y: panStart.y + dy
      });
      return;
    }

    if (length <= 0) return;
    const { svgX } = getSvgCoords(e);
    if (svgX >= paddingX - 15 && svgX <= baseWidth - paddingX + 15) {
      const rawMeter = ((svgX - paddingX) / usableWidth) * safeLength;
      const clamped = Math.max(0, Math.min(safeLength, Number(rawMeter.toFixed(2))));
      setHoverMeterX(clamped);
    } else {
      setHoverMeterX(null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Handle click on beam
  const handleBeamClick = (e: React.MouseEvent<SVGElement>) => {
    e.stopPropagation();
    if (length <= 0 || !svgRef.current) return;
    const { svgX, screenRelX, screenRelY } = getSvgCoords(e as any);
    const rawMeter = ((svgX - paddingX) / usableWidth) * safeLength;
    const meterX = Number(Math.max(0, Math.min(safeLength, rawMeter)).toFixed(1));

    setQuickActionPos({
      xMeter: meterX,
      screenX: screenRelX,
      screenY: Math.min(220, screenRelY)
    });
    onSelectObject('beam', 'main-beam');
  };

  // Critical values and points in SFD & BMD
  const { maxV, minV, maxM, minM, zeroVPoints, absMaxV, absMaxM } = useMemo(() => {
    if (!diagramPoints || diagramPoints.length === 0) {
      return {
        maxV: null,
        minV: null,
        maxM: null,
        minM: null,
        zeroVPoints: [],
        absMaxV: 1,
        absMaxM: 1
      };
    }

    let pMaxV = diagramPoints[0];
    let pMinV = diagramPoints[0];
    let pMaxM = diagramPoints[0];
    let pMinM = diagramPoints[0];
    const zeros: DiagramPoint[] = [];

    for (let i = 0; i < diagramPoints.length; i++) {
      const pt = diagramPoints[i];
      if (pt.V > pMaxV.V) pMaxV = pt;
      if (pt.V < pMinV.V) pMinV = pt;
      if (pt.M > pMaxM.M) pMaxM = pt;
      if (pt.M < pMinM.M) pMinM = pt;

      if (i > 0) {
        const prev = diagramPoints[i - 1];
        if ((prev.V >= 0 && pt.V < 0) || (prev.V <= 0 && pt.V > 0)) {
          zeros.push(Math.abs(prev.V) < Math.abs(pt.V) ? prev : pt);
        }
      }
    }

    const absV = Math.max(1, Math.abs(pMaxV.V), Math.abs(pMinV.V));
    const absM = Math.max(1, Math.abs(pMaxM.M), Math.abs(pMinM.M));

    return {
      maxV: pMaxV,
      minV: pMinV,
      maxM: pMaxM,
      minM: pMinM,
      zeroVPoints: zeros,
      absMaxV: absV,
      absMaxM: absM
    };
  }, [diagramPoints]);

  // Interpolate / find closest diagram point for current hovered meter
  const hoveredPoint = useMemo(() => {
    if (hoverMeterX === null || !diagramPoints || diagramPoints.length === 0) return null;
    let closest = diagramPoints[0];
    let minDist = Math.abs(diagramPoints[0].x - hoverMeterX);
    for (let i = 1; i < diagramPoints.length; i++) {
      const dist = Math.abs(diagramPoints[i].x - hoverMeterX);
      if (dist < minDist) {
        minDist = dist;
        closest = diagramPoints[i];
      }
    }
    return closest;
  }, [hoverMeterX, diagramPoints]);

  // Dynamic layout bases
  const sfdBaseY = activeViewMode === 'sfd' ? 260 : 245;
  const sfdHeight = activeViewMode === 'sfd' ? 95 : 46;
  const sfdScale = sfdHeight / absMaxV;

  const bmdBaseY = activeViewMode === 'bmd' ? 260 : 385;
  const bmdHeight = activeViewMode === 'bmd' ? 100 : 52;
  const bmdScale = bmdHeight / absMaxM;

  // Paths for SFD
  let sfdPath = `M ${toCanvasX(0)} ${sfdBaseY}`;
  diagramPoints.forEach(pt => {
    const cx = toCanvasX(pt.x);
    const cy = sfdBaseY - pt.V * sfdScale;
    sfdPath += ` L ${cx} ${cy}`;
  });
  sfdPath += ` L ${toCanvasX(safeLength)} ${sfdBaseY} Z`;

  // Paths for BMD (convention: positive tension plotted down)
  let bmdPath = `M ${toCanvasX(0)} ${bmdBaseY}`;
  diagramPoints.forEach(pt => {
    const cx = toCanvasX(pt.x);
    const cy = bmdBaseY + pt.M * bmdScale;
    bmdPath += ` L ${cx} ${cy}`;
  });
  bmdPath += ` L ${toCanvasX(safeLength)} ${bmdBaseY} Z`;

  // Step frequency for intermediate value tags based on zoom
  const sampleStep = zoom >= 1.7 ? 10 : zoom >= 1.2 ? 18 : 30;

  return (
    <div className="w-full bg-[#080d16] rounded-2xl border-2 border-slate-700/80 shadow-2xl overflow-hidden font-sans select-none flex flex-col relative">
      {/* Viewport Top Header & CAD Toolbars */}
      <div className="bg-[#0f172a] border-b border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            STRUCTURAL VIEWPORT — BEAM SYSTEM (L = {length} m)
          </span>
          {hoverMeterX !== null && (
            <span className="bg-cyan-950 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-800">
              x = {hoverMeterX} m
            </span>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-[#070b12] p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => onChangeViewMode('all')}
            className={`px-2 py-1 rounded text-xs transition ${activeViewMode === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            All Views
          </button>
          <button
            onClick={() => onChangeViewMode('loads')}
            className={`px-2 py-1 rounded text-xs transition ${activeViewMode === 'loads' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Model & Beban
          </button>
          <button
            onClick={() => onChangeViewMode('sfd')}
            className={`px-2 py-1 rounded text-xs transition ${activeViewMode === 'sfd' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Gaya Geser (SFD)
          </button>
          <button
            onClick={() => onChangeViewMode('bmd')}
            className={`px-2 py-1 rounded text-xs transition ${activeViewMode === 'bmd' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Momen Lentur (BMD)
          </button>
        </div>

        {/* Zoom & Value Display Controls */}
        <div className="flex items-center gap-1.5">
          {/* Toggle Values on Diagram */}
          <button
            onClick={() => setShowValues(!showValues)}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-mono transition border ${
              showValues
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600 font-bold'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Tampilkan Nilai Gaya Geser dan Momen langsung pada diagram"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Nilai V & M</span>
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={() => setZoom(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Level Indicator & Presets */}
          <span className="text-[11px] font-mono text-cyan-400 font-bold w-12 text-center bg-slate-900 border border-slate-800 py-1 rounded">
            {Math.round(zoom * 100)}%
          </span>

          {/* Zoom In Button */}
          <button
            onClick={() => setZoom(prev => Math.min(3.0, Number((prev + 0.25).toFixed(2))))}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Quick Presets */}
          <div className="hidden sm:flex items-center gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setZoom(0.75)}
              className={`px-1.5 py-0.5 rounded ${zoom === 0.75 ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              75%
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className={`px-1.5 py-0.5 rounded ${zoom === 1.0 ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              100%
            </button>
            <button
              onClick={() => setZoom(1.5)}
              className={`px-1.5 py-0.5 rounded ${zoom === 1.5 ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              150%
            </button>
            <button
              onClick={() => setZoom(2.0)}
              className={`px-1.5 py-0.5 rounded ${zoom === 2.0 ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              200%
            </button>
          </div>

          {/* Reset / Fit View Button */}
          <button
            onClick={handleResetView}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Reset Zoom & Pan (Fit to View)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area with Pan & Zoom */}
      <div
        className="relative overflow-hidden flex-1 cursor-crosshair select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
      >
        {/* Floating CAD HUD Overlay Card (Top Right) */}
        {diagramPoints.length > 0 && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none bg-[#09111e]/90 backdrop-blur-md border border-cyan-800/80 rounded-xl px-3 py-2 text-xs font-mono shadow-2xl space-y-1.5 min-w-[210px]">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px]">
              <span className="text-cyan-400 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" /> INSPEKSI GAYA REAL-TIME
              </span>
              <span className="text-slate-400">Zoom: {Math.round(zoom * 100)}%</span>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Posisi x:</span>
                <span className="text-cyan-300 font-bold">
                  {hoverMeterX !== null ? `${hoverMeterX.toFixed(2)} m` : '-- m'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-medium">Gaya Geser V:</span>
                <span className="font-bold text-white">
                  {hoveredPoint ? `${hoveredPoint.V > 0 ? '+' : ''}${hoveredPoint.V.toFixed(2)} kN` : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">Momen Lentur M:</span>
                <span className="font-bold text-white">
                  {hoveredPoint ? `${hoveredPoint.M > 0 ? '+' : ''}${hoveredPoint.M.toFixed(2)} kN·m` : '--'}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>V maks: <b className="text-blue-300">{absMaxV.toFixed(1)} kN</b></span>
              <span>M maks: <b className="text-emerald-300">{absMaxM.toFixed(1)} kN·m</b></span>
            </div>
          </div>
        )}

        {/* The SVG Canvas Element */}
        <svg
          ref={svgRef}
          viewBox={`${viewBoxX} ${viewBoxY} ${viewWidth} ${viewHeight}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoverMeterX(null);
          }}
          onClick={() => setQuickActionPos(null)}
          style={{
            backgroundColor: '#090e17',
            backgroundImage: `
              radial-gradient(circle, #1e293b 1px, transparent 1px),
              linear-gradient(to right, rgba(30, 41, 59, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(30, 41, 59, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${40 * zoom}px ${40 * zoom}px, ${40 * zoom}px ${40 * zoom}px`
          }}
          className="w-full h-auto min-w-[760px] block"
        >
          <defs>
            <linearGradient id="vpSfdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="vpBmdGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.08" />
            </linearGradient>
            <marker id="vpArrowDown" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
            </marker>
            <marker id="vpArrowUp" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#00e5ff" />
            </marker>
          </defs>

          {/* Background catch-all for mouse drag pan */}
          <rect
            data-bg="true"
            x={viewBoxX}
            y={viewBoxY}
            width={viewWidth}
            height={viewHeight}
            fill="transparent"
          />

          {/* Grid Metric Rulers across full height */}
          <g opacity="0.35" pointerEvents="none">
            {Array.from({ length: Math.floor(safeLength) + 1 }).map((_, mIdx) => {
              const mx = toCanvasX(mIdx);
              return (
                <g key={`grid-m-${mIdx}`}>
                  <line x1={mx} y1={beamY - 60} x2={mx} y2={baseHeight - 20} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
                  <text x={mx} y={beamY + 75} fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    {mIdx}m
                  </text>
                </g>
              );
            })}
          </g>

          {/* ================= 1. PHYSICAL BEAM MEMBER ================= */}
          {length > 0 ? (
            <g className="cursor-pointer" onClick={handleBeamClick}>
              {/* Invisible wide hit area for easy clicking */}
              <line
                x1={toCanvasX(0)}
                y1={beamY}
                x2={toCanvasX(length)}
                y2={beamY}
                stroke="transparent"
                strokeWidth="32"
              />
              {/* Visible Beam Line */}
              <line
                x1={toCanvasX(0)}
                y1={beamY}
                x2={toCanvasX(length)}
                y2={beamY}
                stroke={selectedId === 'main-beam' ? '#38bdf8' : '#94a3b8'}
                strokeWidth={selectedId === 'main-beam' ? '12' : '10'}
                strokeLinecap="round"
              />
              {/* Dimension Line under beam */}
              <line x1={toCanvasX(0)} y1={beamY + 28} x2={toCanvasX(length)} y2={beamY + 28} stroke="#64748b" strokeWidth="1" />
              <text x={toCanvasX(length / 2)} y={beamY + 24} fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                L = {length} m (Klik batang untuk opsi cepat)
              </text>
            </g>
          ) : (
            <g transform={`translate(${baseWidth / 2}, ${baseHeight / 2 - 30})`} pointerEvents="none">
              <rect x="-240" y="-45" width="480" height="90" rx="12" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="1.5" />
              <text x="0" y="-12" fill="#38bdf8" fontSize="13" fontWeight="bold" textAnchor="middle">
                Ruang Kerja Analisis Struktur Siap Digunakan
              </text>
              <text x="0" y="10" fill="#94a3b8" fontSize="11" textAnchor="middle">
                Silakan masukkan panjang bentang L (meter) pada menu samping kiri,
              </text>
              <text x="0" y="28" fill="#64748b" fontSize="10" textAnchor="middle">
                lalu tambahkan tumpuan dan beban untuk memulai kalkulasi rekayasa.
              </text>
            </g>
          )}

          {/* ================= 2. SUPPORTS ================= */}
          {supports.map((s, idx) => {
            const sx = toCanvasX(s.position);
            const sy = beamY + 5;
            const isSelected = selectedId === s.id;

            return (
              <g
                key={s.id || idx}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectObject('support', s.id);
                  setQuickActionPos(null);
                }}
              >
                {s.type === 'pin' && (
                  <g transform={`translate(${sx}, ${sy})`}>
                    <polygon
                      points="0,0 -12,18 12,18"
                      fill={isSelected ? '#38bdf8' : '#0284c7'}
                      stroke={isSelected ? '#ffffff' : '#38bdf8'}
                      strokeWidth="1.5"
                    />
                    <line x1="-15" y1="18" x2="15" y2="18" stroke="#64748b" strokeWidth="2" />
                    <line x1="-12" y1="22" x2="-8" y2="18" stroke="#64748b" strokeWidth="1" />
                    <line x1="-4" y1="22" x2="0" y2="18" stroke="#64748b" strokeWidth="1" />
                    <line x1="4" y1="22" x2="8" y2="18" stroke="#64748b" strokeWidth="1" />
                  </g>
                )}
                {s.type === 'roller' && (
                  <g transform={`translate(${sx}, ${sy})`}>
                    <polygon
                      points="0,0 -12,14 12,14"
                      fill={isSelected ? '#38bdf8' : '#0284c7'}
                      stroke={isSelected ? '#ffffff' : '#38bdf8'}
                      strokeWidth="1.5"
                    />
                    <circle cx="-6" cy="18" r="3" fill="#94a3b8" />
                    <circle cx="6" cy="18" r="3" fill="#94a3b8" />
                    <line x1="-15" y1="22" x2="15" y2="22" stroke="#64748b" strokeWidth="2" />
                  </g>
                )}
                {s.type === 'fixed' && (
                  <g transform={`translate(${sx}, ${beamY})`}>
                    <rect
                      x="-8"
                      y="-20"
                      width="8"
                      height="40"
                      fill={isSelected ? '#38bdf8' : '#475569'}
                      stroke={isSelected ? '#ffffff' : '#64748b'}
                    />
                    <line x1="-14" y1="-15" x2="-8" y2="-20" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-14" y1="-5" x2="-8" y2="-10" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-14" y1="5" x2="-8" y2="0" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="-14" y1="15" x2="-8" y2="10" stroke="#94a3b8" strokeWidth="1" />
                  </g>
                )}
                <text x={sx} y={sy + 36} fill={isSelected ? '#38bdf8' : '#cbd5e1'} fontSize="11" fontWeight="bold" textAnchor="middle">
                  {s.label || String.fromCharCode(65 + idx)} ({s.position}m)
                </text>
              </g>
            );
          })}

          {/* ================= 3. REACTIONS ================= */}
          {reactions.map((r, idx) => {
            const rx = toCanvasX(r.position);
            return (
              <g key={`reac-${idx}`} pointerEvents="none">
                <line
                  x1={rx}
                  y1={beamY + 58}
                  x2={rx}
                  y2={beamY + 12}
                  stroke="#00e5ff"
                  strokeWidth="2.5"
                  markerEnd="url(#vpArrowUp)"
                />
                <rect x={rx - 28} y={beamY + 54} width="56" height="14" rx="3" fill="#0b1016" fillOpacity="0.85" />
                <text x={rx} y={beamY + 65} fill="#00e5ff" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  R={r.Ry.toFixed(1)}kN
                </text>
              </g>
            );
          })}

          {/* ================= 4. STRUCTURAL LOADS ================= */}
          {(activeViewMode === 'all' || activeViewMode === 'loads') && loads.map((load, idx) => {
            const lx = toCanvasX(load.startPos);
            const isSelected = selectedId === load.id;

            if (load.type === 'point') {
              return (
                <g
                  key={load.id || idx}
                  className="cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject('load', load.id);
                    setQuickActionPos(null);
                  }}
                >
                  <line
                    x1={lx}
                    y1={beamY - 45}
                    x2={lx}
                    y2={beamY - 6}
                    stroke={isSelected ? '#fb7185' : '#f43f5e'}
                    strokeWidth={isSelected ? '3.5' : '2.5'}
                    markerEnd="url(#vpArrowDown)"
                  />
                  <circle cx={lx} cy={beamY - 45} r="5" fill={isSelected ? '#ffffff' : '#f43f5e'} />
                  <text x={lx} y={beamY - 50} fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    P = {load.magnitude} kN
                  </text>
                </g>
              );
            } else if (load.type === 'distributed') {
              const endX = toCanvasX(load.endPos ?? safeLength);
              const arrows = Math.max(3, Math.round((endX - lx) / 25));
              return (
                <g
                  key={load.id || idx}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject('load', load.id);
                    setQuickActionPos(null);
                  }}
                >
                  <line x1={lx} y1={beamY - 32} x2={endX} y2={beamY - 32} stroke="#f43f5e" strokeWidth={isSelected ? '2.5' : '1.5'} />
                  {Array.from({ length: arrows }).map((_, aIdx) => {
                    const ax = lx + (aIdx / (arrows - 1 || 1)) * (endX - lx);
                    return (
                      <line
                        key={aIdx}
                        x1={ax}
                        y1={beamY - 32}
                        x2={ax}
                        y2={beamY - 6}
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        markerEnd="url(#vpArrowDown)"
                      />
                    );
                  })}
                  <text x={(lx + endX) / 2} y={beamY - 38} fill="#fb7185" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    q = {load.magnitude} kN/m [{load.startPos}m - {load.endPos}m]
                  </text>
                </g>
              );
            } else if (load.type === 'triangular' || load.type === 'trapezoidal') {
              const endX = toCanvasX(load.endPos ?? safeLength);
              const q1 = load.magnitude;
              const q2 = load.magnitudeEnd ?? 0;
              const h1 = (q1 / Math.max(q1, q2, 1)) * 36;
              const h2 = (q2 / Math.max(q1, q2, 1)) * 36;

              const polyPoints = `${lx},${beamY - 6} ${lx},${beamY - 6 - h1} ${endX},${beamY - 6 - h2} ${endX},${beamY - 6}`;

              return (
                <g
                  key={load.id || idx}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectObject('load', load.id);
                    setQuickActionPos(null);
                  }}
                >
                  <polygon points={polyPoints} fill="#f43f5e" fillOpacity="0.25" stroke="#f43f5e" strokeWidth="1.5" />
                  {h1 > 0 && <line x1={lx} y1={beamY - 6 - h1} x2={lx} y2={beamY - 6} stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#vpArrowDown)" />}
                  {h2 > 0 && <line x1={endX} y1={beamY - 6 - h2} x2={endX} y2={beamY - 6} stroke="#f43f5e" strokeWidth="1.5" markerEnd="url(#vpArrowDown)" />}
                  <text x={(lx + endX) / 2} y={beamY - 42} fill="#fb7185" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {load.type === 'triangular' ? `Segitiga (${q1} → ${q2} kN/m)` : `Trapesium (${q1} → ${q2} kN/m)`}
                  </text>
                </g>
              );
            }
            return null;
          })}

          {/* ================= 5. SFD (GAYA GESER) WITH VALUE ANNOTATIONS ================= */}
          {(activeViewMode === 'all' || activeViewMode === 'sfd') && diagramPoints.length > 0 && (
            <g className="transition-opacity duration-200">
              {/* Baseline */}
              <line x1={toCanvasX(0)} y1={sfdBaseY} x2={toCanvasX(safeLength)} y2={sfdBaseY} stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x={paddingX - 10} y={sfdBaseY + 4} fill="#60a5fa" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                SFD (V)
              </text>

              {/* Shaded Area and Stroke Curve */}
              <path d={sfdPath} fill="url(#vpSfdGrad)" stroke="#38bdf8" strokeWidth="2.2" />

              {/* Zero Shear Indicator Line (leads to maximum moment) */}
              {zeroVPoints.map((zp, i) => {
                const zx = toCanvasX(zp.x);
                return (
                  <g key={`zero-v-${i}`}>
                    <circle cx={zx} cy={sfdBaseY} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
                    <line x1={zx} y1={sfdBaseY} x2={zx} y2={bmdBaseY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                    <text x={zx} y={sfdBaseY - 8} fill="#fcd34d" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      V=0 (M maks)
                    </text>
                  </g>
                );
              })}

              {/* Peak Values Badges (Always rendered when values toggle is on) */}
              {showValues && maxV && Math.abs(maxV.V) > 0.05 && (
                <g transform={`translate(${toCanvasX(maxV.x)}, ${sfdBaseY - maxV.V * sfdScale})`}>
                  <line x1="0" y1="0" x2="0" y2={maxV.V * sfdScale} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <rect x="-38" y="-19" width="76" height="15" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                  <text x="0" y="-8" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    V={maxV.V > 0 ? '+' : ''}{maxV.V.toFixed(2)}kN
                  </text>
                  <circle cx="0" cy="0" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}

              {showValues && minV && Math.abs(minV.V) > 0.05 && minV.x !== maxV?.x && (
                <g transform={`translate(${toCanvasX(minV.x)}, ${sfdBaseY - minV.V * sfdScale})`}>
                  <line x1="0" y1="0" x2="0" y2={minV.V * sfdScale} stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <rect x="-38" y="4" width="76" height="15" rx="4" fill="#0369a1" stroke="#38bdf8" strokeWidth="1" />
                  <text x="0" y="15" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    V={minV.V.toFixed(2)}kN
                  </text>
                  <circle cx="0" cy="0" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}

              {/* Intermediate Value Labels along the SFD curve when zoomed in */}
              {showValues && diagramPoints.filter((_, i) => i % sampleStep === 0).map((pt, i) => {
                const cx = toCanvasX(pt.x);
                const cy = sfdBaseY - pt.V * sfdScale;
                const isNearMax = maxV && Math.abs(pt.x - maxV.x) < 0.2;
                const isNearMin = minV && Math.abs(pt.x - minV.x) < 0.2;
                if (isNearMax || isNearMin) return null;

                return (
                  <g key={`sfd-sample-${i}`} className="opacity-90">
                    <circle cx={cx} cy={cy} r="2.5" fill="#60a5fa" />
                    {zoom >= 1.0 && (
                      <text
                        x={cx}
                        y={cy + (pt.V >= 0 ? -6 : 12)}
                        fill="#93c5fd"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {pt.V > 0 ? '+' : ''}{pt.V.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= 6. BMD (MOMEN LENTUR) WITH VALUE ANNOTATIONS ================= */}
          {(activeViewMode === 'all' || activeViewMode === 'bmd') && diagramPoints.length > 0 && (
            <g className="transition-opacity duration-200">
              {/* Baseline */}
              <line x1={toCanvasX(0)} y1={bmdBaseY} x2={toCanvasX(safeLength)} y2={bmdBaseY} stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x={paddingX - 10} y={bmdBaseY + 4} fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                BMD (M)
              </text>

              {/* Shaded Area and Stroke Curve */}
              <path d={bmdPath} fill="url(#vpBmdGrad)" stroke="#10b981" strokeWidth="2.2" />

              {/* Peak Maximum Moment Badge */}
              {showValues && maxM && Math.abs(maxM.M) > 0.05 && (
                <g transform={`translate(${toCanvasX(maxM.x)}, ${bmdBaseY + maxM.M * bmdScale})`}>
                  <line x1="0" y1="0" x2="0" y2={-maxM.M * bmdScale} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <rect x="-42" y="4" width="84" height="16" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="1" />
                  <text x="0" y="16" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    M_maks={maxM.M > 0 ? '+' : ''}{maxM.M.toFixed(2)}kNm
                  </text>
                  <circle cx="0" cy="0" r="3.5" fill="#34d399" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}

              {/* Negative Moment Badge (e.g. at supports in continuous beams) */}
              {showValues && minM && minM.M < -0.05 && (
                <g transform={`translate(${toCanvasX(minM.x)}, ${bmdBaseY + minM.M * bmdScale})`}>
                  <line x1="0" y1="0" x2="0" y2={-minM.M * bmdScale} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  <rect x="-42" y="-19" width="84" height="16" rx="4" fill="#065f46" stroke="#34d399" strokeWidth="1" />
                  <text x="0" y="-7" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    M_tumpuan={minM.M.toFixed(2)}kNm
                  </text>
                  <circle cx="0" cy="0" r="3.5" fill="#34d399" stroke="#ffffff" strokeWidth="1" />
                </g>
              )}

              {/* Intermediate Value Labels along the BMD curve when zoomed in */}
              {showValues && diagramPoints.filter((_, i) => i % sampleStep === 0).map((pt, i) => {
                const cx = toCanvasX(pt.x);
                const cy = bmdBaseY + pt.M * bmdScale;
                const isNearMax = maxM && Math.abs(pt.x - maxM.x) < 0.2;
                const isNearMin = minM && Math.abs(pt.x - minM.x) < 0.2;
                if (isNearMax || isNearMin) return null;

                return (
                  <g key={`bmd-sample-${i}`} className="opacity-90">
                    <circle cx={cx} cy={cy} r="2.5" fill="#34d399" />
                    {zoom >= 1.0 && (
                      <text
                        x={cx}
                        y={cy + (pt.M >= 0 ? 12 : -6)}
                        fill="#a7f3d0"
                        fontSize="8.5"
                        fontFamily="monospace"
                        fontWeight="semibold"
                        textAnchor="middle"
                      >
                        {pt.M > 0 ? '+' : ''}{pt.M.toFixed(1)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ================= 7. INTERACTIVE TRACKING CROSSHAIR ================= */}
          {hoverMeterX !== null && (
            <g pointerEvents="none">
              {/* Full height vertical guide line */}
              <line
                x1={toCanvasX(hoverMeterX)}
                y1={beamY - 45}
                x2={toCanvasX(hoverMeterX)}
                y2={baseHeight - 20}
                stroke="#00e5ff"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Dot on physical beam */}
              <circle cx={toCanvasX(hoverMeterX)} cy={beamY} r="4.5" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />

              {/* Interactive Tooltips on Diagrams */}
              {hoveredPoint && (activeViewMode === 'all' || activeViewMode === 'sfd') && (
                <g transform={`translate(${toCanvasX(hoverMeterX)}, ${sfdBaseY - hoveredPoint.V * sfdScale})`}>
                  <circle cx="0" cy="0" r="4.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x="7" y="-12" width="76" height="18" rx="4" fill="#0b1322" stroke="#38bdf8" strokeWidth="1" />
                  <text x="12" y="1" fill="#60a5fa" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    V: {hoveredPoint.V > 0 ? '+' : ''}{hoveredPoint.V.toFixed(2)}k
                  </text>
                </g>
              )}

              {hoveredPoint && (activeViewMode === 'all' || activeViewMode === 'bmd') && (
                <g transform={`translate(${toCanvasX(hoverMeterX)}, ${bmdBaseY + hoveredPoint.M * bmdScale})`}>
                  <circle cx="0" cy="0" r="4.5" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
                  <rect x="7" y="-12" width="76" height="18" rx="4" fill="#0b1322" stroke="#34d399" strokeWidth="1" />
                  <text x="12" y="1" fill="#34d399" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                    M: {hoveredPoint.M > 0 ? '+' : ''}{hoveredPoint.M.toFixed(2)}m
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Quick Action Floating Menu on Beam Click */}
        {quickActionPos && (
          <div
            className="absolute z-30 bg-[#0f172a] border border-cyan-500/80 rounded-xl shadow-2xl p-2.5 text-xs text-white space-y-2 animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: Math.max(16, Math.min(baseWidth - 240, quickActionPos.screenX - 80)),
              top: Math.max(40, quickActionPos.screenY + 10)
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1 font-bold text-cyan-300">
              <span>Posisi Terpilih: x = {quickActionPos.xMeter} m</span>
              <button
                onClick={() => setQuickActionPos(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              {onAddLoadAt && (
                <>
                  <button
                    onClick={() => {
                      onAddLoadAt(quickActionPos.xMeter, 'point', 20);
                      setQuickActionPos(null);
                    }}
                    className="px-2 py-1 bg-rose-600/80 hover:bg-rose-600 rounded text-left text-[11px] font-medium flex items-center gap-1.5 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> + Beban Terpusat P (20 kN)
                  </button>
                  <button
                    onClick={() => {
                      onAddLoadAt(quickActionPos.xMeter, 'distributed', 10);
                      setQuickActionPos(null);
                    }}
                    className="px-2 py-1 bg-rose-700/80 hover:bg-rose-700 rounded text-left text-[11px] font-medium flex items-center gap-1.5 transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" /> + Beban Merata q (10 kN/m)
                  </button>
                </>
              )}
              {onAddSupportAt && (
                <>
                  <button
                    onClick={() => {
                      onAddSupportAt(quickActionPos.xMeter, 'pin');
                      setQuickActionPos(null);
                    }}
                    className="px-2 py-1 bg-blue-600/80 hover:bg-blue-600 rounded text-left text-[11px] font-medium flex items-center gap-1.5 transition"
                  >
                    <Anchor className="w-3.5 h-3.5" /> + Tumpuan Sendi (Pin)
                  </button>
                  <button
                    onClick={() => {
                      onAddSupportAt(quickActionPos.xMeter, 'roller');
                      setQuickActionPos(null);
                    }}
                    className="px-2 py-1 bg-blue-700/80 hover:bg-blue-700 rounded text-left text-[11px] font-medium flex items-center gap-1.5 transition"
                  >
                    <CircleDot className="w-3.5 h-3.5" /> + Tumpuan Rol (Roller)
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Viewport Footer Console Info */}
      <div className="bg-[#0f172a] border-t border-slate-800 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-2">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">MODE: {activeViewMode.toUpperCase()}</span>
          <span>|</span>
          <span className="flex items-center gap-1">
            <Move className="w-3 h-3 text-cyan-400" /> Scroll Mouse: Zoom In/Out | Drag: Pan Geser Canvas
          </span>
        </div>
        <div className="text-slate-500 text-[10px]">
          Konvensi: Momen positif diplot di serat tarik (bawah). Nilai V & M otomatis terkalibrasi.
        </div>
      </div>
    </div>
  );
};

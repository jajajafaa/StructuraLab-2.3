import React, { useState, useEffect } from 'react';
import { UserProfile } from './types/auth';
import { AuthService } from './services/db';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ConcreteDesignModule } from './components/ConcreteDesignModule';
import { StructuralAnalysisModule } from './components/StructuralAnalysisModule';
import { HistoryView } from './components/HistoryView';
import { DocumentationView } from './components/DocumentationView';
import {
  Layers,
  Compass,
  History,
  BookOpen,
  LogOut,
  ShieldCheck,
  User,
  ArrowRight,
  Calculator,
  ChevronRight,
  Building2,
  Workflow,
  Sparkles,
  DraftingCompass,
  Moon
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(AuthService.getCurrentUser());
  const [activeView, setActiveView] = useState<'dashboard' | 'structural' | 'concrete' | 'history' | 'docs' | 'admin'>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'blueprint'>(() => {
    const saved = localStorage.getItem('structura_theme');
    return saved === 'blueprint' ? 'blueprint' : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('structura_theme', theme);
    if (theme === 'blueprint') {
      document.documentElement.classList.add('theme-blueprint');
    } else {
      document.documentElement.classList.remove('theme-blueprint');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'blueprint' : 'dark'));
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AuthModal onSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className={`min-h-screen ${theme === 'blueprint' ? 'theme-blueprint theme-grid-bg' : 'bg-slate-950'} text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-200`}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                Structura<span className="text-cyan-400">Lab</span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Analyze. Design. Understand.
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-2 rounded-lg transition ${
                activeView === 'dashboard'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('structural')}
              className={`px-3 py-2 rounded-lg transition ${
                activeView === 'structural'
                  ? 'bg-blue-600/20 text-cyan-400 border border-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Structural Analysis
            </button>
            <button
              onClick={() => setActiveView('concrete')}
              className={`px-3 py-2 rounded-lg transition ${
                activeView === 'concrete'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reinforced Concrete
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-2 rounded-lg transition ${
                activeView === 'history'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calculation History
            </button>
            <button
              onClick={() => setActiveView('docs')}
              className={`px-3 py-2 rounded-lg transition ${
                activeView === 'docs'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Documentation
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
                  activeView === 'admin'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                    : 'text-cyan-400 hover:bg-cyan-950/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Panel
              </button>
            )}
          </nav>

          {/* Right navbar controls: Theme toggle, User Profile & Logout */}
          <div className="flex items-center gap-2.5">
            {/* Global Theme Toggle Button: Dark vs Blueprint Mode */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all active:scale-95 ${
                theme === 'blueprint'
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-slate-800 hover:border-cyan-500/50 shadow-md shadow-cyan-500/10'
              }`}
              title={
                theme === 'blueprint'
                  ? 'Mode Saat Ini: Blueprint (Teknik). Klik untuk beralih ke Dark Mode.'
                  : 'Mode Saat Ini: Dark Mode. Klik untuk beralih ke Blueprint Mode (Gambar Teknik Kontras Tinggi).'
              }
            >
              {theme === 'blueprint' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="font-semibold text-indigo-950">Blueprint</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                </>
              ) : (
                <>
                  <DraftingCompass className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-semibold text-slate-200">Blueprint Mode</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                </>
              )}
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-white block">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-rose-950/30 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Welcome */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-8 sm:p-10 shadow-2xl">
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
                  <Sparkles className="w-3.5 h-3.5" /> Civil Engineering Workspace v2.6
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300">StructuraLab</span>
                </h1>
                <p className="text-base text-slate-300 leading-relaxed">
                  "Your Engineering Calculation Workspace" — Platform terintegrasi perhitungan mekanika teknik, analisis struktur statis tertentu & tak tentu, serta perancangan elemen beton bertulang SNI 2847:2013 dengan proses matematis transparan.
                </p>
              </div>

              {/* Background architectural grid illustration */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden lg:block">
                <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" stroke="currentColor">
                  <path d="M0,0 L100,100 M20,0 L100,80 M40,0 L100,60 M60,0 L100,40 M80,0 L100,20" strokeWidth="0.5" />
                  <path d="M0,20 L80,100 M0,40 L60,100 M0,60 L40,100 M0,80 L20,100" strokeWidth="0.5" />
                </svg>
              </div>
            </div>

            {/* TWO PRIMARY MODULE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CARD 1: STRUCTURAL ANALYSIS */}
              <div
                onClick={() => setActiveView('structural')}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-cyan-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform shadow-md">
                    <Compass className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
                    MODUL 01
                  </span>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                    STRUCTURAL ANALYSIS
                  </h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                    Analyze beams, frames, trusses, and 2D structural systems. Menghitung reaksi tumpuan, diagram gaya lintang (SFD), momen lentur (BMD), beban merata, beban segitiga, metode Cross (momen distribusi), dan gaya batang truss.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider group-hover:underline">
                    OPEN STRUCTURAL ANALYSIS
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* CARD 2: REINFORCED CONCRETE DESIGN */}
              <div
                onClick={() => setActiveView('concrete')}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform shadow-md">
                    <Layers className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                    MODUL 02
                  </span>
                  <h3 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                    REINFORCED CONCRETE DESIGN
                  </h3>
                  <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                    Analyze, design, and auto-optimize reinforced concrete structural elements. Berdasarkan SNI 2847:2013 & buku Agus Setiawan. Dilengkapi Auto-Optimizer dimensi penampang (b×h) dan rasio pembesian (ρ) optimal, balok tunggal, rangkap, balok T, serta sengkang geser.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider group-hover:underline">
                    OPEN CONCRETE DESIGN & AUTO-OPTIMIZER
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <Workflow className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Langkah Perhitungan Terbuka</h4>
                  <p className="text-slate-400 mt-0.5">Rumus, substitusi angka, dan logika mekanika dijabarkan langkah demi langkah.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Auto-Optimizer SNI 2847:2013</h4>
                  <p className="text-slate-400 mt-0.5">Saran dimensi penampang & rasio tulangan optimum berdasarkan beban Mu & Vu serta batas daktilitas.</p>
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                <History className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">Ekspor Laporan PDF</h4>
                  <p className="text-slate-400 mt-0.5">Simpan sesi kalkulasi dan cetak laporan resmi format teknik sipil profesional.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Structural Analysis */}
        {activeView === 'structural' && (
          <StructuralAnalysisModule
            currentUser={currentUser}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* View: Concrete Design */}
        {activeView === 'concrete' && (
          <ConcreteDesignModule
            currentUser={currentUser}
            onBackToDashboard={() => setActiveView('dashboard')}
          />
        )}

        {/* View: History */}
        {activeView === 'history' && (
          <HistoryView
            currentUser={currentUser}
            onOpenRecord={(rec) => {
              if (rec.category === 'structural_analysis') setActiveView('structural');
              else setActiveView('concrete');
            }}
          />
        )}

        {/* View: Documentation */}
        {activeView === 'docs' && <DocumentationView />}

        {/* View: Admin */}
        {activeView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onClose={() => setActiveView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Auth } from '@/components/Auth';
import { RainMap } from '@/components/RainMap';
import { RAIN_RANGES } from '@/lib/rainUtils';
import { Leaf, Calendar, LogOut, Info, Loader2, ChevronDown, X } from 'lucide-react';
import { useState } from 'react';

function Dashboard() {
  const { user, signOut } = useAuth();
  const [viewMode, setViewMode] = useState<'daily' | '5d'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showLegend, setShowLegend] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(false);

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuario';

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden font-sans">

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="h-14 md:h-16 border-b border-border bg-card flex items-center justify-between px-3 md:px-6 shrink-0 z-50 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="bg-primary p-2 md:p-2.5 rounded-xl shadow-lg shadow-primary/20">
            <Leaf size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base md:text-lg tracking-tight text-foreground leading-none">RainMonitor</h1>
            <p className="hidden md:block text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mt-1 opacity-80">Geospatial Intelligence</p>
          </div>
        </div>

        {/* Desktop: Mode + Date */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex bg-muted p-1 rounded-xl border border-border">
            <button onClick={() => setViewMode('daily')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${viewMode === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Día</button>
            <button onClick={() => setViewMode('5d')} className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${viewMode === '5d' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>5 Días</button>
          </div>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer" />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 md:gap-3 md:pl-4 md:border-l border-border">
          <span className="hidden md:block text-xs font-bold text-foreground">{userName}</span>
          <button onClick={() => signOut()} className="p-2 md:p-2.5 text-muted-foreground bg-muted hover:text-destructive hover:bg-destructive/10 rounded-xl border border-border transition-all active:scale-95" title="Cerrar Sesión">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── MAP — fills remaining space ─────────────────────── */}
      <main className="flex-1 relative overflow-hidden min-h-0">
        <RainMap viewMode={viewMode} selectedDate={selectedDate} />

        {/* Desktop Legend */}
        <div className="hidden md:block absolute top-4 right-4 z-[1000] w-52">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
                <Info size={13} className="text-primary" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">Intensidad</h3>
            </div>
            <div className="space-y-2">
              {RAIN_RANGES.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-foreground font-bold">{item.label}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium uppercase">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile legend overlay (sheet from bottom) */}
        {showLegend && (
          <div className="md:hidden absolute inset-0 z-[2000] flex items-end">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLegend(false)} />
            <div className="relative w-full bg-card rounded-t-3xl border-t border-border p-5 pb-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">Intensidad de Lluvia</h3>
                <button onClick={() => setShowLegend(false)} className="p-2 bg-muted rounded-xl text-muted-foreground"><X size={16} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RAIN_RANGES.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted rounded-xl px-3 py-2.5">
                    <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-xs font-bold text-foreground leading-none">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MOBILE BOTTOM BAR — outside main so it doesn't cover the map ── */}
      <div className="md:hidden shrink-0 border-t border-border bg-card z-50">
        {/* Expanded controls panel */}
        {showMobileControls && (
          <div className="border-b border-border px-4 py-3 space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setViewMode('daily')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'daily' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>📅 Día</button>
              <button onClick={() => setViewMode('5d')} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === '5d' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>📊 5 Días</button>
            </div>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer" />
            </div>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => { setShowMobileControls(v => !v); setShowLegend(false); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border ${showMobileControls ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border'}`}
          >
            <Calendar size={14} />
            <span>{viewMode === 'daily' ? 'Día' : '5 Días'} · {selectedDate.slice(5)}</span>
            <ChevronDown size={12} className={`transition-transform ${showMobileControls ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => { setShowLegend(v => !v); setShowMobileControls(false); }}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${showLegend ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border'}`}
          >
            <Info size={14} />
            <span>Leyenda</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Autenticando...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

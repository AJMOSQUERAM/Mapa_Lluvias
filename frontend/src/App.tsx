import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { RainMap } from './components/RainMap';
import { CloudRain, Calendar, LogOut, Info } from 'lucide-react';

function App() {
  const [session, setSession] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'daily' | '5d'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <CloudRain size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">RainMonitor</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Plataforma Geográfica</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button 
              onClick={() => setViewMode('daily')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Día
            </button>
            <button 
              onClick={() => setViewMode('5d')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === '5d' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              5 Días
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Calendar size={16} />
            </div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white"
            />
          </div>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        <RainMap viewMode={viewMode} selectedDate={selectedDate} />
        
        {/* Floating Info Card */}
        <div className="absolute bottom-6 left-6 z-50 max-w-xs w-full bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Info size={18} className="text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Escala de Lluvias</h3>
              <p className="text-xs text-slate-400 mb-3">Precipitación medida en milímetros (mm).</p>
              
              <div className="space-y-1.5">
                {[
                  { label: '> 50 mm', color: '#08306b' },
                  { label: '30 - 50 mm', color: '#08519c' },
                  { label: '20 - 30 mm', color: '#2171b5' },
                  { label: '10 - 20 mm', color: '#4292c6' },
                  { label: '1 - 10 mm', color: '#9ecae1' },
                  { label: 'Sin lluvia', color: '#f7fbff' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-slate-300 font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

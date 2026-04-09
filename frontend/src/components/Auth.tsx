import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Sesión iniciada correctamente.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monitoreo de Lluvias</h1>
          <p className="text-slate-400 mt-2">Ingresa tus credenciales para acceder al mapa histórico</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="usuario@cenicana.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                className="block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/50' : 'bg-green-500/10 text-green-400 border border-green-500/50'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { authService } from '../services/authService';
import { AppUser } from '../types';

interface LoginScreenProps {
  darkMode: boolean;
  onLoginSuccess: (user: AppUser) => void;
  onOpenInstallModal?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ darkMode, onLoginSuccess, onOpenInstallModal }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese usuario y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await authService.login(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${darkMode ? 'bg-[#0a0b0b] text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 mb-4 transform hover:scale-105 transition-transform">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
              <path d="M15 18H9"/>
              <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/>
              <circle cx="7" cy="18" r="2"/>
              <circle cx="17" cy="18" r="2"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            Logitrack <span className="text-emerald-500">Calico</span>
          </h1>
          <p className="text-xs uppercase tracking-[0.25em] font-bold text-emerald-500/80 mt-1">
            Calico S.A. • Gestión Logística
          </p>
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sistema de Acceso Manual Administrado
          </p>
        </div>

        {/* Form Container */}
        <div className={`p-8 rounded-3xl border shadow-2xl backdrop-blur-sm ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="mb-6 pb-4 border-b border-emerald-500/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Iniciar Sesión</h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresa con las credenciales provistas por tu administrador
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Seguro
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Usuario o Correo
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  placeholder="ej. admin@calico.com o chofer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-11 rounded-xl text-sm border outline-none transition-all ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 p-1"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a Logitrack Calico</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>

            {onOpenInstallModal && (
              <button
                type="button"
                onClick={onOpenInstallModal}
                className={`w-full py-2.5 px-3 rounded-xl border border-dashed transition-all text-xs font-bold flex items-center justify-center gap-2 ${
                  darkMode 
                    ? 'border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10' 
                    : 'border-emerald-600/30 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <span>📲</span>
                <span>¿Estás en PC? Escanear QR para abrir en Celular</span>
              </button>
            )}
          </form>

          {/* Quick Access Helper for testing/staff */}
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2.5 text-center">
              Acceso Rápido de Prueba (Calico S.A.)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@calico.com', 'calico2026')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="text-xs">👑</div>
                <div className="text-[10px] font-bold mt-0.5 truncate text-emerald-500">Admin</div>
                <div className="text-[9px] text-slate-400 truncate">calico2026</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('chofer@calico.com', 'chofer123')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="text-xs">🚚</div>
                <div className="text-[10px] font-bold mt-0.5 truncate text-emerald-500">Chofer</div>
                <div className="text-[9px] text-slate-400 truncate">chofer123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operador@calico.com', 'operador123')}
                className={`p-2 rounded-xl border text-center transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="text-xs">💼</div>
                <div className="text-[10px] font-bold mt-0.5 truncate text-emerald-500">Operador</div>
                <div className="text-[9px] text-slate-400 truncate">operador123</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400">
            Los choferes y operadores son dados de alta por el Administrador en el panel interno.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

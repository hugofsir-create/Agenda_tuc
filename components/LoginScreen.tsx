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

  const [isAdminDevice, setIsAdminDevice] = useState<boolean>(() => {
    try {
      return localStorage.getItem('calico_admin_device_authorized') === 'true';
    } catch {
      return false;
    }
  });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSecurityInput, setAdminSecurityInput] = useState('');
  const [adminUnlockError, setAdminUnlockError] = useState<string | null>(null);

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
      if (user.role === 'admin') {
        setIsAdminDevice(true);
        localStorage.setItem('calico_admin_device_authorized', 'true');
      }
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

  const handleVerifyAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminSecurityInput.trim();
    if (clean === '2026' || clean === 'calico2026' || clean.toLowerCase() === 'hugofsir@gmail.com') {
      setIsAdminDevice(true);
      try {
        localStorage.setItem('calico_admin_device_authorized', 'true');
      } catch (err) {
        console.warn(err);
      }
      handleQuickFill('admin@calico.com', 'calico2026');
      setShowAdminModal(false);
      setAdminSecurityInput('');
      setAdminUnlockError(null);
    } else {
      setAdminUnlockError('Clave o PIN incorrecto. Acceso restringido al Administrador.');
    }
  };

  const handleLockAdminDevice = () => {
    try {
      localStorage.removeItem('calico_admin_device_authorized');
    } catch (err) {
      console.warn(err);
    }
    setIsAdminDevice(false);
    setUsername('');
    setPassword('');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${darkMode ? 'bg-[#0a0b0b] text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <div className="w-full max-w-md">
        {/* Brand Card Header */}
        <div className="text-center mb-8">
          {/* Desktop Logo (Calico Corporativo) */}
          <div className="hidden md:inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white shadow-xl shadow-black/25 mb-4 border border-emerald-500/30 transform hover:scale-105 transition-transform">
            <img
              src="/assets/aistudio/Calico_9b3203f6.png"
              alt="Calico Logística Integral"
              className="h-14 w-auto object-contain select-none"
            />
          </div>

          {/* Mobile Icon (Camión Logitrack) */}
          <div className="inline-flex md:hidden items-center justify-center w-20 h-20 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 mb-4 p-2.5 transform hover:scale-105 transition-transform">
            <img
              src="/truck-app-icon.svg"
              alt="Camión Logitrack Móvil"
              className="w-full h-full object-contain drop-shadow"
            />
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

          {/* Quick Access Helper for staff (Chofer & Operador only) */}
          <div className="mt-6 pt-5 border-t border-slate-200/50 dark:border-slate-800">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2.5 text-center">
              Acceso Rápido del Personal (Calico S.A.)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('chofer@calico.com', 'chofer123')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="text-sm">🚚</div>
                <div className="text-[11px] font-bold mt-0.5 truncate text-emerald-600 dark:text-emerald-400">Chofer / Reparto</div>
                <div className="text-[9px] text-slate-400 truncate">Acceso a Entregas</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operador@calico.com', 'operador123')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  darkMode ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                }`}
              >
                <div className="text-sm">💼</div>
                <div className="text-[11px] font-bold mt-0.5 truncate text-emerald-600 dark:text-emerald-400">Operador Logístico</div>
                <div className="text-[9px] text-slate-400 truncate">Gestión de Rutas</div>
              </button>
            </div>

            {/* Admin VIP section: ONLY visible if this is Hugo's authorized admin device */}
            {isAdminDevice ? (
              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  darkMode ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-emerald-50/80 border-emerald-300'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">👑</span>
                      <div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Acceso Administrador (Hugo)
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Dispositivo Autorizado Exclusivo
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLockAdminDevice}
                      title="Ocultar y bloquear el acceso administrador en este equipo"
                      className="text-[10px] font-semibold text-slate-400 hover:text-rose-500 px-2 py-1 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 transition-all"
                    >
                      🔒 Bloquear
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('admin@calico.com', 'calico2026')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <span>⚡ Cargar Credenciales de Administrador</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminModal(true);
                    setAdminUnlockError(null);
                    setAdminSecurityInput('');
                  }}
                  className="text-[11px] text-slate-400 hover:text-emerald-500 transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span>¿Eres Hugo (Administrador)? Habilitar tu acceso aquí</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-[11px] text-slate-400">
            Los choferes y operadores son dados de alta por el Administrador en el panel interno.
          </p>
        </div>
      </div>

      {/* Admin Unlock Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">
                  👑
                </div>
                <div>
                  <h3 className="text-base font-bold">Verificación de Administrador</h3>
                  <p className="text-[11px] text-slate-400">Exclusivo para Hugo (Calico)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Ingresa el PIN de seguridad o contraseña de administrador para desbloquear tu acceso exclusivo en este dispositivo.
            </p>

            {adminUnlockError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{adminUnlockError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAdmin} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                  PIN o Clave de Administrador
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="PIN 2026 o clave admin"
                  value={adminSecurityInput}
                  onChange={(e) => setAdminSecurityInput(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all ${
                    darkMode
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all ${
                    darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30"
                >
                  Habilitar Acceso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;

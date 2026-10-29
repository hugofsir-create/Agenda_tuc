import React from 'react';
import { AppUser } from '../types';

interface SidebarProps {
  darkMode?: boolean;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  onImport?: () => void;
  onImportExcel?: () => void;
  onLogout?: () => void;
  onOpenUserManagement?: () => void;
  onOpenInstallModal?: () => void;
  currentView: 'contacts' | 'gps_mode';
  onViewChange?: (view: 'contacts' | 'gps_mode') => void;
  user?: AppUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  darkMode, 
  onExportJSON, 
  onExportCSV, 
  onImport, 
  onImportExcel,
  onLogout,
  onOpenUserManagement,
  onOpenInstallModal,
  currentView,
  onViewChange,
  user
}) => {
  const isAdmin = user?.role === 'admin';
  const roleIcon = user?.role === 'admin' ? '👑' : user?.role === 'driver' ? '🚚' : '💼';

  return (
    <aside className={`w-64 min-h-screen hidden md:flex flex-col fixed left-0 top-0 h-full z-20 border-r ${darkMode ? 'bg-[#0a0b0b] border-slate-900' : 'bg-[#141617] border-slate-800'}`}>
      {/* Brand Header */}
      <div className={`p-6 border-b flex flex-col items-center justify-center text-center ${darkMode ? 'border-slate-900' : 'border-slate-800'}`}>
        <div className="mb-3 w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10"/>
            <circle cx="7" cy="18" r="2"/>
            <circle cx="17" cy="18" r="2"/>
          </svg>
        </div>
        <h1 className="text-base font-black text-white tracking-tight">
          Logitrack <span className="text-emerald-500">Calico</span>
        </h1>
        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Calico S.A. • Tucumán</p>
      </div>

      {/* Active User Card */}
      {user && (
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-3 bg-white/[0.02]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/30">
            {roleIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-emerald-400 font-medium truncate">{user.roleLabel}</p>
          </div>
        </div>
      )}
      
      {/* Navigation Links */}
      <nav className="flex-1 p-5 space-y-1.5 overflow-y-auto">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 px-3 text-slate-500">Navegación</p>
        
        <button 
          onClick={() => onViewChange?.('contacts')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-bold text-xs ${
            currentView === 'contacts' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>📇</span>
          <span>Directorio de Contactos</span>
        </button>

        <button 
          onClick={() => onViewChange?.('gps_mode')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-bold text-xs ${
            currentView === 'gps_mode' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>🗺️</span>
          <span>Modo GPS Chofer</span>
        </button>

        {/* Mobile Install QR Action */}
        <div className="pt-2">
          <button
            onClick={onOpenInstallModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 hover:text-white transition-all font-bold text-xs group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sm">📲</span>
              <span>Instalar en Celular</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-mono font-bold">QR</span>
          </button>
        </div>

        {/* Admin only: User Management */}
        {isAdmin && (
          <>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-5 mb-2 px-3 text-emerald-400/80">Administración</p>
            <button 
              onClick={onOpenUserManagement}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold text-xs"
            >
              <span>👥</span>
              <span>Gestión de Personal</span>
            </button>
          </>
        )}

        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-6 mb-2 px-3 text-slate-500">Herramientas</p>
        
        <button onClick={onExportCSV} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-xs">
          <span>📄</span>
          <span>Exportar CSV</span>
        </button>

        <button onClick={onExportJSON} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-xs">
          <span>💾</span>
          <span>Guardar Copia JSON</span>
        </button>

        <button onClick={onImport} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-xs">
          <span>📂</span>
          <span>Cargar JSON</span>
        </button>

        <button onClick={onImportExcel} className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-medium text-xs">
          <span>📊</span>
          <span>Importar Excel</span>
        </button>

        <div className="pt-4 mt-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all font-bold text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-white/5">
        <div className="rounded-xl p-3 bg-white/[0.03] text-slate-400 text-[10px] leading-relaxed">
          <span className="text-emerald-400 font-bold block mb-0.5">Calico Cloud</span>
          Datos sincronizados en tiempo real con Firebase.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

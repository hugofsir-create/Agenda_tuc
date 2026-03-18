
import React from 'react';
import { User } from '../types';

interface SidebarProps {
  darkMode?: boolean;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  onImport?: () => void;
  onLogout?: () => void;
  onViewUsers?: () => void;
  onViewContacts?: () => void;
  currentView: 'contacts' | 'users';
  userRole?: 'admin' | 'user';
}

const Sidebar: React.FC<SidebarProps> = ({ 
  darkMode, 
  onExportJSON, 
  onExportCSV, 
  onImport, 
  onLogout, 
  onViewUsers, 
  onViewContacts,
  currentView,
  userRole
}) => {
  return (
    <aside className={`w-64 min-h-screen flex flex-col fixed left-0 top-0 h-full z-20 border-r ${darkMode ? 'bg-[#0a0b0b] border-slate-900' : 'bg-[#1a1c1d] border-transparent'}`}>
      <div className={`p-8 border-b flex flex-col items-center justify-center text-center ${darkMode ? 'border-slate-900' : 'border-slate-800/30'}`}>
        <div className="mb-4">
          <svg className="text-emerald-500" xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V2H10v15z"/><path d="M22 17v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/></svg>
        </div>
        <h1 className="text-lg font-bold text-left">
          <span className="text-emerald-500">Logi</span>
          <span className="text-white">Track</span>
        </h1>
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Tucumán v5.0</p>
      </div>
      
      <nav className="flex-1 p-6 space-y-2 mt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-4 text-slate-500">Navegación</p>
        
        <button 
          onClick={onViewContacts} 
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs ${currentView === 'contacts' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          📇 Directorio
        </button>

        {userRole === 'admin' && (
          <button 
            onClick={onViewUsers} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-xs ${currentView === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            👥 Usuarios
          </button>
        )}

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-8 mb-4 px-4 text-slate-500">Herramientas</p>
        
        <button onClick={onExportCSV} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs">
          📄 Exportar CSV
        </button>

        <button onClick={onExportJSON} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs">
          💾 Guardar Copia
        </button>

        <button onClick={onImport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs">
          📂 Cargar Datos
        </button>

        <div className="pt-4 mt-4 border-t border-white/5">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-bold text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="p-6">
        <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-slate-950/50 border-slate-900 text-slate-600' : 'bg-white/5 border-white/5 text-slate-500'} text-[9px] leading-relaxed`}>
          Tus datos se guardan en este navegador. Usa "Guardar Copia" para respaldar tu información fuera de esta computadora.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  darkMode: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ darkMode }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 25); // 100 steps * 25ms = 2500ms (approx 2.5s to fill, leaving some buffer for the 3s total)

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-colors duration-500 ${darkMode ? 'bg-[#0f1110]' : 'bg-slate-50'}`}>
      <div className="w-full max-w-xs text-center">
        <div className="mb-8 animate-pulse">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-emerald-500 text-white mb-6 shadow-2xl shadow-emerald-500/20">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17h4V2H10v15z"/><path d="M22 17v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"/>
            </svg>
          </div>
          <h1 className={`text-3xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-emerald-500">Logi</span>Track Pro
          </h1>
        </div>

        <div className="space-y-3">
          <p className={`text-[10px] uppercase font-black tracking-[0.3em] ${darkMode ? 'text-emerald-500/60' : 'text-emerald-600/60'}`}>
            Calico S.A.
          </p>
          
          <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div 
              className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center px-1">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Iniciando Sistema
            </span>
            <span className={`text-[9px] font-mono font-bold ${darkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-center">
        <p className={`text-[9px] uppercase font-bold tracking-[0.2em] ${darkMode ? 'text-slate-700' : 'text-slate-300'}`}>
          Tucumán • Gestión de Transporte
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;

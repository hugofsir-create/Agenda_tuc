import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  deferredPrompt?: any;
  onPromptInstall?: () => void;
}

const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  darkMode,
  deferredPrompt,
  onPromptInstall
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get the full accessible URL
      setAppUrl(window.location.href);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!appUrl) return;
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isMobileDevice = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all max-h-[92vh] flex flex-col ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/30">
              📲
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">
                Instalar en el Celular
              </h3>
              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider">
                Logitrack Calico Móvil • Calico S.A.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Highlight Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
            <span className="text-xl">🚀</span>
            <div>
              <span className="font-bold block">Versión Celular Optimizada</span>
              <span className="text-slate-400 text-[11px] leading-tight block mt-0.5">
                Al escanear desde el celular, la aplicación se abre en modo Chofer/GPS exclusivo, sin vistas de PC innecesarias y con guiado satelital directo.
              </span>
            </div>
          </div>

          {/* QR Code Presentation Box */}
          <div className="flex flex-col items-center justify-center">
            <div className="p-4 rounded-3xl bg-white shadow-xl border-4 border-emerald-500/30 inline-block">
              {appUrl ? (
                <QRCodeCanvas
                  value={appUrl}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0a0b0b"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-400 text-xs">
                  Cargando QR...
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-center mt-3 text-slate-400">
              Apunta la cámara de tu celular a este código QR para abrir e instalar
            </p>
          </div>

          {/* Direct Install PWA button if on mobile and install prompt is available */}
          {deferredPrompt && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black text-xs">¡Instala la App ahora mismo!</p>
                <p className="text-[11px] text-emerald-100 truncate">Agrega el icono directo a tu pantalla de inicio.</p>
              </div>
              <button
                onClick={onPromptInstall}
                className="px-4 py-2 bg-white text-emerald-800 font-black rounded-xl text-xs hover:bg-emerald-50 transition-all shadow shrink-0"
              >
                Instalar Ahora
              </button>
            </div>
          )}

          {/* URL & Copy Link Action */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Enlace de Acceso Móvil</span>
              <p className="text-xs font-mono text-emerald-500 truncate mt-0.5">
                {appUrl}
              </p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : (darkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100')
              }`}
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <span>📋</span>
                  <span>Copiar Enlace</span>
                </>
              )}
            </button>
          </div>

          {/* OS Instructions Tabs */}
          <div>
            <div className="flex rounded-xl p-1 bg-slate-200 dark:bg-slate-800 mb-3">
              <button
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'android'
                    ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-900 shadow')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🤖</span>
                <span>Android (Google Chrome)</span>
              </button>
              <button
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'ios'
                    ? (darkMode ? 'bg-emerald-600 text-white shadow' : 'bg-white text-slate-900 shadow')
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🍏</span>
                <span>iPhone / iPad (Safari)</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                  <p className="text-slate-300 leading-snug">
                    Abre la <strong className="text-white">Cámara</strong> de tu celular y apunta al código QR. Toca el enlace emergente.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                  <p className="text-slate-300 leading-snug">
                    En Google Chrome, toca los <strong className="text-white">3 puntos (⋮)</strong> en la esquina superior derecha.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                  <p className="text-slate-300 leading-snug">
                    Selecciona <strong className="text-emerald-400">"Instalar aplicación"</strong> o <strong className="text-emerald-400">"Agregar a la pantalla principal"</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</span>
                  <p className="text-slate-300 leading-snug">
                    ¡Listo! Se añadirá el icono de <strong className="text-white">Logitrack Calico</strong> como app nativa a tu celular.
                  </p>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className={`p-4 rounded-2xl border space-y-2.5 text-xs ${
                darkMode ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                  <p className="text-slate-300 leading-snug">
                    Abre la app <strong className="text-white">Cámara</strong> de tu iPhone y apunta al código QR arriba. Toca el enlace amarillo.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                  <p className="text-slate-300 leading-snug">
                    En Safari, toca el botón <strong className="text-white">Compartir</strong> (icono central inferior: un cuadrado con flecha hacia arriba <span className="font-mono text-emerald-400">⎋</span>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                  <p className="text-slate-300 leading-snug">
                    Desliza hacia abajo y presiona <strong className="text-emerald-400">"Agregar al inicio"</strong> (+).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</span>
                  <p className="text-slate-300 leading-snug">
                    Toca <strong className="text-white">"Agregar"</strong> en la esquina superior derecha y la app quedará instalada.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-3 ${
          darkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
        }`}>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all text-center"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppModal;

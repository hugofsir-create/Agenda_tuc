import React, { useState } from 'react';
import { LogisticsContact } from '../types';

interface RouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: LogisticsContact | null;
  darkMode: boolean;
}

const RouteModal: React.FC<RouteModalProps> = ({
  isOpen,
  onClose,
  contact,
  darkMode
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !contact) return null;

  const destinationQuery = encodeURIComponent(`${contact.address}, ${contact.city}`);
  // Google Maps Turn-by-Turn GPS Navigation URL:
  const navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}&travelmode=driving`;
  // Search map view:
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${destinationQuery}`;
  // Waze Navigation fallback:
  const wazeUrl = `https://waze.com/ul?q=${destinationQuery}&navigate=yes`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${contact.address}, ${contact.city}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Header with Calico branding */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-2 mb-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <span>Navegación GPS • Calico S.A.</span>
          </div>
          <h3 className="text-xl font-black leading-tight">{contact.client}</h3>
          <p className="text-sm text-emerald-100 font-medium mt-1 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{contact.address}, {contact.city}</span>
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Main big CTA: Google Maps Navigation */}
          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-base shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 text-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            <span>Iniciar GPS en Google Maps</span>
          </a>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-3 px-4 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                darkMode ? 'bg-slate-950 border-slate-800 hover:border-emerald-500 text-slate-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-600 text-slate-800'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span>Ver en el Mapa</span>
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`py-3 px-4 rounded-xl border text-center text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                darkMode ? 'bg-slate-950 border-slate-800 hover:border-emerald-500 text-slate-200' : 'bg-slate-50 border-slate-200 hover:border-emerald-600 text-slate-800'
              }`}
            >
              <span>🚗 Abrir con Waze</span>
            </a>
          </div>

          {/* Quick contact and unloading details */}
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-3`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Contacto de Entrega</p>
                <p className="text-sm font-bold mt-0.5">{contact.contactName || 'Sin contacto especificado'}</p>
                {contact.phone && (
                  <p className="text-xs text-emerald-500 font-mono mt-0.5">{contact.phone}</p>
                )}
              </div>
              {contact.phone && (
                <div className="flex gap-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                    title="Llamar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </a>
                  <a
                    href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all"
                    title="WhatsApp"
                  >
                    <span className="text-xs font-bold">WA</span>
                  </a>
                </div>
              )}
            </div>

            {contact.unloadingHours && (
              <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Horarios de Descarga</p>
                <p className="text-xs font-semibold mt-0.5">{contact.unloadingHours}</p>
              </div>
            )}

            {contact.notes && (
              <div className="pt-2 border-t border-slate-200/40 dark:border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Notas de Logística</p>
                <p className="text-xs italic text-slate-500 mt-0.5">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Copy address button */}
          <button
            onClick={handleCopyAddress}
            className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              darkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <span>{copied ? '¡Dirección Copiada!' : 'Copiar Dirección al Portapapeles'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteModal;

import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LogisticsContact } from '../types';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: LogisticsContact | null;
  darkMode?: boolean;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, contact, darkMode }) => {
  if (!isOpen || !contact) return null;
  
  const destination = encodeURIComponent(`${contact.address}, ${contact.city}`);
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 no-print">
      <div className={`rounded-3xl shadow-2xl p-6 sm:p-8 max-w-sm w-full text-center border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Logitrack Calico</span>
        </div>
        <h3 className="text-xl font-black mb-1">Ruta GPS Chofer</h3>
        <p className="text-xs text-slate-400 mb-5 font-medium leading-relaxed">
          Escanea el código con tu celular para abrir Google Maps Navigation hacia: <br/>
          <span className="text-emerald-500 font-bold text-sm block mt-1">{contact.client}</span>
        </p>
        
        <div className="qr-container inline-block p-4 sm:p-5 rounded-2xl bg-white shadow-inner mb-4">
          <QRCodeCanvas 
            value={routeUrl} 
            size={190}
            level={"H"}
            includeMargin={false}
          />
        </div>

        <div className="space-y-1 mb-5">
           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Destino Calico:</p>
           <p className="text-xs font-semibold">{contact.address}, {contact.city}</p>
        </div>

        <div className="space-y-2">
          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            <span>Abrir en Google Maps</span>
          </a>

          <button 
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
              darkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRModal;

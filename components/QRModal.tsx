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
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 no-print">
      <div className={`rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <h3 className="text-xl font-bold mb-2">Ruta de Navegación</h3>
        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">Escanea este código con la cámara del celular para iniciar el GPS hasta: <br/><span className="text-emerald-500 font-bold">{contact.client}</span></p>
        
        <div className={`qr-container inline-block p-6 rounded-2xl bg-white shadow-inner mb-6`}>
          <QRCodeCanvas 
            value={routeUrl} 
            size={200}
            level={"H"}
            includeMargin={false}
          />
        </div>

        <div className="space-y-3">
           <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Destino Registrado:</p>
           <p className="text-xs font-semibold text-center">{contact.address}</p>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-3 rounded-xl bg-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-700 transition-all"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default QRModal;

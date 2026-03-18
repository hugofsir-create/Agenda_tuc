import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { LogisticsContact } from '../types';

interface PrintSectionProps {
  contact: LogisticsContact | null;
}

const PrintSection: React.FC<PrintSectionProps> = ({ contact }) => {
  if (!contact) return null;

  const destination = encodeURIComponent(`${contact.address}, ${contact.city}`);
  const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  return (
    <div id="print-section" className="hidden print:block font-serif text-black">
      <div className="border-4 border-black p-8 rounded-lg">
        <div className="flex justify-between items-start border-b-2 border-black pb-6 mb-6">
          <div>
            <h1 className="text-4xl font-black uppercase mb-1">{contact.client}</h1>
            <p className="text-xl font-bold text-gray-700">{contact.subClient || 'Cliente Principal'}</p>
            <p className="text-lg mt-4">📍 {contact.address}</p>
            <p className="text-lg">🏙 {contact.city}</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="p-2 border-2 border-black rounded-lg mb-2 bg-white">
              <QRCodeCanvas value={routeUrl} size={150} level="H" />
            </div>
            <p className="text-[10px] font-bold uppercase">Escanear para Navegación GPS</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-black inline-block pr-4">Contactos</h3>
            <div>
              <p className="font-bold text-sm uppercase text-gray-600">Responsable Principal</p>
              <p className="text-lg font-bold">{contact.contactName}</p>
              <p className="text-xl">{contact.phone}</p>
            </div>
            {contact.altContactName && (
              <div>
                <p className="font-bold text-sm uppercase text-gray-600">Contacto Alternativo</p>
                <p className="text-lg font-bold">{contact.altContactName}</p>
                <p className="text-xl">{contact.altPhone}</p>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold border-b border-black inline-block pr-4">Operación</h3>
            <div>
              <p className="font-bold text-sm uppercase text-gray-600">Horario Operativo</p>
              <p className="text-xl font-bold">{contact.unloadingHours || 'Sin definir'}</p>
            </div>
            <div>
              <p className="font-bold text-sm uppercase text-gray-600">Observaciones</p>
              <p className="text-lg leading-snug">{contact.notes || '---'}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-center text-gray-500 italic text-sm">
          <span>LogiTrack Pro - Tucumán</span>
          <span>Fecha de impresión: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PrintSection;

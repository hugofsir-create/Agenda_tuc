
import React, { useState, useEffect } from 'react';
import { LogisticsContact } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: LogisticsContact) => void;
  initialData?: LogisticsContact | null;
  darkMode?: boolean;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSave, initialData, darkMode }) => {
  const [formData, setFormData] = useState<Partial<LogisticsContact>>({
    client: '',
    subClient: '',
    contactName: '',
    phone: '',
    altContactName: '',
    altPhone: '',
    city: '',
    address: '',
    unloadingHours: '',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        client: '',
        subClient: '',
        contactName: '',
        phone: '',
        altContactName: '',
        altPhone: '',
        city: '',
        address: '',
        unloadingHours: '',
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      lastContacted: initialData?.lastContacted || new Date().toISOString().split('T')[0]
    } as LogisticsContact;
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {initialData ? 'Editar Operación' : 'Registrar Punto Operativo'}
          </h2>
          <button onClick={onClose} className={`text-lg transition-colors ${darkMode ? 'text-slate-700 hover:text-white' : 'text-slate-300 hover:text-slate-800'}`}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Empresa</label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Nombre de la entidad"
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Sucursal / Filial</label>
              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.subClient}
                onChange={(e) => setFormData({ ...formData, subClient: e.target.value })}
                placeholder="Punto específico"
              />
            </div>
            
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Responsable</label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Teléfono</label>
              <input
                required
                type="tel"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Ciudad</label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Horarios</label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.unloadingHours}
                onChange={(e) => setFormData({ ...formData, unloadingHours: e.target.value })}
                placeholder="Ej. 08:00 - 17:00"
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Dirección</label>
            <input
              required
              type="text"
              className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Observaciones</label>
            <textarea
              className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className={`pt-6 flex justify-end gap-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <button type="button" onClick={onClose} className={`px-5 py-2 font-bold transition-all text-sm ${darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-700'}`}>Cancelar</button>
            <button type="submit" className={`px-8 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-md ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-700 text-white hover:bg-emerald-800'}`}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;

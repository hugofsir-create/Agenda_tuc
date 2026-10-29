import React, { useState, useEffect } from 'react';
import { LogisticsContact, AppUser } from '../types';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: LogisticsContact) => void;
  onSubmitRequest?: (requestData: Omit<LogisticsContact, 'id'>) => Promise<void> | void;
  initialData?: LogisticsContact | null;
  darkMode?: boolean;
  user?: AppUser | null;
}

const ContactModal: React.FC<ContactModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onSubmitRequest,
  initialData, 
  darkMode,
  user
}) => {
  const isDriver = user?.role === 'driver';
  const isAdmin = user?.role === 'admin';

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isDriver && onSubmitRequest) {
        // Driver creates a proposal request
        await onSubmitRequest({
          client: formData.client || '',
          subClient: formData.subClient || '',
          contactName: formData.contactName || '',
          phone: formData.phone || '',
          altContactName: formData.altContactName || '',
          altPhone: formData.altPhone || '',
          city: formData.city || '',
          address: formData.address || '',
          unloadingHours: formData.unloadingHours || '',
          notes: formData.notes || ''
        });
      } else {
        // Admin or direct save
        const finalData = {
          ...formData,
          id: initialData?.id || Math.random().toString(36).substr(2, 9),
          lastContacted: initialData?.lastContacted || new Date().toISOString().split('T')[0]
        } as LogisticsContact;
        await onSave(finalData);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {isDriver ? '🚚' : initialData ? '✏️' : '🏢'}
            </span>
            <div>
              <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                {isDriver 
                  ? 'Solicitar Nuevo Punto Operativo' 
                  : initialData 
                    ? 'Editar Contacto Operativo' 
                    : 'Registrar Nuevo Contacto Operativo'
                }
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isDriver ? 'Petición sujeta a validación por el Administrador' : 'Directorio Corporativo Calico'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`text-lg p-1 rounded-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
            &times;
          </button>
        </div>

        {/* Notice for Driver */}
        {isDriver && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-3 flex items-start gap-3 text-amber-300 text-xs">
            <span className="text-base shrink-0">ℹ️</span>
            <p className="leading-relaxed">
              <strong>Atención Chofer:</strong> Al guardar este contacto, se generará una <strong>petición pendiente</strong> en la pantalla del Administrador. Una vez que sea aprobada por administración, quedará visible en el directorio oficial.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Empresa / Cliente *
              </label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Ej. Arcor, Distribuidora Norte"
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Sucursal / Filial
              </label>
              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.subClient}
                onChange={(e) => setFormData({ ...formData, subClient: e.target.value })}
                placeholder="Ej. Centro de Distribución Banda del Río Salí"
              />
            </div>
            
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Persona de Contacto / Encargado *
              </label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Ej. Ing. Carlos Pérez"
              />
            </div>
            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Teléfono de Contacto *
              </label>
              <input
                required
                type="tel"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej. 381 456-7890"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Ciudad / Localidad *
              </label>
              <input
                required
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ej. San Miguel de Tucumán"
              />
            </div>

            <div>
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Horarios de Descarga / Atención
              </label>
              <input
                type="text"
                className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                value={formData.unloadingHours}
                onChange={(e) => setFormData({ ...formData, unloadingHours: e.target.value })}
                placeholder="Ej. Lun a Vie 07:00 a 15:00 hs"
              />
            </div>
          </div>
          
          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Dirección Exacta (para Google Maps GPS) *
            </label>
            <input
              required
              type="text"
              className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej. Av. Siria 1250, San Miguel de Tucumán"
            />
          </div>

          <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Observaciones / Datos para el Chofer (acceso, portón, tipo de camión)
            </label>
            <textarea
              className={`w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Ej. Ingreso por portón lateral sobre calle lateral. Exigen casco y calzado de seguridad."
            />
          </div>

          <div className={`pt-4 flex justify-end gap-3 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isSubmitting}
              className={`px-5 py-2.5 font-bold transition-all text-xs rounded-xl ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-7 py-2.5 rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-md flex items-center gap-2 ${
                isDriver 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <span>{isDriver ? '📤' : '💾'}</span>
              <span>
                {isSubmitting 
                  ? 'Guardando...' 
                  : isDriver 
                    ? 'Enviar a Aprobación' 
                    : initialData 
                      ? 'Actualizar Contacto' 
                      : 'Guardar en Directorio'
                }
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;

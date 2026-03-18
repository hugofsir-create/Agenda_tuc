
import React, { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shipment: Shipment) => void;
  initialData?: Shipment | null;
}

const ShipmentModal: React.FC<ShipmentModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Shipment>>({
    origin: '',
    destination: '',
    driverName: '',
    cargoType: '',
    weight: 0,
    date: new Date().toISOString().split('T')[0],
    status: ShipmentStatus.PENDING,
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        origin: '',
        destination: '',
        driverName: '',
        cargoType: '',
        weight: 0,
        date: new Date().toISOString().split('T')[0],
        status: ShipmentStatus.PENDING,
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
    } as Shipment;
    onSave(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            {initialData ? 'Editar Envío' : 'Registrar Nuevo Envío'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
              <input
                required
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                placeholder="Ej. CDMX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
              <input
                required
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Ej. Monterrey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conductor</label>
              <input
                required
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Salida</label>
              <input
                required
                type="date"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Carga</label>
              <input
                required
                type="text"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.cargoType}
                onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                placeholder="Ej. Perecederos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
              <input
                required
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
              <select
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ShipmentStatus })}
              >
                <option value={ShipmentStatus.PENDING}>Pendiente</option>
                <option value={ShipmentStatus.IN_TRANSIT}>En Tránsito</option>
                <option value={ShipmentStatus.DELIVERED}>Entregado</option>
                <option value={ShipmentStatus.CANCELLED}>Cancelado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas Adicionales</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Detalles sobre la carga, cliente o instrucciones especiales..."
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium"
            >
              Guardar Registro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentModal;

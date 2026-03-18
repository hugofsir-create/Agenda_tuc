import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  initialData?: User | null;
  darkMode?: boolean;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, initialData, darkMode }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    username: '',
    password: '',
    name: '',
    role: 'user'
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'user'
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
    } as User;
    onSave(finalData);
  };

  const inputClass = `w-full border rounded-xl px-4 py-2.5 outline-none transition-all text-sm font-medium ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`;
  const labelClass = `block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
          <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button onClick={onClose} className={`text-lg transition-colors ${darkMode ? 'text-slate-700 hover:text-white' : 'text-slate-300 hover:text-slate-800'}`}>
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>Nombre Completo</label>
            <input
              required
              type="text"
              className={inputClass}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className={labelClass}>Nombre de Usuario</label>
            <input
              required
              type="text"
              className={inputClass}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="usuario123"
            />
          </div>
          <div>
            <label className={labelClass}>Contraseña</label>
            <input
              required
              type="password"
              className={inputClass}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className={labelClass}>Rol de Usuario</label>
            <select
              className={inputClass}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
            >
              <option value="user">Usuario Operativo</option>
              <option value="admin">Administrador</option>
            </select>
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

export default UserModal;

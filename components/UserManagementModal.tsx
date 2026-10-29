import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { authService } from '../services/authService';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  darkMode: boolean;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  darkMode
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('driver');
  const [newPhone, setNewPhone] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getAllUsers();
      setUsers(data);
    } catch (e: any) {
      setErrorMessage('Error al cargar la lista de personal.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setErrorMessage('Por favor complete todos los campos obligatorios.');
      return;
    }

    try {
      await authService.createUser({
        name: newName,
        username: newUsername,
        password: newPassword,
        role: newRole,
        phone: newPhone
      });
      setSuccessMessage(`Usuario ${newUsername} registrado exitosamente.`);
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      setNewRole('driver');
      setActiveTab('list');
      await loadUsers();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear usuario.');
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    try {
      await authService.toggleUserStatus(user.id);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado.');
    }
  };

  const handleDeleteUser = async (user: AppUser) => {
    if (window.confirm(`¿Está seguro de eliminar al usuario ${user.name} (${user.username})?`)) {
      try {
        await authService.deleteUser(user.id);
        await loadUsers();
      } catch (err: any) {
        alert(err.message || 'Error al eliminar usuario.');
      }
    }
  };

  const handleResetPassword = async (user: AppUser) => {
    const newPass = prompt(`Ingrese la nueva contraseña para ${user.name}:`);
    if (newPass && newPass.trim().length >= 4) {
      try {
        await authService.updateUser(user.id, { password: newPass.trim() });
        alert(`Contraseña actualizada para ${user.username}`);
        await loadUsers();
      } catch (err: any) {
        alert(err.message || 'Error al actualizar contraseña');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              👥
            </div>
            <div>
              <h3 className="text-xl font-bold">Administración de Personal y Accesos</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Logitrack Calico • Alta y control de Choferes, Operadores y Administradores
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`flex border-b px-6 pt-3 gap-4 text-xs font-bold ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-white'}`}>
          <button 
            onClick={() => setActiveTab('list')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'list' 
                ? 'border-emerald-500 text-emerald-500' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Personal Registrado</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px]">
              {users.length}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'create' 
                ? 'border-emerald-500 text-emerald-500' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>+ Alta de Nuevo Chofer / Operador</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
            {successMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Cargando usuarios...
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No hay usuarios registrados aún.
                </div>
              ) : (
                users.map(u => {
                  const isCurrent = currentUser?.id === u.id;
                  const roleBadge = u.role === 'admin' 
                    ? { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: '👑', label: 'Administrador' }
                    : u.role === 'driver'
                    ? { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🚚', label: 'Chofer' }
                    : { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '💼', label: 'Operador' };

                  return (
                    <div 
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${
                        darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-lg">
                          {roleBadge.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm">{u.name}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Tu sesión actual
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {u.username} {u.phone ? `• 📞 ${u.phone}` : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadge.bg}`}>
                              {roleBadge.label}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-500' 
                                : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {u.status === 'active' ? '● Activo' : '○ Inactivo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleResetPassword(u)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                            darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-white text-slate-700'
                          }`}
                          title="Restablecer clave"
                        >
                          🔑 Clave
                        </button>

                        {!isCurrent && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              u.status === 'active' 
                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspender' : 'Activar'}
                          </button>
                        )}

                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all"
                            title="Eliminar usuario"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                  Nombre Completo
                </label>
                <input 
                  type="text"
                  required
                  placeholder="ej. Juan Carlos Pérez"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Usuario / Correo
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="ej. jperez o jperez@calico.com"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Contraseña Inicial
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Rol en la Empresa
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-medium ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    <option value="driver">🚚 Chofer / Repartidor</option>
                    <option value="operator">💼 Operador Logístico</option>
                    <option value="admin">👑 Administrador General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                    Teléfono Móvil (Opcional)
                  </label>
                  <input 
                    type="tel"
                    placeholder="ej. +54 381 456-7890"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${
                    darkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Crear Usuario
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t px-6 flex justify-between items-center text-[11px] ${darkMode ? 'border-slate-800 bg-slate-950/40 text-slate-500' : 'border-slate-100 bg-slate-50 text-slate-500'}`}>
          <span>Los usuarios creados pueden ingresar directamente en la pantalla de inicio de Logitrack Calico.</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;


import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ContactModal from './components/ContactModal';
import PrintSection from './components/PrintSection';
import QRModal from './components/QRModal';
import Login from './components/Login';
import UserModal from './components/UserModal';
import LoadingScreen from './components/LoadingScreen';
import { LogisticsContact, User } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('logicon_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('logicon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [currentView, setCurrentView] = useState<'contacts' | 'users'>('contacts');
  const [contacts, setContacts] = useState<LogisticsContact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<LogisticsContact | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [printingContact, setPrintingContact] = useState<LogisticsContact | null>(null);
  const [qrModalContact, setQrModalContact] = useState<LogisticsContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('logicon_theme');
    return saved === 'dark';
  });

  useEffect(() => {
    const savedContacts = localStorage.getItem('logicon_contacts');
    if (savedContacts) {
      setContacts(JSON.parse(savedContacts));
    } else {
      const initialContacts: LogisticsContact[] = [
        {
          id: '1',
          client: 'Ejemplo Logística',
          subClient: 'Sucursal Centro',
          contactName: 'Juan Pérez',
          phone: '555-0123',
          altContactName: '',
          altPhone: '',
          city: 'Tucumán',
          address: 'Calle Falsa 123',
          unloadingHours: '08:00 - 18:00',
          notes: 'Ejemplo de registro local.',
          lastContacted: new Date().toISOString().split('T')[0]
        }
      ];
      setContacts(initialContacts);
    }

    const savedUsers = localStorage.getItem('logicon_users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const defaultAdmin: User = {
        id: 'admin-1',
        username: 'admin',
        password: '1234',
        role: 'admin',
        name: 'Administrador Sistema'
      };
      setUsers([defaultAdmin]);
      localStorage.setItem('logicon_users', JSON.stringify([defaultAdmin]));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('logicon_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('logicon_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('logicon_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const filteredContacts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return contacts.filter(c => 
      c.client.toLowerCase().includes(s) ||
      c.contactName.toLowerCase().includes(s) ||
      c.city.toLowerCase().includes(s)
    );
  }, [contacts, searchTerm]);

  const handleSaveContact = (contact: LogisticsContact) => {
    if (currentContact) {
      setContacts(prev => prev.map(c => c.id === contact.id ? contact : c));
    } else {
      setContacts(prev => [...prev, contact]);
    }
    setIsModalOpen(false);
    setCurrentContact(null);
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('¿Eliminar este registro?')) {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const openEditModal = (contact: LogisticsContact) => {
    setCurrentContact(contact);
    setIsModalOpen(true);
  };

  const handlePrint = (contact: LogisticsContact) => {
    setPrintingContact(contact);
    setTimeout(() => {
      window.print();
      setPrintingContact(null);
    }, 300);
  };

  const handleLogin = (user: User) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('logicon_auth', 'true');
    localStorage.setItem('logicon_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('logicon_auth');
    localStorage.removeItem('logicon_user');
  };

  const handleSaveUser = (user: User) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === user.id ? user : u));
    } else {
      setUsers([...users, user]);
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const getMapsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city}`)}`;
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agenda_logistica_respaldo.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Cliente', 'Contacto', 'Teléfono', 'Ciudad', 'Dirección', 'Horarios'];
    const rows = contacts.map(c => [`"${c.client}"`, `"${c.contactName}"`, `"${c.phone}"`, `"${c.city}"`, `"${c.address}"`, `"${c.unloadingHours}"`]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agenda_logistica.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && window.confirm('¿Reemplazar datos actuales?')) {
          setContacts(json);
        }
      } catch (err) { alert('Error al leer el archivo.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} darkMode={darkMode} />;
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-[#0f1110] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        darkMode={darkMode} 
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
        onImport={handleImportClick}
        onLogout={handleLogout}
        onViewUsers={() => setCurrentView('users')}
        onViewContacts={() => setCurrentView('contacts')}
        currentView={currentView}
        userRole={currentUser?.role}
      />
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
      
      <main className="flex-1 ml-64 p-8 lg:p-12">
        {currentView === 'contacts' ? (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Directorio de Contactos
                </h2>
                <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Gestión local sin conexión
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <button 
                  onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
                  className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  Añadir Registro
                </button>
              </div>
            </header>

            <div className="space-y-6">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-96">
                    <input 
                      type="text"
                      placeholder="Buscar por empresa, contacto o ciudad..."
                      className={`w-full pl-4 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className={`flex p-1 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'table' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-white text-slate-800') : 'text-slate-500'}`}>Tabla</button>
                    <button onClick={() => setViewMode('grid')} className={`px-4 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'grid' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-white text-slate-800') : 'text-slate-500'}`}>Tarjetas</button>
                  </div>
                </div>
              </div>

              {viewMode === 'table' ? (
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'bg-slate-950 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                        <tr>
                          <th className="px-6 py-4">Empresa</th>
                          <th className="px-6 py-4">Contacto</th>
                          <th className="px-6 py-4">Teléfono</th>
                          <th className="px-6 py-4">Ciudad</th>
                          <th className="px-6 py-4">Dirección</th>
                          <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {filteredContacts.map((c) => (
                          <tr key={c.id} className={`${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-4 font-bold text-sm">{c.client}</td>
                            <td className="px-6 py-4 text-sm">{c.contactName}</td>
                            <td className="px-6 py-4 text-sm">{c.phone}</td>
                            <td className="px-6 py-4 text-sm">{c.city}</td>
                            <td className="px-6 py-4 text-sm">
                              <a 
                                href={getMapsUrl(c.address, c.city)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-500 hover:underline flex items-center gap-1"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {c.address}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button onClick={() => handlePrint(c)} className="text-slate-500 hover:text-emerald-500 p-1" title="Imprimir Ficha">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                              </button>
                              <button onClick={() => setQrModalContact(c)} className="text-emerald-500 hover:text-emerald-400 p-1" title="Generar QR de Ruta">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="9" y="9" width="1" height="1"/><rect x="14" y="9" width="1" height="1"/><rect x="9" y="14" width="1" height="1"/></svg>
                              </button>
                              <button onClick={() => openEditModal(c)} className="text-emerald-500 hover:underline text-xs font-bold">Editar</button>
                              <button onClick={() => handleDeleteContact(c.id)} className="text-rose-500 hover:underline text-xs font-bold">Borrar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContacts.map((c) => (
                    <div key={c.id} className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg">{c.client}</h4>
                        <div className="flex gap-2">
                          <button onClick={() => handlePrint(c)} className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-500" title="Imprimir Ficha">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                          </button>
                          <button onClick={() => setQrModalContact(c)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500" title="Generar QR de Ruta">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="9" y="9" width="1" height="1"/><rect x="14" y="9" width="1" height="1"/><rect x="9" y="14" width="1" height="1"/></svg>
                          </button>
                          <button onClick={() => openEditModal(c)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => handleDeleteContact(c.id)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Responsable</p>
                          <p className="text-sm font-medium">{c.contactName} • {c.phone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500">Ubicación</p>
                          <p className="text-sm font-medium">{c.city}</p>
                          <a 
                            href={getMapsUrl(c.address, c.city)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-500 font-bold hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            {c.address}
                          </a>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl text-xs italic border border-dashed ${darkMode ? 'bg-slate-950/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {c.notes || 'Sin notas.'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <header className="flex justify-between items-center mb-10">
              <div>
                <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Gestión de Usuarios
                </h2>
                <p className={`text-sm mt-1 font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Administración de accesos al sistema
                </p>
              </div>
              <button 
                onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>
                Nuevo Usuario
              </button>
            </header>

            <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'bg-slate-950 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                    <tr>
                      <th className="px-6 py-4">Nombre</th>
                      <th className="px-6 py-4">Usuario</th>
                      <th className="px-6 py-4">Rol</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {users.map((u) => (
                      <tr key={u.id} className={`${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 font-bold text-sm">{u.name}</td>
                        <td className="px-6 py-4 text-sm">{u.username}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }} className="text-emerald-500 hover:underline text-xs font-bold">Editar</button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)} 
                            className={`text-rose-500 hover:underline text-xs font-bold ${u.username === 'admin' ? 'hidden' : ''}`}
                          >
                            Borrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveContact} initialData={currentContact} darkMode={darkMode} />
      <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} initialData={editingUser} darkMode={darkMode} />
      <QRModal isOpen={!!qrModalContact} onClose={() => setQrModalContact(null)} contact={qrModalContact} darkMode={darkMode} />
      <PrintSection contact={printingContact} />
    </div>
  );
};

export default App;

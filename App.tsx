import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ContactModal from './components/ContactModal';
import PrintSection from './components/PrintSection';
import QRModal from './components/QRModal';
import RouteModal from './components/RouteModal';
import LoadingScreen from './components/LoadingScreen';
import LoginScreen from './components/LoginScreen';
import UserManagementModal from './components/UserManagementModal';
import InstallAppModal from './components/InstallAppModal';
import PendingRequestsModal from './components/PendingRequestsModal';
import { LogisticsContact, AppUser, ContactRequest } from './types';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { authService } from './services/authService';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp, 
  writeBatch
} from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(() => authService.getCurrentUser());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [activeTab, setActiveTab] = useState<'contacts' | 'gps_mode'>('contacts');
  const [contacts, setContacts] = useState<LogisticsContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Mobile screen detection - locks mobile to grid/driver cards and prevents PC table view
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // PWA install prompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Role checks
  const isAdmin = user?.role === 'admin';
  const isDriver = user?.role === 'driver';

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<LogisticsContact | null>(null);
  const [printingContact, setPrintingContact] = useState<LogisticsContact | null>(null);
  const [qrModalContact, setQrModalContact] = useState<LogisticsContact | null>(null);
  const [routeModalContact, setRouteModalContact] = useState<LogisticsContact | null>(null);

  // Requests state
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [requestNotification, setRequestNotification] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('logicon_theme');
    return saved === 'dark';
  });

  // Listen to manual auth state changes
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to contacts in Firestore (shared company database for Calico)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'contacts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      })) as LogisticsContact[];
      setContacts(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'contacts');
    });

    return () => unsubscribe();
  }, [user]);

  // Listen to contact requests in Firestore
  useEffect(() => {
    if (!user) return;

    const qReqs = query(collection(db, 'contact_requests'));
    const unsubscribe = onSnapshot(qReqs, (snapshot) => {
      const data = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id
      })) as ContactRequest[];
      // sort latest first
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setContactRequests(data);
    }, (error) => {
      console.warn('contact_requests listener error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const pendingRequestsCount = useMemo(() => {
    return contactRequests.filter(r => r.status === 'pending').length;
  }, [contactRequests]);

  // Dark mode class sync
  useEffect(() => {
    localStorage.setItem('logicon_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Screen size mobile detector - locks view to cards & prevents PC table on mobile
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && viewMode === 'table') {
        setViewMode('grid');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // PWA beforeinstallprompt handler
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handlePromptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Unique cities list for filtering
  const cities = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => {
      if (c.city && c.city.trim()) set.add(c.city.trim());
    });
    return Array.from(set).sort();
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return contacts.filter(c => {
      const matchesSearch = 
        (c.client || '').toLowerCase().includes(s) ||
        (c.contactName || '').toLowerCase().includes(s) ||
        (c.city || '').toLowerCase().includes(s) ||
        (c.address || '').toLowerCase().includes(s) ||
        (c.phone || '').toLowerCase().includes(s);

      const matchesCity = selectedCity === 'all' || c.city === selectedCity;
      return matchesSearch && matchesCity;
    });
  }, [contacts, searchTerm, selectedCity]);

  // Save or edit contact (Admin only)
  const handleSaveContact = async (contact: LogisticsContact) => {
    if (!user) return;
    if (!isAdmin) {
      alert('Solo el Administrador puede registrar o editar contactos directamente en el directorio.');
      return;
    }

    try {
      if (currentContact) {
        const contactRef = doc(db, 'contacts', contact.id);
        const { id: _unusedId, ...contactData } = contact;
        await updateDoc(contactRef, {
          ...contactData,
          updatedAt: serverTimestamp()
        });
      } else {
        const newContactRef = doc(collection(db, 'contacts'));
        await setDoc(newContactRef, {
          ...contact,
          id: newContactRef.id,
          ownerId: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      setCurrentContact(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contacts');
    }
  };

  // Submit contact proposal request (Driver role)
  const handleSubmitContactRequest = async (requestData: Omit<LogisticsContact, 'id'>) => {
    if (!user) return;
    try {
      const newReqRef = doc(collection(db, 'contact_requests'));
      await setDoc(newReqRef, {
        ...requestData,
        id: newReqRef.id,
        submittedByUserId: user.id,
        submittedByName: user.name,
        submittedByRole: user.role,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setRequestNotification(`✅ Solicitud para "${requestData.client}" enviada con éxito. Quedará visible en el directorio una vez que el Administrador la apruebe.`);
      setTimeout(() => setRequestNotification(null), 6000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contact_requests');
    }
  };

  // Delete single contact (Admin only)
  const handleDeleteContact = async (id: string) => {
    if (!isAdmin) {
      alert('Acción restringida: Solo el Administrador puede eliminar registros.');
      return;
    }
    if (window.confirm('¿Eliminar este registro de contacto?')) {
      try {
        await deleteDoc(doc(db, 'contacts', id));
        setSelectedIds(prev => prev.filter(sid => sid !== id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `contacts/${id}`);
      }
    }
  };

  // Massive delete (Admin only)
  const handleMassiveDelete = async () => {
    if (!isAdmin) {
      alert('Acción restringida: Solo el Administrador puede realizar eliminaciones masivas.');
      return;
    }
    if (window.confirm(`¿Está seguro de eliminar los ${selectedIds.length} registros seleccionados de la base de datos de Calico?`)) {
      try {
        const batch = writeBatch(db);
        selectedIds.forEach(id => {
          batch.delete(doc(db, 'contacts', id));
        });
        await batch.commit();
        setSelectedIds([]);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'contacts (massive)');
      }
    }
  };

  const toggleSelectAll = () => {
    if (!isAdmin) return;
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (!isAdmin) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const openEditModal = (contact: LogisticsContact) => {
    if (!isAdmin) {
      alert('Acción restringida: Solo el Administrador puede editar contactos existentes.');
      return;
    }
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

  const toggleTheme = () => setDarkMode(!darkMode);

  // Turn-by-turn navigation in Google Maps
  const getGoogleMapsDirectionsUrl = (address: string, city: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, ${city}`)}&travelmode=driving`;
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(contacts, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logitrack_calico_contactos.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = ['Cliente', 'Contacto', 'Teléfono', 'Ciudad', 'Dirección', 'Horarios', 'Notas'];
    const rows = contacts.map(c => [
      `"${c.client || ''}"`,
      `"${c.contactName || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      `"${c.address || ''}"`,
      `"${c.unloadingHours || ''}"`,
      `"${c.notes || ''}"`
    ]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logitrack_calico_agenda.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    if (!isAdmin) {
      alert('Solo el Administrador puede importar contactos.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleImportExcelClick = () => {
    if (!isAdmin) {
      alert('Solo el Administrador puede importar contactos desde Excel.');
      return;
    }
    excelInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !isAdmin) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json) && window.confirm(`¿Importar ${json.length} registros a Logitrack Calico?`)) {
          const batch = writeBatch(db);
          json.forEach((c: any) => {
            const newRef = doc(collection(db, 'contacts'));
            batch.set(newRef, {
              ...c,
              id: newRef.id,
              ownerId: user.id,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
      } catch (err) { alert('Error al leer el archivo JSON.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Specific Excel mapping: Col D (Empresa), Col B (Contacto), Col P (Teléfono), Col M (Ciudad), Col L (Dirección)
  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (Array.isArray(rows) && rows.length > 0) {
          const startIdx = isNaN(Number(rows[0][3])) ? 1 : 0; 

          const mappedContactsData = rows.slice(startIdx).filter(row => row.length > 0).map((row: any) => {
            const getValue = (idx: number) => row[idx] ? String(row[idx]).trim() : '';
            return {
              client: getValue(3) || 'S/N Empresa', // Col D
              subClient: '', 
              contactName: getValue(1), // Col B
              phone: getValue(15), // Col P
              altContactName: '',
              altPhone: '',
              city: getValue(12) || 'Tucumán', // Col M
              address: getValue(11), // Col L
              unloadingHours: '',
              notes: 'Importado vía Excel Calico (Col D, B, P, M, L)',
              lastContacted: new Date().toISOString().split('T')[0]
            };
          }).filter(c => c.client && c.address);

          if (mappedContactsData.length === 0) {
            alert('No se encontraron registros válidos en las columnas indicadas.');
            return;
          }

          if (window.confirm(`Se encontraron ${mappedContactsData.length} contactos en el archivo Excel. ¿Desea importarlos a Logitrack Calico?`)) {
            const batch = writeBatch(db);
            mappedContactsData.forEach(contactData => {
              const newRef = doc(collection(db, 'contacts'));
              batch.set(newRef, {
                ...contactData,
                id: newRef.id,
                ownerId: user.id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            });
            await batch.commit();
            alert(`¡Se importaron ${mappedContactsData.length} contactos exitosamente!`);
          }
        }
      } catch (err) {
        console.error(err);
        alert('Error al procesar el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  // If not logged in, show manual login screen
  if (!user) {
    return (
      <>
        <LoginScreen 
          darkMode={darkMode} 
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} 
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
          darkMode={darkMode}
          deferredPrompt={deferredPrompt}
          onPromptInstall={handlePromptInstall}
        />
      </>
    );
  }

  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${darkMode ? 'bg-[#0a0b0b] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Desktop Sidebar */}
      <Sidebar 
        darkMode={darkMode} 
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
        onImport={handleImportClick}
        onImportExcel={handleImportExcelClick}
        currentView={activeTab}
        onViewChange={(v) => setActiveTab(v)}
        onLogout={() => authService.logout()}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenPendingRequests={() => setIsPendingRequestsOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
        user={user}
      />

      {/* Hidden file inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
      <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />

      {/* Mobile Top App Bar (visible only on mobile) */}
      <header className={`md:hidden sticky top-0 z-30 px-3.5 py-2.5 border-b flex items-center justify-between backdrop-blur-md ${
        darkMode ? 'bg-[#0a0b0b]/90 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30 overflow-hidden p-0.5">
            <img
              src="/truck-app-icon.svg"
              alt="Camión Logitrack"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight leading-none">
                Logitrack <span className="text-emerald-500">Calico</span>
              </h1>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {isAdmin ? 'Admin' : 'Chofer'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[130px] mt-0.5">
              {user.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Admin Pending Requests Button on Mobile */}
          {isAdmin && (
            <button
              onClick={() => setIsPendingRequestsOpen(true)}
              className={`relative p-2 rounded-xl border text-xs ${
                pendingRequestsCount > 0
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                  : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Solicitudes Pendientes de Choferes"
            >
              <span>📋</span>
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          <button 
            onClick={() => setIsInstallModalOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
            title="Instalar en Celular / Código QR"
          >
            <span>📲</span>
            <span className="text-[11px] font-black">Instalar</span>
          </button>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-xl border text-xs ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button 
            onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
            className={`p-2 rounded-xl font-bold shadow-md flex items-center gap-1 text-xs ${
              isAdmin 
                ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
                : 'bg-amber-500 text-slate-950 shadow-amber-500/30'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span className="hidden sm:inline">{isAdmin ? 'Nuevo' : 'Solicitar'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 sm:p-6 lg:p-10 pb-28 md:pb-10 max-w-7xl">
        
        {/* Driver request submitted notification banner */}
        {requestNotification && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-amber-500/5 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⏳</span>
              <span>{requestNotification}</span>
            </div>
            <button onClick={() => setRequestNotification(null)} className="text-amber-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {/* Desktop Header */}
        <header className="hidden md:flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl lg:text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'gps_mode' ? 'Modo Guiado GPS Chofer' : 'Directorio de Contactos y Destinos'}
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Calico S.A.
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {user.roleLabel}
              </span>
            </div>
            <p className={`text-xs sm:text-sm mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeTab === 'gps_mode' 
                ? 'Seleccione cualquier destino para iniciar la navegación guiada por Google Maps.' 
                : isDriver
                  ? 'Como chofer puedes consultar el directorio y solicitar nuevos puntos para revisión.'
                  : 'Sincronizado en tiempo real con Firebase en la nube.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Admin Pending Requests Button */}
            {isAdmin && (
              <button
                onClick={() => setIsPendingRequestsOpen(true)}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all shadow-sm ${
                  pendingRequestsCount > 0
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30 animate-pulse'
                    : darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Ver solicitudes pendientes de choferes"
              >
                <span className="text-sm">📋</span>
                <span>Solicitudes Choferes</span>
                {pendingRequestsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={() => setIsInstallModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:text-white transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
              title="Generar código QR para instalar en smartphone"
            >
              <span className="text-base">📲</span>
              <span>Instalar en Celular (QR)</span>
            </button>
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              title="Cambiar tema"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
              className={`px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 text-sm ${
                isAdmin 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30' 
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/30 font-black'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>{isAdmin ? 'Añadir Registro' : 'Cargar Nuevo Punto'}</span>
            </button>
          </div>
        </header>

        {/* GPS Mode Driver Banner */}
        {activeTab === 'gps_mode' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                🚚
              </div>
              <div>
                <h3 className="font-black text-base">Modo Ruta y Navegación GPS Activo</h3>
                <p className="text-xs text-emerald-100 font-medium">
                  Toca "Navegar con Google Maps" en cualquier tarjeta para iniciar el guiado GPS paso a paso al destino.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('contacts')}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all"
            >
              Volver al Directorio
            </button>
          </div>
        )}

        {/* Filter and Control Bar */}
        <div className="space-y-4 mb-6">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
              
              {/* Search input */}
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Buscar empresa, contacto, ciudad o dirección..."
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-sm transition-all ${
                    darkMode 
                      ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-600'
                  }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City filter */}
              {cities.length > 0 && (
                <div className="w-full lg:w-48">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="all">Todas las Ciudades ({contacts.length})</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions & View switch */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                {isAdmin && filteredContacts.length > 0 && (
                  <button 
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all text-xs font-bold whitespace-nowrap ${
                      selectedIds.length === filteredContacts.length
                        ? (darkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-300')
                        : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                    }`}
                  >
                    <span>{selectedIds.length === filteredContacts.length ? '✓' : '☐'}</span>
                    <span>{selectedIds.length === filteredContacts.length ? 'Desmarcar' : 'Seleccionar Todos'}</span>
                  </button>
                )}

                {isAdmin && selectedIds.length > 0 && (
                  <button 
                    onClick={handleMassiveDelete}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all text-xs font-bold whitespace-nowrap shadow-md shadow-rose-500/20"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span>Eliminar ({selectedIds.length})</span>
                  </button>
                )}

                {/* View Switch: Strictly Desktop/Tablet only (completely hidden on mobile phones) */}
                <div className={`hidden md:flex p-1 rounded-xl border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <button 
                    onClick={() => setViewMode('grid')} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400'}`}
                  >
                    Tarjetas
                  </button>
                  <button 
                    onClick={() => setViewMode('table')} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? (darkMode ? 'bg-slate-800 text-emerald-400' : 'bg-white text-slate-900 shadow-sm') : 'text-slate-400'}`}
                  >
                    Tabla PC
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Empty state */}
        {filteredContacts.length === 0 && (
          <div className={`p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center text-2xl mb-4">
              📇
            </div>
            <h3 className="text-lg font-bold">No se encontraron contactos</h3>
            <p className={`text-xs max-w-md mx-auto mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {searchTerm ? 'No hay resultados que coincidan con la búsqueda. Intente con otros términos.' : 'Aún no hay contactos registrados en la agenda de Calico.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md ${
                  isAdmin 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black'
                }`}
              >
                {isAdmin ? '+ Añadir Nuevo Registro' : '+ Solicitar Nuevo Punto Operativo'}
              </button>
              {isAdmin && (
                <button
                  onClick={handleImportExcelClick}
                  className={`px-5 py-2.5 rounded-xl border font-bold text-xs ${darkMode ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  📊 Importar desde Excel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Contacts Grid Mode (Optimized for Mobile and Driver Navigation) */}
        {(isMobile || viewMode === 'grid') && filteredContacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredContacts.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              const navigationUrl = getGoogleMapsDirectionsUrl(c.address, c.city);

              return (
                <div 
                  key={c.id} 
                  className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden ${
                    darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  } ${
                    isSelected ? (darkMode ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : 'ring-2 ring-emerald-600 bg-emerald-50/50') : ''
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    {/* Header: Checkbox (Admin only) + Client + Action icons */}
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {isAdmin && (
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.id)}
                          />
                        )}
                        <div className="min-w-0">
                          <h4 className="font-black text-base sm:text-lg leading-tight truncate">{c.client}</h4>
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block mt-0.5">
                            {c.city || 'Tucumán'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setRouteModalContact(c)} 
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all" 
                          title="Abrir GPS y Ruta"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                        </button>
                        <button 
                          onClick={() => setQrModalContact(c)} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 transition-all" 
                          title="QR del Destino"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        </button>
                        
                        {/* Edit & Delete: Strictly for Administrator */}
                        {isAdmin && (
                          <>
                            <button 
                              onClick={() => openEditModal(c)} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 transition-all"
                              title="Editar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteContact(c.id)} 
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
                              title="Borrar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Interactive Mobile-First Address Button that triggers Google Maps directly */}
                    <div className="mb-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Dirección de Destino</p>
                      <a 
                        href={navigationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`group block p-3.5 rounded-2xl border transition-all ${
                          darkMode 
                            ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/60 hover:bg-emerald-950/20' 
                            : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                        title="Toca para abrir la navegación guiada en Google Maps"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline break-words">
                              {c.address}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 font-medium">
                              <span>📍 {c.city}</span>
                              <span className="text-emerald-500 font-bold">• Guiar con Google Maps →</span>
                            </p>
                          </div>
                        </div>
                      </a>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2 mb-4 text-xs">
                      {c.contactName && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Contacto</span>
                          <span className="font-semibold">{c.contactName}</span>
                        </div>
                      )}
                      
                      {c.phone && (
                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono</span>
                            <span className="font-mono font-medium text-emerald-500">{c.phone}</span>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={`tel:${c.phone}`}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                              <span>Llamar</span>
                            </a>
                            <a 
                              href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      )}

                      {c.unloadingHours && (
                        <div className="pt-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Horario de Descarga</span>
                          <span className="font-medium text-amber-500">{c.unloadingHours}</span>
                        </div>
                      )}
                    </div>

                    {c.notes && (
                      <div className={`p-2.5 rounded-xl text-[11px] italic border border-dashed ${
                        darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        {c.notes}
                      </div>
                    )}
                  </div>

                  {/* Driver Fast Action Footer Button */}
                  <div className={`p-3 border-t flex gap-2 ${darkMode ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
                    <a
                      href={navigationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all text-center"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                      <span>Navegar con Google Maps</span>
                    </a>
                    <button
                      onClick={() => handlePrint(c)}
                      className={`p-2.5 rounded-xl border text-slate-400 hover:text-white transition-all ${
                        darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
                      }`}
                      title="Imprimir remito/ficha"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View (for desktop PC management only - NEVER shown on mobile phones) */}
        {!isMobile && viewMode === 'table' && filteredContacts.length > 0 && (
          <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-[10px] uppercase font-bold tracking-widest ${darkMode ? 'bg-slate-950 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
                  <tr>
                    {isAdmin && (
                      <th className="px-6 py-4 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4">Teléfono</th>
                    <th className="px-6 py-4">Ciudad</th>
                    <th className="px-6 py-4">Dirección / Guiado GPS</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className={`divide-y text-xs ${darkMode ? 'divide-slate-800 text-slate-200' : 'divide-slate-100 text-slate-700'}`}>
                  {filteredContacts.map((c) => {
                    const navigationUrl = getGoogleMapsDirectionsUrl(c.address, c.city);
                    return (
                      <tr 
                        key={c.id} 
                        className={`transition-colors ${
                          darkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                        } ${selectedIds.includes(c.id) ? (darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50') : ''}`}
                      >
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              checked={selectedIds.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">{c.client}</td>
                        <td className="px-6 py-4">{c.contactName || '—'}</td>
                        <td className="px-6 py-4 font-mono text-emerald-500 font-medium">{c.phone || '—'}</td>
                        <td className="px-6 py-4 font-medium">{c.city}</td>
                        <td className="px-6 py-4">
                          <a 
                            href={navigationUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-400 font-bold hover:underline flex items-center gap-1.5"
                            title="Abrir destino en Google Maps"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                            <span>{c.address}</span>
                          </a>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <button 
                            onClick={() => setRouteModalContact(c)} 
                            className="p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10" 
                            title="Ver Ruta GPS"
                          >
                            🗺️
                          </button>
                          <button 
                            onClick={() => handlePrint(c)} 
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-500" 
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => openEditModal(c)} 
                                className="text-emerald-500 hover:underline font-bold px-1"
                              >
                                Editar
                              </button>
                              <button 
                                onClick={() => handleDeleteContact(c.id)} 
                                className="text-rose-500 hover:underline font-bold px-1"
                              >
                                Borrar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Optimized for Smartphones) */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t flex items-center justify-around py-2 px-1 backdrop-blur-lg ${
        darkMode ? 'bg-[#0a0b0b]/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-lg'
      }`}>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'contacts' ? 'text-emerald-500 font-bold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">📇</span>
          <span className="text-[10px] mt-0.5">Contactos</span>
        </button>

        <button
          onClick={() => setActiveTab('gps_mode')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeTab === 'gps_mode' ? 'text-emerald-500 font-bold' : 'text-slate-400'
          }`}
        >
          <span className="text-lg">🚚</span>
          <span className="text-[10px] mt-0.5">Rutas GPS</span>
        </button>

        <button
          onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
          className="flex flex-col items-center py-1 px-3 text-emerald-500 font-bold"
        >
          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center -mt-3 shadow-md ${
            isAdmin ? 'bg-emerald-600 shadow-emerald-600/40' : 'bg-amber-500 text-slate-950 shadow-amber-500/40'
          }`}>
            <span className="text-base font-bold">+</span>
          </div>
          <span className="text-[10px] mt-0.5">{isAdmin ? 'Nuevo' : 'Solicitar'}</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setIsPendingRequestsOpen(true)}
            className="flex flex-col items-center py-1 px-2 text-slate-400 hover:text-amber-400 relative"
            title="Solicitudes Pendientes"
          >
            <span className="text-lg">📋</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-0 right-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full">
                {pendingRequestsCount}
              </span>
            )}
            <span className="text-[10px] mt-0.5">Solicitudes</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setIsUserManagementOpen(true)}
            className="flex flex-col items-center py-1 px-2 text-slate-400 hover:text-emerald-500"
          >
            <span className="text-lg">👥</span>
            <span className="text-[10px] mt-0.5">Personal</span>
          </button>
        )}

        <button
          onClick={() => authService.logout()}
          className="flex flex-col items-center py-1 px-3 text-rose-400"
          title="Cerrar sesión"
        >
          <span className="text-lg">🚪</span>
          <span className="text-[10px] mt-0.5">Salir</span>
        </button>
      </nav>

      {/* Modals */}
      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveContact} 
        onSubmitRequest={handleSubmitContactRequest}
        initialData={currentContact} 
        darkMode={darkMode} 
        user={user}
      />

      <PendingRequestsModal 
        isOpen={isPendingRequestsOpen}
        onClose={() => setIsPendingRequestsOpen(false)}
        requests={contactRequests}
        user={user}
        darkMode={darkMode}
      />

      <QRModal 
        isOpen={!!qrModalContact} 
        onClose={() => setQrModalContact(null)} 
        contact={qrModalContact} 
        darkMode={darkMode} 
      />

      <RouteModal 
        isOpen={!!routeModalContact} 
        onClose={() => setRouteModalContact(null)} 
        contact={routeModalContact} 
        darkMode={darkMode} 
      />

      <UserManagementModal 
        isOpen={isUserManagementOpen} 
        onClose={() => setIsUserManagementOpen(false)} 
        currentUser={user} 
        darkMode={darkMode} 
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        darkMode={darkMode}
        deferredPrompt={deferredPrompt}
        onPromptInstall={handlePromptInstall}
      />

      <PrintSection contact={printingContact} />
    </div>
  );
};

export default App;

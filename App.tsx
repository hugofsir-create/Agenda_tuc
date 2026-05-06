
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ContactModal from './components/ContactModal';
import PrintSection from './components/PrintSection';
import QRModal from './components/QRModal';
import LoadingScreen from './components/LoadingScreen';
import { LogisticsContact } from './types';
import * as XLSX from 'xlsx';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [contacts, setContacts] = useState<LogisticsContact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<LogisticsContact | null>(null);
  const [printingContact, setPrintingContact] = useState<LogisticsContact | null>(null);
  const [qrModalContact, setQrModalContact] = useState<LogisticsContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
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
  }, []);

  useEffect(() => {
    localStorage.setItem('logicon_contacts', JSON.stringify(contacts));
  }, [contacts]);

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
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    }
  };

  const handleMassiveDelete = () => {
    if (window.confirm(`¿Eliminar ${selectedIds.length} registros seleccionados?`)) {
      setContacts(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
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
  const handleImportExcelClick = () => excelInputRef.current?.click();

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

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Usamos header: 1 para obtener un array de arrays (filas por índice)
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (Array.isArray(rows) && rows.length > 0) {
          // Asumimos que la primera fila pueden ser cabeceras, pero el usuario dio índices específicos
          // B=1, D=3, L=11, M=12, P=15
          // Saltamos la primera fila si parece ser de cabeceras (contiene texto)
          const startIdx = isNaN(Number(rows[0][3])) ? 1 : 0; 

          const mappedContacts: LogisticsContact[] = rows.slice(startIdx).filter(row => row.length > 0).map((row: any, index) => {
            const getValue = (idx: number) => row[idx] ? String(row[idx]).trim() : '';

            return {
              id: `excel-${Date.now()}-${index}`,
              client: getValue(3) || 'S/N Empresa', // Columna D
              subClient: '', 
              contactName: getValue(1), // Columna B
              phone: getValue(15), // Columna P
              altContactName: '',
              altPhone: '',
              city: getValue(12), // Columna M
              address: getValue(11), // Columna L
              unloadingHours: '',
              notes: 'Importado vía Excel (Mapeo Específico)',
              lastContacted: new Date().toISOString().split('T')[0]
            };
          });

          if (mappedContacts.length === 0) {
            alert('No se encontraron datos en las columnas D, B, P, M, L.');
            return;
          }

          if (window.confirm(`Se encontraron ${mappedContacts.length} contactos. ¿Desea agregarlos a la lista actual?`)) {
            setContacts(prev => [...prev, ...mappedContacts]);
          }
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  if (isLoading) {
    return <LoadingScreen darkMode={darkMode} />;
  }

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-[#0f1110] text-slate-200' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        darkMode={darkMode} 
        onExportJSON={exportToJSON}
        onExportCSV={exportToCSV}
        onImport={handleImportClick}
        onImportExcel={handleImportExcelClick}
        currentView="contacts"
      />
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
      <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
      
      <main className="flex-1 ml-64 p-8 lg:p-12">
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
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative w-full md:w-96">
                  <input 
                    type="text"
                    placeholder="Buscar por empresa, contacto o ciudad..."
                    className={`w-full pl-4 pr-4 py-2.5 border rounded-xl outline-none transition-all text-sm ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-300'}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {filteredContacts.length > 0 && (
                  <button 
                    onClick={toggleSelectAll}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-xs font-bold whitespace-nowrap ${
                      selectedIds.length === filteredContacts.length
                      ? (darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                      : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                    }`}
                  >
                    {selectedIds.length === filteredContacts.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
                  </button>
                )}
                {selectedIds.length > 0 && (
                  <button 
                    onClick={handleMassiveDelete}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-xs font-bold whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Eliminar {selectedIds.length}
                  </button>
                )}
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
                        <th className="px-6 py-4 w-10">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                            onChange={toggleSelectAll}
                          />
                        </th>
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
                        <tr key={c.id} className={`${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'} ${selectedIds.includes(c.id) ? (darkMode ? 'bg-emerald-500/5' : 'bg-emerald-50') : ''}`}>
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              checked={selectedIds.includes(c.id)}
                              onChange={() => toggleSelect(c.id)}
                            />
                          </td>
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
                <div key={c.id} className={`p-6 rounded-2xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} ${selectedIds.includes(c.id) ? (darkMode ? 'ring-2 ring-emerald-500/50 bg-emerald-500/5' : 'ring-2 ring-emerald-500 bg-emerald-50') : ''}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                      />
                      <h4 className="font-bold text-lg">{c.client}</h4>
                    </div>
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
      </main>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveContact} initialData={currentContact} darkMode={darkMode} />
      <QRModal isOpen={!!qrModalContact} onClose={() => setQrModalContact(null)} contact={qrModalContact} darkMode={darkMode} />
      <PrintSection contact={printingContact} />
    </div>
  );
};

export default App;

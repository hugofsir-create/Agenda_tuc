import React, { useState } from 'react';
import { ContactRequest, LogisticsContact, AppUser } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, collection } from 'firebase/firestore';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ContactRequest[];
  user: AppUser | null;
  darkMode?: boolean;
}

const PendingRequestsModal: React.FC<PendingRequestsModalProps> = ({
  isOpen,
  onClose,
  requests,
  user,
  darkMode
}) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const showToast = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (req: ContactRequest) => {
    if (!user) return;
    setProcessingId(req.id);

    try {
      // 1. Create the new contact in 'contacts' collection
      const newContactRef = doc(collection(db, 'contacts'));
      const contactData: LogisticsContact = {
        id: newContactRef.id,
        client: req.client,
        subClient: req.subClient || '',
        contactName: req.contactName,
        phone: req.phone,
        altContactName: req.altContactName || '',
        altPhone: req.altPhone || '',
        city: req.city,
        address: req.address,
        unloadingHours: req.unloadingHours || '',
        notes: req.notes ? `${req.notes} (Cargado por chofer: ${req.submittedByName})` : `Cargado por chofer: ${req.submittedByName}`,
        lastContacted: new Date().toISOString().split('T')[0],
        ownerId: req.submittedByUserId || user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(newContactRef, contactData);

      // 2. Mark the request as approved
      const reqRef = doc(db, 'contact_requests', req.id);
      await updateDoc(reqRef, {
        status: 'approved',
        reviewedBy: user.name,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      showToast(`¡Contacto "${req.client}" aprobado y agregado al directorio!`, 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contacts / approve request');
      showToast('Error al aprobar la solicitud', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async (requestId: string) => {
    if (!user) return;
    setProcessingId(requestId);

    try {
      const reqRef = doc(db, 'contact_requests', requestId);
      await updateDoc(reqRef, {
        status: 'rejected',
        rejectionReason: rejectReason.trim() || 'No autorizado por administración',
        reviewedBy: user.name,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setRejectingId(null);
      setRejectReason('');
      showToast('Solicitud rechazada correctamente.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'contact_requests / reject');
      showToast('Error al rechazar solicitud', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (val: any) => {
    if (!val) return 'Reciente';
    if (val.toDate && typeof val.toDate === 'function') {
      return val.toDate().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    }
    if (typeof val === 'string') {
      try {
        return new Date(val).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
      } catch {
        return val;
      }
    }
    return 'Reciente';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold border border-amber-500/20">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Solicitudes de Contactos
                </h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-black rounded-full bg-amber-500 text-slate-950">
                    {pendingCount} pendientes
                  </span>
                )}
              </div>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Puntos operativos cargados por choferes pendientes de autorización
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg text-lg transition-colors ${darkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            ✕
          </button>
        </div>

        {/* Sub-header Filter Tabs */}
        <div className={`px-6 py-2.5 border-b flex items-center justify-between gap-4 text-xs ${darkMode ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({requests.length})
            </button>
          </div>

          <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Autorizaciones exclusivas para Administrador
          </span>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Requests List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {filteredRequests.length === 0 ? (
            <div className={`text-center py-12 px-4 rounded-2xl border border-dashed ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              <div className="text-4xl mb-3">✅</div>
              <h3 className={`text-sm font-bold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {filter === 'pending' ? 'No hay solicitudes pendientes' : 'No hay solicitudes registradas'}
              </h3>
              <p className="text-xs max-w-sm mx-auto">
                Cuando los choferes carguen nuevos contactos desde la app móvil o de conductor, aparecerán aquí para que los autorices.
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isPending
                      ? darkMode
                        ? 'bg-slate-950/60 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-white border-amber-300 shadow-md shadow-amber-500/10'
                      : darkMode
                        ? 'bg-slate-950/20 border-slate-800/80 opacity-75'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isApproved
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isPending ? '⏳ Pendiente de Autorización' : isApproved ? '✓ Aprobado' : '✕ Rechazado'}
                        </span>
                        
                        <span className={`text-[11px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          • Enviado el {formatDate(req.createdAt)}
                        </span>
                      </div>

                      <h3 className={`text-lg font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {req.client}
                      </h3>
                      {req.subClient && (
                        <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Sucursal: <span className="font-bold">{req.subClient}</span>
                        </p>
                      )}
                    </div>

                    {/* Driver Origin Badge */}
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 self-start ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <span className="text-base">🚚</span>
                      <div className="text-left">
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Cargado por Chofer
                        </p>
                        <p className={`text-xs font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {req.submittedByName || 'Chofer Calico'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Grid */}
                  <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3.5 rounded-xl text-xs mb-4 ${
                    darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-100/70 text-slate-700'
                  }`}>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Responsable:</span>
                      <span className="font-semibold">{req.contactName || 'No indicado'}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Teléfono:</span>
                      <a href={`tel:${req.phone}`} className="font-semibold text-emerald-500 hover:underline">
                        📞 {req.phone || 'Sin teléfono'}
                      </a>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Ciudad:</span>
                      <span className="font-semibold">📍 {req.city}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Dirección:</span>
                      <span className="font-semibold">{req.address}</span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase text-slate-400">Horarios de Descarga:</span>
                      <span className="font-semibold">⏰ {req.unloadingHours || 'Sin horario especificado'}</span>
                    </div>

                    {req.notes && (
                      <div className="sm:col-span-3 pt-1 border-t border-slate-200/20">
                        <span className="block text-[10px] font-bold uppercase text-slate-400">Observaciones del Chofer:</span>
                        <p className="italic text-xs mt-0.5">{req.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions for Pending Requests */}
                  {isPending && (
                    <div>
                      {rejectingId === req.id ? (
                        <div className={`p-4 rounded-xl border space-y-3 ${
                          darkMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50 border-rose-200'
                        }`}>
                          <p className="text-xs font-bold text-rose-500">
                            ¿Rechazar esta solicitud de contacto?
                          </p>
                          <input
                            type="text"
                            placeholder="Motivo del rechazo (opcional, ej. dirección duplicada o errónea)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className={`w-full text-xs px-3 py-2 rounded-lg border outline-none ${
                              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'
                            }`}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setRejectingId(null); setRejectReason(''); }}
                              className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleConfirmReject(req.id)}
                              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-500 shadow-sm"
                            >
                              Confirmar Rechazo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${req.address}, ${req.city}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              darkMode
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                                : 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            <span>🗺️</span>
                            <span>Verificar en Google Maps</span>
                          </a>

                          <div className="flex items-center gap-2">
                            <button
                              disabled={processingId === req.id}
                              onClick={() => setRejectingId(req.id)}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                            >
                              Rechazar
                            </button>
                            <button
                              disabled={processingId === req.id}
                              onClick={() => handleApprove(req.id ? req : req)}
                              className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                            >
                              <span>✓</span>
                              <span>{processingId === req.id ? 'Aprobando...' : 'Aprobar y Agregar'}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review audit trail */}
                  {!isPending && (
                    <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-200/10">
                      <span>
                        Revisado por: <strong className="text-slate-300">{req.reviewedBy || 'Administrador'}</strong>
                      </span>
                      {req.rejectionReason && (
                        <span className="text-rose-400">Motivo: {req.rejectionReason}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-between items-center ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Logitrack Calico • Control de Calidad de Datos
          </span>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-bold ${
              darkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
            }`}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default PendingRequestsModal;

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppUser, UserRole } from '../types';

const SESSION_KEY = 'logitrack_calico_session';
const USERS_CACHE_KEY = 'logitrack_calico_users_cache';

// Pre-configured default users for Calico
const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user_admin_01',
    username: 'admin@calico.com',
    name: 'Administrador Calico',
    password: 'calico2026',
    role: 'admin',
    roleLabel: 'Administrador General',
    phone: '+54 381 450-2000',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_driver_01',
    username: 'chofer@calico.com',
    name: 'Carlos Gómez (Chofer)',
    password: 'chofer123',
    role: 'driver',
    roleLabel: 'Chofer / Repartidor',
    phone: '+54 381 512-3456',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user_operator_01',
    username: 'operador@calico.com',
    name: 'Mariana Ruiz (Logística)',
    password: 'operador123',
    role: 'operator',
    roleLabel: 'Operador Logístico',
    phone: '+54 381 498-7654',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class AuthService {
  private currentUser: AppUser | null = null;
  private listeners: ((user: AppUser | null) => void)[] = [];

  constructor() {
    // Restore session from localStorage
    try {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        this.currentUser = JSON.parse(savedSession);
      }
    } catch (e) {
      console.error('Error loading session:', e);
      this.currentUser = null;
    }

    // Initialize/seed Firestore users collection in the background
    this.seedDefaultUsersIfEmpty();
  }

  public getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  public onAuthStateChange(callback: (user: AppUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb(this.currentUser);
    }
  }

  private getCachedUsers(): AppUser[] {
    try {
      const cached = localStorage.getItem(USERS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return DEFAULT_USERS;
  }

  private saveUsersCache(users: AppUser[]) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed to save users cache', e);
    }
  }

  public async seedDefaultUsersIfEmpty() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (snap.empty) {
        for (const user of DEFAULT_USERS) {
          await setDoc(doc(db, 'users', user.id), user);
        }
        this.saveUsersCache(DEFAULT_USERS);
      } else {
        const users = snap.docs.map(d => ({ ...d.data(), id: d.id })) as AppUser[];
        this.saveUsersCache(users);
      }
    } catch (error) {
      console.warn('Firestore users sync deferred, using local repository:', error);
      if (!localStorage.getItem(USERS_CACHE_KEY)) {
        this.saveUsersCache(DEFAULT_USERS);
      }
    }
  }

  public async getAllUsers(): Promise<AppUser[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const users = snap.docs.map(d => ({ ...d.data(), id: d.id })) as AppUser[];
        this.saveUsersCache(users);
        return users;
      }
    } catch (error) {
      console.warn('Reading users from Firestore failed, fallback to cache:', error);
    }
    return this.getCachedUsers();
  }

  public async login(identifier: string, pass: string): Promise<AppUser> {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Fetch up-to-date users
    const users = await this.getAllUsers();
    
    // Find matching user (by username or email, or Hugo's administrator email)
    const match = users.find(u => {
      const uId = u.username.toLowerCase();
      const matchesStandard = (uId === cleanId || uId.split('@')[0] === cleanId) && u.password === cleanPass;
      // Allow Hugo's email/name to match the administrator account
      const matchesHugoAdmin = (u.role === 'admin' && (cleanId === 'hugofsir@gmail.com' || cleanId === 'hugo')) && u.password === cleanPass;
      return matchesStandard || matchesHugoAdmin;
    });

    if (!match) {
      throw new Error('Credenciales inválidas. Verifique el usuario/correo y contraseña.');
    }

    if (match.status === 'inactive') {
      throw new Error('Esta cuenta de usuario se encuentra inactiva. Contacte al administrador de Calico.');
    }

    // Save session
    this.currentUser = match;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(match));
      // Mark this device as authorized for Hugo/Admin if admin logs in
      if (match.role === 'admin') {
        localStorage.setItem('calico_admin_device_authorized', 'true');
      }
    } catch (e) {
      console.error('Session save error:', e);
    }

    this.notify();
    return match;
  }

  public logout(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Session clear error:', e);
    }
    this.notify();
  }

  public async createUser(data: {
    username: string;
    name: string;
    password: string;
    role: UserRole;
    phone?: string;
  }): Promise<AppUser> {
    const cleanUsername = data.username.trim().toLowerCase();
    const existingUsers = await this.getAllUsers();

    if (existingUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('Ya existe un usuario con este nombre de usuario / correo.');
    }

    const roleLabels: Record<UserRole, string> = {
      admin: 'Administrador General',
      operator: 'Operador Logístico',
      driver: 'Chofer / Repartidor'
    };

    const newId = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newUser: AppUser = {
      id: newId,
      username: cleanUsername,
      name: data.name.trim(),
      password: data.password.trim(),
      role: data.role,
      roleLabel: roleLabels[data.role] || 'Operador',
      phone: data.phone?.trim() || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', newId), newUser);
    } catch (err) {
      console.warn('Direct Firestore user creation error, persisting in local store:', err);
    }

    const updatedList = [...existingUsers, newUser];
    this.saveUsersCache(updatedList);
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
    const existingUsers = await this.getAllUsers();
    const idx = existingUsers.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('Usuario no encontrado');

    const updatedUser: AppUser = {
      ...existingUsers[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.role) {
      const roleLabels: Record<UserRole, string> = {
        admin: 'Administrador General',
        operator: 'Operador Logístico',
        driver: 'Chofer / Repartidor'
      };
      updatedUser.roleLabel = roleLabels[updates.role];
    }

    try {
      await updateDoc(doc(db, 'users', id), updatedUser as any);
    } catch (err) {
      console.warn('Firestore update error, updating local store:', err);
    }

    existingUsers[idx] = updatedUser;
    this.saveUsersCache(existingUsers);

    // If current user was updated, update active session
    if (this.currentUser?.id === id) {
      this.currentUser = updatedUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
      this.notify();
    }
  }

  public async toggleUserStatus(id: string): Promise<void> {
    const users = await this.getAllUsers();
    const user = users.find(u => u.id === id);
    if (!user) throw new Error('Usuario no encontrado');
    if (this.currentUser?.id === id) {
      throw new Error('No puedes desactivar tu propia cuenta activa.');
    }
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await this.updateUser(id, { status: newStatus });
  }

  public async deleteUser(id: string): Promise<void> {
    if (this.currentUser?.id === id) {
      throw new Error('No puedes eliminar la cuenta actualmente en uso.');
    }

    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      console.warn('Firestore delete error, removing from local store:', err);
    }

    const users = await this.getAllUsers();
    const filtered = users.filter(u => u.id !== id);
    this.saveUsersCache(filtered);
  }
}

export const authService = new AuthService();

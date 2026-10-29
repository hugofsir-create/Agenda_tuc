export type UserRole = 'admin' | 'operator' | 'driver';

export interface AppUser {
  id: string;
  username: string; // e.g. admin@calico.com or operador1
  name: string; // e.g. Administrador Calico, Juan Chofer
  password?: string;
  role: UserRole;
  roleLabel: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface LogisticsContact {
  id: string;
  client: string;
  subClient: string;
  contactName: string;
  phone: string;
  altContactName: string;
  altPhone: string;
  city: string;
  address: string;
  unloadingHours: string;
  notes: string;
  lastContacted?: string;
  ownerId?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface ContactRequest {
  id: string;
  client: string;
  subClient: string;
  contactName: string;
  phone: string;
  altContactName?: string;
  altPhone?: string;
  city: string;
  address: string;
  unloadingHours: string;
  notes: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByRole: UserRole;
  status: RequestStatus;
  reviewedBy?: string;
  reviewedAt?: any;
  rejectionReason?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface ContactStats {
  total: number;
}

export enum ShipmentStatus {
  PENDING = 'Pendiente',
  IN_TRANSIT = 'En Tránsito',
  DELIVERED = 'Entregado',
  CANCELLED = 'Cancelado'
}

export interface Shipment {
  id: string;
  origin: string;
  destination: string;
  driverName: string;
  cargoType: string;
  weight: number;
  date: string;
  status: ShipmentStatus;
  notes?: string;
}

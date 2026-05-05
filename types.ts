
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

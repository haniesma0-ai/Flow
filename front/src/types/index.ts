// User and Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'commercial' | 'chauffeur' | 'client' | 'user';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Product Types
export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: number;
  tva: number;
  stock: number;
  minStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Customer Types
export interface Customer {
  id: number;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  ice?: string;
  rc?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export type OrderStatus = 'draft' | 'confirmed' | 'preparation' | 'delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  product: Product;
  quantity: number;
  price: number;
  tva: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customer: Customer;
  commercialId: number;
  commercial: User;
  items: OrderItem[];
  subtotal: number;
  totalTva: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  deliveryDate?: string;
  useCustomerAddress?: boolean;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Delivery Types
export type DeliveryStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface GpsTrackingEntry {
  lat: number;
  lng: number;
  event: string;
  timestamp: string;
}

export interface Delivery {
  id: number;
  orderId: number;
  order: Order;
  chauffeurId: number;
  chauffeur: User;
  vehicleId?: number;
  vehicle?: Vehicle;
  status: DeliveryStatus;
  plannedDate: string;
  startedAt?: string;
  completedAt?: string;
  proofOfDelivery?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  // COD fields
  cashAmount: number;
  collectedAmount?: number | null;
  paymentConfirmed: boolean;
  paymentConfirmedAt?: string;
  paymentLocked: boolean;
  // Digital signature
  hasSignature?: boolean;
  signatureData?: string | null;
  signatureCapturedAt?: string;
  // GPS payment location
  paymentLatitude?: number | null;
  paymentLongitude?: number | null;
  gpsTrackingPoints?: number;
  gpsTrackingLog?: GpsTrackingEntry[];
  // Incident
  hasDiscrepancy: boolean;
  incidentReport?: string | null;
  incidentReportedAt?: string;
  incidentReportedBy?: number | null;
  incidentStatus?: 'open' | 'in_review' | 'resolved' | null;
  incidentResolutionNotes?: string | null;
  incidentResolvedAt?: string | null;
  incidentResolvedBy?: number | null;
  // Cash reconciliation
  cashSubmitted: boolean;
  cashSubmittedAt?: string;
  cashVerified: boolean;
  cashVerifiedAt?: string;
  verifiedBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CashSummary {
  deliveries: {
    deliveryId: number;
    orderNumber: string;
    cashAmount: number;
    collectedAmount: number;
    hasDiscrepancy: boolean;
  }[];
  totalExpected: number;
  totalCollected: number;
  difference: number;
  hasDiscrepancies: boolean;
}

export interface DriverLocation {
  chauffeur: { id: number; name: string } | null;
  currentLocation: { latitude: number | null; longitude: number | null };
  activeDeliveries: Delivery[];
  vehicle: { id: number; registration: string } | null;
}

export interface Incident {
  id: number;
  deliveryId: number;
  deliveryStatus: DeliveryStatus;
  hasDiscrepancy: boolean;
  incidentReport: string;
  incidentStatus: 'open' | 'in_review' | 'resolved' | null;
  incidentReportedAt?: string;
  incidentReportedBy?: { id: number; name: string } | null;
  incidentResolutionNotes?: string | null;
  incidentResolvedAt?: string | null;
  incidentResolvedBy?: { id: number; name: string } | null;
  order?: {
    id: number;
    orderNumber: string;
    customer?: {
      id: number;
      name: string;
      city?: string;
    } | null;
  } | null;
  chauffeur?: {
    id: number;
    name: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Discount {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Vehicle Types
export interface Vehicle {
  id: number;
  registration: string;
  brand: string;
  model: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invoice Types
export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  order: Order;
  customerId: number;
  customer: Customer;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: number;
  invoiceId: number;
  invoice: Invoice;
  amount: number;
  method: 'cash' | 'check' | 'bank_transfer' | 'credit_card';
  reference?: string;
  paidAt: string;
  createdAt: string;
}

// Kanban Task Types
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdById: number;
  createdBy: User;
  assignedToId?: number;
  assignedTo?: User;
  orderId?: number;
  order?: Order;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  userId: number;
  user: User;
  action: string;
  entityType: string;
  entityId: number;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  createdAt: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingDeliveries: number;
  lowStockProducts: number;
  overdueInvoices: number;
  ordersByStatus: Record<string, number>;
  deliveriesByStatus: Record<string, number>;
  revenueByMonth: { month: string; amount: number }[];
  topProducts: { product: Product; quantity: number }[];
  recentOrders: Order[];
}

// Chart Data Types
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Map Types
export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  title: string;
  status: DeliveryStatus;
}

// Filter Types
export interface OrderFilter {
  status?: OrderStatus;
  customerId?: number;
  commercialId?: number;
  startDate?: string;
  endDate?: string;
}

export interface ProductFilter {
  category?: string;
  lowStock?: boolean;
  search?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
}

// Offline Types
export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface SyncState {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  lastSync: string | null;
}

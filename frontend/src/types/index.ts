export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';

export type StockMovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
  _count?: {
    followUps: number;
  };
}

export interface StockLog {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: StockMovementType;
  reason: string;
  timestamp: string;
  createdBy: {
    id: string;
    name: string;
    role: Role;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlertQuantity: number;
  locationWarehouse: string;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
  _count?: {
    stockLogs: number;
  };
}

export interface SalesChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: Customer;
  totalQuantity: number;
  status: ChallanStatus;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    role: Role;
  };
  createdDate: string;
  items: SalesChallanItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

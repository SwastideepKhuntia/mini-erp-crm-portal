import { ApiResponse, Customer, Product, SalesChallan, User } from '../types';

const API_BASE_URL = '/api';

/**
 * Fetch wrapper with token authorization header.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('erp_jwt_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP Error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>('/auth/me'),

  // Customers
  getCustomers: (params?: { search?: string; status?: string; customerType?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.customerType) query.append('customerType', params.customerType);
    if (params?.page) query.append('page', String(params.page));
    return request<Customer[]>(`/customers?${query.toString()}`);
  },

  getCustomerById: (id: string) => request<Customer>(`/customers/${id}`),

  createCustomer: (data: Partial<Customer>) =>
    request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCustomer: (id: string, data: Partial<Customer>) =>
    request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  addFollowUpNote: (customerId: string, data: { note: string; followUpDate?: string }) =>
    request<any>(`/customers/${customerId}/follow-ups`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Products
  getProducts: (params?: { search?: string; category?: string; lowStockOnly?: boolean; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStockOnly) query.append('lowStockOnly', 'true');
    if (params?.page) query.append('page', String(params.page));
    return request<Product[]>(`/products?${query.toString()}`);
  },

  getProductById: (id: string) => request<Product>(`/products/${id}`),

  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  logStockMovement: (productId: string, data: { quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }) =>
    request<any>(`/products/${productId}/stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Sales Challans
  getSalesChallans: (params?: { search?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    return request<SalesChallan[]>(`/sales-challans?${query.toString()}`);
  },

  getSalesChallanById: (id: string) => request<SalesChallan>(`/sales-challans/${id}`),

  createSalesChallan: (data: { customerId: string; items: Array<{ productId: string; quantity: number }>; status?: string }) =>
    request<SalesChallan>('/sales-challans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateChallanStatus: (id: string, status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED') =>
    request<SalesChallan>(`/sales-challans/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

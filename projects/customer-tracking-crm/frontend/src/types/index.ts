// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'sales';
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'sales';
  first_name: string;
  last_name: string;
}

// Company Types
export interface Company {
  id: number;
  name: string;
  domain?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
  owner_id: number;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  owner_first_name?: string;
  owner_last_name?: string;
  approver_first_name?: string;
  approver_last_name?: string;
}

// Contact Types
export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company_id?: number;
  owner_id: number;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  approval_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_name?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  approver_first_name?: string;
  approver_last_name?: string;
}

// Order Types
export interface Order {
  id: number;
  order_number: string;
  company_id?: number;
  contact_id?: number;
  owner_id: number;
  status: 'draft' | 'confirmed' | 'production' | 'testing' | 'shipped' | 'delivered';
  approval_status: 'pending' | 'submitted' | 'approved' | 'rejected';
  approved_by?: number;
  approved_at?: string;
  total_amount?: number;
  currency: string;
  description?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
  expected_delivery?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  company_name?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  approver_first_name?: string;
  approver_last_name?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderUpdate {
  id: number;
  order_id: number;
  user_id: number;
  status: string;
  message?: string;
  customer_visible: boolean;
  created_at: string;
  first_name?: string;
  last_name?: string;
}

// Shipment Types
export interface Shipment {
  id: number;
  order_id: number;
  carrier?: string;
  tracking_number?: string;
  vessel_name?: string;
  voyage_number?: string;
  container_number?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  estimated_departure?: string;
  estimated_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  status: 'preparing' | 'departed' | 'in_transit' | 'arrived' | 'delivered';
  created_at: string;
  updated_at: string;
}

// Document Types
export interface Document {
  id: number;
  entity_type: 'company' | 'contact' | 'order';
  entity_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  ocr_text?: string;
  document_type?: string;
  customer_visible: boolean;
  uploaded_by: number;
  created_at: string;
}

// Portal Types
export interface PortalToken {
  id: number;
  token: string;
  order_id: number;
  email: string;
  expires_at: string;
  views: number;
  max_views: number;
  is_revoked: boolean;
  created_at: string;
  last_accessed?: string;
}

// Notification Types
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

// Audit Types
export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id: number;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

// Analytics Types
export interface UserPerformance {
  orders: Array<{
    owner_id: number;
    count: number;
    avg_amount: number;
    total_amount: number;
  }>;
  contacts: Array<{
    owner_id: number;
    count: number;
  }>;
  companies: Array<{
    owner_id: number;
    count: number;
  }>;
  approvals: Array<{
    owner_id: number;
    approval_status: string;
    count: number;
  }>;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  username: string;
  password: string;
}

export interface CompanyForm {
  name: string;
  contact_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  industry?: string;
}

export interface ContactForm {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company_id?: number;
  status?: string;
  source?: string;
  notes?: string;
}

export interface OrderForm {
  company_id?: number;
  contact_id?: number;
  total_amount?: number;
  currency?: string;
  description?: string;
  notes?: string;
  priority?: string;
  expected_delivery?: string;
  items?: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

// UI State Types
export interface AppState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  notifications: Notification[];
  unreadNotifications: number;
}

export interface DashboardStats {
  totalOrders: number;
  pendingApprovals: number;
  totalCompanies: number;
  totalContacts: number;
  monthlyRevenue: number;
  activeUsers: number;
}

// Socket Event Types
export interface SocketEvents {
  'company_submitted': { companyId: number; companyName: string; submittedBy: AuthUser };
  'company_approved': { companyId: number; companyName: string; approvedBy: AuthUser };
  'company_rejected': { companyId: number; companyName: string; approvedBy: AuthUser };
  'contact_submitted': { contactId: number; contactName: string; submittedBy: AuthUser };
  'contact_approved': { contactId: number; contactName: string; approvedBy: AuthUser };
  'contact_rejected': { contactId: number; contactName: string; approvedBy: AuthUser };
  'order_submitted': { orderId: number; orderNumber: string; submittedBy: AuthUser };
  'order_approved': { orderId: number; orderNumber: string; approvedBy: AuthUser };
  'order_rejected': { orderId: number; orderNumber: string; approvedBy: AuthUser };
  'notification': Notification;
}

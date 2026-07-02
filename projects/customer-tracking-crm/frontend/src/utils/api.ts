import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Company, 
  Contact, 
  Order, 
  Document, 
  PortalToken, 
  Notification, 
  AuditLog, 
  UserPerformance,
  ApiResponse,
  LoginForm,
  CompanyForm,
  ContactForm,
  OrderForm
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginForm): Promise<{ token: string; user: User }> {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // User Management (Admin only)
  async getUsers(params?: { role?: string; search?: string; is_active?: boolean }): Promise<User[]> {
    const response = await this.client.get('/users', { params });
    return response.data;
  }

  async createUser(userData: Partial<User>): Promise<{ id: number; message: string }> {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<{ message: string }> {
    const response = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async resetUserPassword(id: number, newPassword: string): Promise<{ message: string }> {
    const response = await this.client.post(`/users/${id}/reset-password`, { new_password: newPassword });
    return response.data;
  }

  // Companies
  async getCompanies(params?: { search?: string; status?: string; approval_status?: string }): Promise<Company[]> {
    const response = await this.client.get('/companies', { params });
    return response.data;
  }

  async createCompany(companyData: CompanyForm): Promise<{ id: number; message: string }> {
    const response = await this.client.post('/companies', companyData);
    return response.data;
  }

  async updateCompany(id: number, companyData: Partial<CompanyForm>): Promise<{ message: string }> {
    const response = await this.client.put(`/companies/${id}`, companyData);
    return response.data;
  }

  async deleteCompany(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/companies/${id}`);
    return response.data;
  }

  async submitCompanyForApproval(id: number): Promise<{ message: string }> {
    const response = await this.client.post(`/companies/${id}/submit`);
    return response.data;
  }

  async approveCompany(id: number, action: 'approve' | 'reject', message?: string): Promise<{ message: string }> {
    const response = await this.client.post(`/companies/${id}/approve`, { action, message });
    return response.data;
  }

  // Contacts
  async getContacts(params?: { search?: string; status?: string; company_id?: number; approval_status?: string }): Promise<Contact[]> {
    const response = await this.client.get('/contacts', { params });
    return response.data;
  }

  async createContact(contactData: ContactForm): Promise<{ id: number; message: string }> {
    const response = await this.client.post('/contacts', contactData);
    return response.data;
  }

  async updateContact(id: number, contactData: Partial<ContactForm>): Promise<{ message: string }> {
    const response = await this.client.put(`/contacts/${id}`, contactData);
    return response.data;
  }

  async deleteContact(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/contacts/${id}`);
    return response.data;
  }

  async submitContactForApproval(id: number): Promise<{ message: string }> {
    const response = await this.client.post(`/contacts/${id}/submit`);
    return response.data;
  }

  async approveContact(id: number, action: 'approve' | 'reject', message?: string): Promise<{ message: string }> {
    const response = await this.client.post(`/contacts/${id}/approve`, { action, message });
    return response.data;
  }

  // Orders
  async getOrders(params?: { status?: string; approval_status?: string; owner_id?: number }): Promise<Order[]> {
    const response = await this.client.get('/orders', { params });
    return response.data;
  }

  async createOrder(orderData: OrderForm): Promise<{ id: number; order_number: string; message: string }> {
    const response = await this.client.post('/orders', orderData);
    return response.data;
  }

  async updateOrder(id: number, orderData: Partial<OrderForm>): Promise<{ message: string }> {
    const response = await this.client.put(`/orders/${id}`, orderData);
    return response.data;
  }

  async deleteOrder(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/orders/${id}`);
    return response.data;
  }

  async submitOrderForApproval(id: number): Promise<{ message: string }> {
    const response = await this.client.post(`/orders/${id}/submit`);
    return response.data;
  }

  async approveOrder(id: number, action: 'approve' | 'reject', message?: string): Promise<{ message: string }> {
    const response = await this.client.post(`/orders/${id}/approve`, { action, message });
    return response.data;
  }

  // Documents
  async getDocuments(params?: { entity_type?: string; entity_id?: number }): Promise<Document[]> {
    const response = await this.client.get('/documents', { params });
    return response.data;
  }

  async uploadDocument(formData: FormData): Promise<{ id: number; filename: string; original_filename: string; ocr_text: string; message: string }> {
    const response = await this.client.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Customer Portal
  async generatePortalToken(data: { order_id: number; email: string; expires_in_days?: number; max_views?: number }): Promise<{ token: string; portal_url: string; expires_at: string; message: string }> {
    const response = await this.client.post('/portal/generate-token', data);
    return response.data;
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await this.client.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: number): Promise<{ message: string }> {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  // Activity & Analytics (Admin only)
  async getActivity(params?: { user_id?: number; entity_type?: string; start_date?: string; end_date?: string; limit?: number }): Promise<AuditLog[]> {
    const response = await this.client.get('/activity', { params });
    return response.data;
  }

  async getUserPerformance(params?: { user_id?: number; start_date?: string; end_date?: string }): Promise<UserPerformance> {
    const response = await this.client.get('/analytics/user-performance', { params });
    return response.data;
  }

  async getApprovals(status?: string): Promise<any[]> {
    const response = await this.client.get('/approvals', { params: { status } });
    return response.data;
  }

  async getSessions(): Promise<any[]> {
    const response = await this.client.get('/sessions');
    return response.data;
  }

  // Utility methods
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;

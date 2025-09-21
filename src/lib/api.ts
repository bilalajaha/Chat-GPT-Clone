// API client for Laravel backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data.errors
        );
      }

      return data.data || data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Network error occurred',
        0
      );
    }
  }

  // Authentication methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    const response = await this.request<{
      user: any;
      token: string;
      token_type: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(response.token);
    return response;
  }

  async login(credentials: {
    email: string;
    password: string;
  }) {
    const response = await this.request<{
      user: any;
      token: string;
      token_type: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Chat methods
  async getChats(page: number = 1) {
    return this.request<{
      data: any[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/chats?page=${page}`);
  }

  async getChat(id: string) {
    return this.request<any>(`/chats/${id}`);
  }

  async createChat(chatData: {
    title?: string;
    description?: string;
    settings?: any;
  }) {
    return this.request<any>('/chats', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async updateChat(id: string, chatData: {
    title?: string;
    description?: string;
    settings?: any;
    is_archived?: boolean;
  }) {
    return this.request<any>(`/chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chatData),
    });
  }

  async deleteChat(id: string) {
    return this.request(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async archiveChat(id: string) {
    return this.request<any>(`/chats/${id}/archive`, {
      method: 'POST',
    });
  }

  async unarchiveChat(id: string) {
    return this.request<any>(`/chats/${id}/unarchive`, {
      method: 'POST',
    });
  }

  async getArchivedChats(page: number = 1) {
    return this.request<{
      data: any[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/chats-archived?page=${page}`);
  }

  // Message methods
  async getMessages(chatId: string, page: number = 1) {
    return this.request<{
      data: any[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/chats/${chatId}/messages?page=${page}`);
  }

  async getMessage(chatId: string, messageId: string) {
    return this.request<any>(`/chats/${chatId}/messages/${messageId}`);
  }

  async createMessage(chatId: string, messageData: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    metadata?: any;
  }) {
    return this.request<any>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateMessage(chatId: string, messageId: string, messageData: {
    content: string;
    metadata?: any;
  }) {
    return this.request<any>(`/chats/${chatId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify(messageData),
    });
  }

  async deleteMessage(chatId: string, messageId: string) {
    return this.request(`/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async sendMessage(chatId: string, messageData: {
    content: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }) {
    return this.request<{
      user_message: any;
      ai_response: any;
    }>(`/chats/${chatId}/send`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  // User methods
  async getUserProfile() {
    return this.request<any>('/user/profile');
  }

  async updateUserProfile(profileData: {
    name: string;
    email: string;
  }) {
    return this.request<any>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    return this.request('/user/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getUserPreferences() {
    return this.request<any>('/user/preferences');
  }

  async updateUserPreferences(preferences: {
    theme?: 'dark' | 'light';
    language?: string;
    default_model?: string;
    temperature?: number;
    max_tokens?: number;
    auto_save?: boolean;
    notifications?: boolean;
    api_settings?: any;
  }) {
    return this.request<any>('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getUserStatistics() {
    return this.request<{
      total_chats: number;
      active_chats: number;
      archived_chats: number;
      total_messages: number;
      user_messages: number;
      assistant_messages: number;
      total_tokens_used: number;
    }>('/user/statistics');
  }

  async deleteAccount(password: string) {
    return this.request('/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  }

  // Data migration methods
  async migrateLocalStorageData(data: {
    chats: any[];
    preferences: any;
    settings: any;
  }) {
    return this.request('/user/migrate-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async exportUserData() {
    return this.request<{
      chats: any[];
      preferences: any;
      settings: any;
      export_date: string;
    }>('/user/export');
  }

  async importUserData(data: {
    chats: any[];
    preferences: any;
    settings: any;
  }) {
    return this.request('/user/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Search methods
  async searchChats(query: string, page: number = 1) {
    return this.request<{
      data: any[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(`/chats/search?q=${encodeURIComponent(query)}&page=${page}`);
  }

  async searchMessages(query: string, chatId?: string, page: number = 1) {
    const url = chatId 
      ? `/chats/${chatId}/messages/search?q=${encodeURIComponent(query)}&page=${page}`
      : `/messages/search?q=${encodeURIComponent(query)}&page=${page}`;
    
    return this.request<{
      data: any[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(url);
  }
}

// Custom error class
class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export { ApiError };
export type { ApiResponse };

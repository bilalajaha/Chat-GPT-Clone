export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  private loadToken(): void {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new ApiError(
          data.message || 'An error occurred',
          response.status,
          data.errors
        );
      }

      const data = await response.json();
      return { success: true, data };
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

  // Authentication
  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Chat Management
  async getChats(page: number = 1, limit: number = 20) {
    return this.request(`/chats?page=${page}&limit=${limit}`);
  }

  async createChat(data: { title: string; messages?: any[] }) {
    return this.request('/chats', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateChat(id: number, data: { title?: string; archived?: boolean }) {
    return this.request(`/chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteChat(id: number) {
    return this.request(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async archiveChat(id: number) {
    return this.request(`/chats/${id}/archive`, {
      method: 'POST',
    });
  }

  // Message Management
  async getMessages(chatId: number, page: number = 1, limit: number = 50) {
    return this.request(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async createMessage(chatId: number, data: { content: string; role: string }) {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async sendMessage(chatId: number, content: string, options?: { model?: string }) {
    return this.request(`/chats/${chatId}/send`, {
      method: 'POST',
      body: JSON.stringify({ content, ...options }),
    });
  }

  // User Management
  async getUserProfile() {
    return this.request('/user/profile');
  }

  async updateUserProfile(data: { name?: string; email?: string }) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserPreferences() {
    return this.request('/user/preferences');
  }

  async updateUserPreferences(data: any) {
    return this.request('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Search
  async searchChats(query: string, page: number = 1) {
    return this.request(`/search/chats?q=${encodeURIComponent(query)}&page=${page}`);
  }

  async searchMessages(query: string, page: number = 1) {
    return this.request(`/search/messages?q=${encodeURIComponent(query)}&page=${page}`);
  }
}

export const apiClient = new ApiClient();

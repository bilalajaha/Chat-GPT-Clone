import { apiClient, ApiError } from '@/lib/api';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Authentication', () => {
    it('registers a new user successfully', async () => {
      const mockResponse = {
        user: { id: 1, name: 'John Doe', email: 'john@example.com' },
        token: 'test-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.register('John Doe', 'john@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    });

    it('handles registration errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: 'Validation failed' }),
      } as Response);

      const result = await apiClient.register('John Doe', 'invalid-email', '123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('logs in user successfully', async () => {
      const mockResponse = {
        user: { id: 1, name: 'John Doe', email: 'john@example.com' },
        token: 'test-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.login('john@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token');
    });

    it('handles login errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      } as Response);

      const result = await apiClient.login('john@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('logs out user successfully', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Logged out successfully' }),
      } as Response);

      const result = await apiClient.logout();

      expect(result.success).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('gets current user successfully', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      const mockUser = { id: 1, name: 'John Doe', email: 'john@example.com' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockUser,
      } as Response);

      const result = await apiClient.getMe();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('Chat Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('test-token');
    });

    it('gets chats successfully', async () => {
      const mockChats = {
        data: [
          { id: 1, title: 'Chat 1', description: 'First chat' },
          { id: 2, title: 'Chat 2', description: 'Second chat' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockChats,
      } as Response);

      const result = await apiClient.getChats(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChats);
    });

    it('creates chat successfully', async () => {
      const chatData = { title: 'New Chat', description: 'A new conversation' };
      const mockChat = { id: 1, ...chatData, created_at: '2023-01-01T00:00:00Z' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockChat,
      } as Response);

      const result = await apiClient.createChat(chatData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChat);
    });

    it('updates chat successfully', async () => {
      const updateData = { title: 'Updated Chat' };
      const mockChat = { id: 1, ...updateData, updated_at: '2023-01-01T00:00:00Z' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockChat,
      } as Response);

      const result = await apiClient.updateChat(1, updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChat);
    });

    it('deletes chat successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Chat deleted successfully' }),
      } as Response);

      const result = await apiClient.deleteChat(1);

      expect(result.success).toBe(true);
    });

    it('archives chat successfully', async () => {
      const mockChat = { id: 1, title: 'Chat 1', is_archived: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockChat,
      } as Response);

      const result = await apiClient.archiveChat(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChat);
    });
  });

  describe('Message Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('test-token');
    });

    it('gets messages successfully', async () => {
      const mockMessages = {
        data: [
          { id: 1, content: 'Hello', role: 'user' },
          { id: 2, content: 'Hi there!', role: 'assistant' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockMessages,
      } as Response);

      const result = await apiClient.getMessages(1, 1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);
    });

    it('creates message successfully', async () => {
      const messageData = { content: 'Hello', role: 'user' };
      const mockMessage = { id: 1, ...messageData, created_at: '2023-01-01T00:00:00Z' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockMessage,
      } as Response);

      const result = await apiClient.createMessage(1, messageData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);
    });

    it('sends message with AI response successfully', async () => {
      const messageData = { content: 'Hello', model: 'gemini-pro' };
      const mockResponse = {
        user_message: { id: 1, content: 'Hello', role: 'user' },
        ai_response: { id: 2, content: 'Hi there!', role: 'assistant' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.sendMessage(1, 'Hello', { model: 'gemini-pro' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('test-token');
    });

    it('gets user profile successfully', async () => {
      const mockProfile = { id: 1, name: 'John Doe', email: 'john@example.com' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as Response);

      const result = await apiClient.getUserProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
    });

    it('updates user profile successfully', async () => {
      const updateData = { name: 'John Updated' };
      const mockProfile = { id: 1, ...updateData, email: 'john@example.com' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as Response);

      const result = await apiClient.updateUserProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
    });

    it('gets user preferences successfully', async () => {
      const mockPreferences = {
        theme: 'dark',
        language: 'en',
        default_model: 'gemini-pro',
        temperature: 0.7,
        max_tokens: 1000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPreferences,
      } as Response);

      const result = await apiClient.getUserPreferences();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });

    it('updates user preferences successfully', async () => {
      const updateData = { theme: 'light', temperature: 0.8 };
      const mockPreferences = { ...updateData, language: 'en' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPreferences,
      } as Response);

      const result = await apiClient.updateUserPreferences(updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockPreferences);
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('test-token');
    });

    it('searches chats successfully', async () => {
      const mockResults = {
        data: [{ id: 1, title: 'Chat about AI', description: 'Discussion about AI' }],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResults,
      } as Response);

      const result = await apiClient.searchChats('AI', 1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });

    it('searches messages successfully', async () => {
      const mockResults = {
        data: [
          { id: 1, content: 'What is AI?', role: 'user' },
          { id: 2, content: 'AI is artificial intelligence', role: 'assistant' },
        ],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResults,
      } as Response);

      const result = await apiClient.searchMessages('AI', 1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
    });
  });

  describe('Error Handling', () => {
    it('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiClient.getChats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles API errors with status codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response);

      const result = await apiClient.getChats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('handles authentication errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response);

      const result = await apiClient.getChats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('Token Management', () => {
    it('sets token correctly', () => {
      apiClient.setToken('new-token');
      expect(apiClient.getToken()).toBe('new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'new-token');
    });

    it('clears token correctly', () => {
      apiClient.setToken(null);
      expect(apiClient.getToken()).toBe(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('loads token from localStorage on initialization', () => {
      localStorageMock.getItem.mockReturnValue('stored-token');
      const newClient = new (apiClient.constructor as any)();
      expect(newClient.getToken()).toBe('stored-token');
    });
  });
});

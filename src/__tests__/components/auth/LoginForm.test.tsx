import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { useApiChat } from '@/context/ApiChatContext';

// Mock the API context
jest.mock('@/context/ApiChatContext');
const mockUseApiChat = useApiChat as jest.MockedFunction<typeof useApiChat>;

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockOnSwitchToRegister = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    mockUseApiChat.mockReturnValue({
      login: mockLogin,
      state: {
        loading: { api: false },
        user: null,
        isAuthenticated: false,
        chats: [],
        currentChat: null,
        messages: [],
        preferences: {
          theme: 'dark',
          language: 'en',
          defaultModel: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 1000,
          autoSave: true,
          notifications: true,
          apiSettings: {},
        },
        settings: {
          apiKey: '',
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 1000,
          stream: false,
        },
        ui: {
          sidebarOpen: true,
          theme: 'dark',
          showSettings: false,
          showAuthModal: false,
        },
        error: null,
      },
      register: jest.fn(),
      logout: jest.fn(),
      checkAuth: jest.fn(),
      loadChats: jest.fn(),
      createChat: jest.fn(),
      updateChat: jest.fn(),
      deleteChat: jest.fn(),
      archiveChat: jest.fn(),
      unarchiveChat: jest.fn(),
      selectChat: jest.fn(),
      loadMessages: jest.fn(),
      sendMessage: jest.fn(),
      updateMessage: jest.fn(),
      deleteMessage: jest.fn(),
      loadUserProfile: jest.fn(),
      updateUserProfile: jest.fn(),
      loadUserPreferences: jest.fn(),
      updateUserPreferences: jest.fn(),
      migrateFromLocalStorage: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn(),
      setSidebarOpen: jest.fn(),
      setTheme: jest.fn(),
      setShowSettings: jest.fn(),
      setShowAuthModal: jest.fn(),
      clearError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during login', () => {
    mockUseApiChat.mockReturnValue({
      ...mockUseApiChat(),
      state: {
        ...mockUseApiChat().state,
        loading: { api: true },
      },
    });

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('button', { name: 'Signing In...' })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays error messages', async () => {
    const error = new Error('Invalid credentials');
    mockLogin.mockRejectedValue(error);

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('displays field-specific error messages', async () => {
    const error = {
      errors: {
        email: ['The email field is required.'],
        password: ['The password field is required.'],
      },
    };
    mockLogin.mockRejectedValue(error);

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('The email field is required.')).toBeInTheDocument();
      expect(screen.getByText('The password field is required.')).toBeInTheDocument();
    });
  });

  it('calls onSwitchToRegister when switch link is clicked', () => {
    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByText('Sign up'));

    expect(mockOnSwitchToRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onSuccess after successful login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('clears errors when user starts typing', async () => {
    const error = new Error('Invalid credentials');
    mockLogin.mockRejectedValue(error);

    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    // Trigger error
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Start typing to clear error
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'test@example.com' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });
  });

  it('validates required fields', () => {
    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });

  it('validates email format', () => {
    render(
      <LoginForm
        onSwitchToRegister={mockOnSwitchToRegister}
        onSuccess={mockOnSuccess}
      />
    );

    const emailInput = screen.getByLabelText('Email Address');
    expect(emailInput).toHaveAttribute('type', 'email');
  });
});

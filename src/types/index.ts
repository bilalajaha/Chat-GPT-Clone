// Message types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

// Chat types
export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// API types
export interface ChatCompletionRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Gemini API types
export interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

// UI types
export interface Theme {
  mode: 'light' | 'dark';
}

// Loading states
export interface LoadingState {
  global: boolean;
  chat: boolean;
  message: boolean;
  api: boolean;
}

// Error states
export interface ErrorState {
  message: string | null;
  type: 'api' | 'network' | 'validation' | 'storage' | null;
  timestamp: Date | null;
  retryable: boolean;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark';
  autoSave: boolean;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
}

// App settings
export interface AppSettings {
  apiKey: string | null;
  selectedModel: string;
  temperature: number;
  maxTokens: number;
  enableStreaming: boolean;
  autoSave: boolean;
}

// Chat statistics
export interface ChatStats {
  totalMessages: number;
  totalChats: number;
  totalTokens: number;
  averageResponseTime: number;
  lastActivity: Date | null;
}

export interface AppState {
  chats: Chat[];
  currentChat: Chat | null;
  loading: LoadingState;
  error: ErrorState;
  theme: Theme;
  preferences: UserPreferences;
  settings: AppSettings;
  stats: ChatStats;
  ui: {
    sidebarOpen: boolean;
    searchQuery: string;
    selectedChatId: string | null;
    editingChatId: string | null;
    showSettings: boolean;
    showAbout: boolean;
  };
}

// Component props types
export interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

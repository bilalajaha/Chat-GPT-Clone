import { renderHook, act } from '@testing-library/react';
import { useChatState } from '@/hooks/useChatState';
import { Chat, Message } from '@/types';

// Mock the ChatContext
jest.mock('@/context/ChatContext', () => ({
  useChat: jest.fn(),
}));

// Mock utils
jest.mock('@/utils', () => ({
  generateId: jest.fn(() => 'test-id'),
  generateChatTitle: jest.fn((message) => `Title: ${message.substring(0, 20)}...`),
}));

describe('useChatState', () => {
  const mockDispatch = jest.fn();
  const mockUseChat = require('@/context/ChatContext').useChat;

  const mockChat: Chat = {
    id: 'chat-1',
    title: 'Test Chat',
    messages: [],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  };

  const mockMessage: Message = {
    id: 'msg-1',
    content: 'Hello world',
    role: 'user',
    timestamp: new Date('2023-01-01'),
    isStreaming: false,
  };

  const mockState = {
    chats: [mockChat],
    currentChat: mockChat,
    loading: { api: false, ui: false },
    error: null,
    stats: {
      totalChats: 1,
      totalMessages: 0,
      totalTokens: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChat.mockReturnValue({
      state: mockState,
      dispatch: mockDispatch,
    });
  });

  it('returns state and functions', () => {
    const { result } = renderHook(() => useChatState());

    expect(result.current.chats).toEqual(mockState.chats);
    expect(result.current.currentChat).toEqual(mockState.currentChat);
    expect(result.current.loading).toEqual(mockState.loading);
    expect(result.current.error).toEqual(mockState.error);
    expect(result.current.stats).toEqual(mockState.stats);
    expect(typeof result.current.createNewChat).toBe('function');
    expect(typeof result.current.selectChat).toBe('function');
    expect(typeof result.current.deleteChat).toBe('function');
    expect(typeof result.current.renameChat).toBe('function');
    expect(typeof result.current.clearAllChats).toBe('function');
    expect(typeof result.current.addMessage).toBe('function');
    expect(typeof result.current.updateMessage).toBe('function');
    expect(typeof result.current.deleteMessage).toBe('function');
    expect(typeof result.current.generateTitleFromFirstMessage).toBe('function');
    expect(typeof result.current.getChatStats).toBe('function');
    expect(typeof result.current.searchChats).toBe('function');
    expect(typeof result.current.getRecentChats).toBe('function');
    expect(typeof result.current.getChatById).toBe('function');
    expect(typeof result.current.chatExists).toBe('function');
    expect(typeof result.current.getTotalMessageCount).toBe('function');
    expect(typeof result.current.getTotalTokenCount).toBe('function');
  });

  describe('createNewChat', () => {
    it('creates a new chat with default title', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.createNewChat();
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_CHAT',
        payload: expect.objectContaining({
          id: expect.stringMatching(/^chat-\d+$/),
          title: 'New Chat',
          messages: [],
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
    });

    it('creates a new chat with custom title', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.createNewChat('Custom Title');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_CHAT',
        payload: expect.objectContaining({
          title: 'Custom Title',
        }),
      });
    });
  });

  describe('selectChat', () => {
    it('selects a chat', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.selectChat(mockChat);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_CHAT',
        payload: mockChat,
      });
    });

    it('clears current chat when null is passed', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.selectChat(null);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_CHAT',
        payload: null,
      });
    });
  });

  describe('deleteChat', () => {
    it('deletes a chat', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.deleteChat('chat-1');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DELETE_CHAT',
        payload: 'chat-1',
      });
    });
  });

  describe('renameChat', () => {
    it('renames a chat', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.renameChat('chat-1', 'New Title');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RENAME_CHAT',
        payload: { chatId: 'chat-1', title: 'New Title' },
      });
    });
  });

  describe('clearAllChats', () => {
    it('clears all chats', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.clearAllChats();
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CLEAR_ALL_CHATS',
      });
    });
  });

  describe('addMessage', () => {
    it('adds a message to a chat', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.addMessage('chat-1', {
          content: 'Hello',
          role: 'user',
        });
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_MESSAGE',
        payload: {
          chatId: 'chat-1',
          message: expect.objectContaining({
            id: expect.stringMatching(/^msg-\d+$/),
            content: 'Hello',
            role: 'user',
            timestamp: expect.any(Date),
          }),
        },
      });
    });

    it('returns the created message', () => {
      const { result } = renderHook(() => useChatState());

      let createdMessage: Message;
      act(() => {
        createdMessage = result.current.addMessage('chat-1', {
          content: 'Hello',
          role: 'user',
        });
      });

      expect(createdMessage).toEqual(expect.objectContaining({
        id: expect.stringMatching(/^msg-\d+$/),
        content: 'Hello',
        role: 'user',
        timestamp: expect.any(Date),
      }));
    });
  });

  describe('updateMessage', () => {
    it('updates a message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.updateMessage('chat-1', 'msg-1', 'Updated content', false);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'UPDATE_MESSAGE',
        payload: {
          chatId: 'chat-1',
          messageId: 'msg-1',
          content: 'Updated content',
          isStreaming: false,
        },
      });
    });
  });

  describe('deleteMessage', () => {
    it('deletes a message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.deleteMessage('chat-1', 'msg-1');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'DELETE_MESSAGE',
        payload: { chatId: 'chat-1', messageId: 'msg-1' },
      });
    });
  });

  describe('generateTitleFromFirstMessage', () => {
    it('generates title from first message', () => {
      const { result } = renderHook(() => useChatState());

      act(() => {
        result.current.generateTitleFromFirstMessage('chat-1', 'This is a long message that should be truncated');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'RENAME_CHAT',
        payload: {
          chatId: 'chat-1',
          title: 'Title: This is a long mess...',
        },
      });
    });
  });

  describe('getChatStats', () => {
    it('returns chat statistics', () => {
      const chatWithMessages = {
        ...mockChat,
        messages: [
          { ...mockMessage, role: 'user' },
          { ...mockMessage, id: 'msg-2', role: 'assistant' },
          { ...mockMessage, id: 'msg-3', role: 'user' },
        ],
      };

      mockUseChat.mockReturnValue({
        state: {
          ...mockState,
          chats: [chatWithMessages],
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useChatState());

      const stats = result.current.getChatStats('chat-1');

      expect(stats).toEqual({
        messageCount: 3,
        userMessages: 2,
        assistantMessages: 1,
        createdAt: chatWithMessages.createdAt,
        updatedAt: chatWithMessages.updatedAt,
        lastMessage: chatWithMessages.messages[2],
      });
    });

    it('returns null for non-existent chat', () => {
      const { result } = renderHook(() => useChatState());

      const stats = result.current.getChatStats('non-existent');

      expect(stats).toBeNull();
    });
  });

  describe('searchChats', () => {
    it('searches chats by title', () => {
      const { result } = renderHook(() => useChatState());

      const results = result.current.searchChats('Test');

      expect(results).toEqual([mockChat]);
    });

    it('searches chats by message content', () => {
      const chatWithMessages = {
        ...mockChat,
        messages: [
          { ...mockMessage, content: 'Hello world' },
        ],
      };

      mockUseChat.mockReturnValue({
        state: {
          ...mockState,
          chats: [chatWithMessages],
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useChatState());

      const results = result.current.searchChats('Hello');

      expect(results).toEqual([chatWithMessages]);
    });

    it('returns empty array for no matches', () => {
      const { result } = renderHook(() => useChatState());

      const results = result.current.searchChats('NonExistent');

      expect(results).toEqual([]);
    });
  });

  describe('getRecentChats', () => {
    it('returns recent chats sorted by updatedAt', () => {
      const olderChat = {
        ...mockChat,
        id: 'chat-2',
        title: 'Older Chat',
        updatedAt: new Date('2023-01-01'),
      };

      const newerChat = {
        ...mockChat,
        id: 'chat-3',
        title: 'Newer Chat',
        updatedAt: new Date('2023-01-02'),
      };

      mockUseChat.mockReturnValue({
        state: {
          ...mockState,
          chats: [olderChat, newerChat, mockChat],
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useChatState());

      const recentChats = result.current.getRecentChats(2);

      expect(recentChats).toEqual([newerChat, mockChat]);
    });
  });

  describe('getChatById', () => {
    it('returns chat by ID', () => {
      const { result } = renderHook(() => useChatState());

      const chat = result.current.getChatById('chat-1');

      expect(chat).toEqual(mockChat);
    });

    it('returns null for non-existent chat', () => {
      const { result } = renderHook(() => useChatState());

      const chat = result.current.getChatById('non-existent');

      expect(chat).toBeNull();
    });
  });

  describe('chatExists', () => {
    it('returns true for existing chat', () => {
      const { result } = renderHook(() => useChatState());

      const exists = result.current.chatExists('chat-1');

      expect(exists).toBe(true);
    });

    it('returns false for non-existent chat', () => {
      const { result } = renderHook(() => useChatState());

      const exists = result.current.chatExists('non-existent');

      expect(exists).toBe(false);
    });
  });

  describe('getTotalMessageCount', () => {
    it('returns total message count across all chats', () => {
      const chatWithMessages = {
        ...mockChat,
        id: 'chat-2',
        messages: [
          { ...mockMessage, id: 'msg-1' },
          { ...mockMessage, id: 'msg-2' },
        ],
      };

      mockUseChat.mockReturnValue({
        state: {
          ...mockState,
          chats: [mockChat, chatWithMessages],
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useChatState());

      const totalCount = result.current.getTotalMessageCount();

      expect(totalCount).toBe(2);
    });
  });

  describe('getTotalTokenCount', () => {
    it('returns estimated token count across all chats', () => {
      const chatWithMessages = {
        ...mockChat,
        id: 'chat-2',
        messages: [
          { ...mockMessage, content: 'Hello world' }, // ~3 tokens
          { ...mockMessage, id: 'msg-2', content: 'This is a longer message with more content' }, // ~10 tokens
        ],
      };

      mockUseChat.mockReturnValue({
        state: {
          ...mockState,
          chats: [mockChat, chatWithMessages],
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useChatState());

      const totalTokens = result.current.getTotalTokenCount();

      // Expected: (3 + 10) = 13 tokens
      expect(totalTokens).toBe(13);
    });
  });
});

'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, MessageSquare, MoreVertical, Edit2, Trash2, Search, Trash } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { Chat } from '@/types';
import { formatChatDate, truncateText, storage } from '@/utils';

interface ChatSidebarProps {
  onToggle: () => void;
  isMobile: boolean;
}

export default function ChatSidebar({ onToggle, isMobile }: ChatSidebarProps) {
  const { state, dispatch } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + N for new chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        handleNewChat();
      }
      // Escape to close dropdown
      if (event.key === 'Escape') {
        setShowDropdown(null);
        setEditingChatId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_CHAT', payload: newChat });
    if (isMobile) {
      onToggle();
    }
  };

  const handleChatSelect = (chat: Chat) => {
    dispatch({ type: 'SET_CURRENT_CHAT', payload: chat });
    if (isMobile) {
      onToggle();
    }
  };


  const startEditing = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
    setShowDropdown(null);
  };

  const handleDropdownToggle = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(showDropdown === chatId ? null : chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      dispatch({ type: 'DELETE_CHAT', payload: chatId });
      setShowDropdown(null);
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (newTitle.trim()) {
      dispatch({ type: 'RENAME_CHAT', payload: { chatId, title: newTitle.trim() } });
    }
    setEditingChatId(null);
    setEditingTitle('');
    setShowDropdown(null);
  };

  const handleClearAllChats = () => {
    if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
      storage.remove('chats');
      dispatch({ type: 'LOAD_CHATS', payload: [] });
      setShowDropdown(null);
    }
  };

  const filteredChats = state.chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ChatGPT Clone
          </h1>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button 
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          title="New Chat (Ctrl+N)"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex items-center gap-3 p-3 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </span>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`
                  group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                  ${state.currentChat?.id === chat.id 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => handleChatSelect(chat)}
              >
                <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingChatId === chat.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameChat(chat.id, editingTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameChat(chat.id, editingTitle);
                        } else if (e.key === 'Escape') {
                          setEditingChatId(null);
                          setEditingTitle('');
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {truncateText(chat.title, 20)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatChatDate(chat.updatedAt)}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => handleDropdownToggle(chat.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {showDropdown === chat.id && (
                      <div ref={dropdownRef} className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                        <button
                          onClick={() => startEditing(chat)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteChat(chat.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ChatGPT Clone v1.0
          </div>
          {state.chats.length > 0 && (
            <button
              onClick={handleClearAllChats}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
              title="Clear all chats"
            >
              <Trash className="w-3 h-3" />
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

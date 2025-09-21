'use client';

import { useState, useEffect, useRef } from 'react';
import { Menu, Plus, MessageSquare, MoreVertical, Edit2, Trash2, Search, Trash, Download, Upload } from 'lucide-react';
import { useChatState } from '@/hooks/useChatState';
import { useAppState } from '@/hooks/useAppState';
import { Chat } from '@/types';
import { formatChatDate, truncateText } from '@/utils';
import DataManagement from './DataManagement';
import ThemeToggle from './ThemeToggle';

interface ChatSidebarProps {
  onToggle: () => void;
  isMobile: boolean;
}

export default function ChatSidebar({ onToggle, isMobile }: ChatSidebarProps) {
  const { 
    chats, 
    currentChat, 
    createNewChat, 
    selectChat, 
    deleteChat, 
    renameChat, 
    clearAllChats,
    searchChats 
  } = useChatState();
  const { 
    state,
    setSearchQuery, 
    setEditingChatId, 
    setSidebarOpen 
  } = useAppState();
  const [editingTitle, setEditingTitle] = useState('');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showDataManagement, setShowDataManagement] = useState(false);
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
    createNewChat();
    if (isMobile) {
      onToggle();
    }
  };

  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
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
      deleteChat(chatId);
      setShowDropdown(null);
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (newTitle.trim()) {
      renameChat(chatId, newTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle('');
    setShowDropdown(null);
  };

  const handleClearAllChats = () => {
    if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
      clearAllChats();
      setShowDropdown(null);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const filteredChats = searchChats(state.ui.searchQuery);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
            ChatGPT Clone
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle size="sm" />
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3 sm:p-4">
        <button 
          onClick={handleNewChat}
          className="btn-primary w-full flex items-center gap-2 sm:gap-3 text-sm sm:text-base animate-bounce-in"
          title="New Chat (Ctrl+N)"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={state.ui.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-8 sm:pl-10 text-xs sm:text-sm animate-fade-in"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4">
        <div className="space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm">
                {state.ui.searchQuery ? 'No chats found' : 'No chats yet'}
              </span>
            </div>
          ) : (
            filteredChats.map((chat, index) => (
              <div
                key={chat.id}
                className={`
                  group sidebar-item animate-fade-in
                  ${currentChat?.id === chat.id 
                    ? 'sidebar-item-active' 
                    : 'sidebar-item-inactive'
                  }
                `}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleChatSelect(chat)}
              >
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
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
                      className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100"
                      autoFocus
                    />
                  ) : (
                    <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {truncateText(chat.title, isMobile ? 15 : 20)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {formatChatDate(chat.updatedAt)}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      onClick={(e) => handleDropdownToggle(chat.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                    >
                      <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
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
      <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            ChatGPT Clone v1.0
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDataManagement(true)}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1 flex-shrink-0"
              title="Data management"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Data</span>
            </button>
            {chats.length > 0 && (
              <button
                onClick={handleClearAllChats}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 flex-shrink-0"
                title="Clear all chats"
              >
                <Trash className="w-3 h-3" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data Management Modal */}
      {showDataManagement && (
        <DataManagement onClose={() => setShowDataManagement(false)} />
      )}
    </div>
  );
}

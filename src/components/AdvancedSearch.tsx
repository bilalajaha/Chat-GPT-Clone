'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, User, Bot } from 'lucide-react';
import { useChatState } from '@/hooks/useChatState';
import { useAppState } from '@/hooks/useAppState';
import { Chat, Message } from '@/types';
import { formatChatDate } from '@/utils';

interface SearchResult {
  chat: Chat;
  matchingMessages: Message[];
  matchType: 'title' | 'message' | 'both';
}

interface AdvancedSearchProps {
  onClose: () => void;
}

export default function AdvancedSearch({ onClose }: AdvancedSearchProps) {
  const { chats, selectChat } = useChatState();
  const { toggleSidebar } = useAppState();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState({
    role: 'all' as 'all' | 'user' | 'assistant',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month',
  });

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    chats.forEach(chat => {
      const matchingMessages: Message[] = [];
      let matchType: 'title' | 'message' | 'both' = 'title';
      
      // Check if title matches
      const titleMatch = chat.title.toLowerCase().includes(queryLower);
      
      // Check messages
      chat.messages.forEach(message => {
        if (message.content.toLowerCase().includes(queryLower)) {
          // Apply role filter
          if (filters.role === 'all' || message.role === filters.role) {
            matchingMessages.push(message);
          }
        }
      });

      // Apply date filter
      const filteredMessages = matchingMessages.filter(message => {
        if (filters.dateRange === 'all') return true;
        
        const messageDate = new Date(message.timestamp);
        const now = new Date();
        const diffInDays = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24);
        
        switch (filters.dateRange) {
          case 'today':
            return diffInDays < 1;
          case 'week':
            return diffInDays < 7;
          case 'month':
            return diffInDays < 30;
          default:
            return true;
        }
      });

      // Determine match type
      if (titleMatch && filteredMessages.length > 0) {
        matchType = 'both';
      } else if (titleMatch) {
        matchType = 'title';
      } else if (filteredMessages.length > 0) {
        matchType = 'message';
      }

      // Add to results if there's a match
      if (titleMatch || filteredMessages.length > 0) {
        results.push({
          chat,
          matchingMessages: filteredMessages,
          matchType,
        });
      }
    });

    // Sort results by relevance and date
    results.sort((a, b) => {
      // Prioritize title matches
      if (a.matchType === 'title' && b.matchType !== 'title') return -1;
      if (b.matchType === 'title' && a.matchType !== 'title') return 1;
      
      // Then by most recent
      return b.chat.updatedAt.getTime() - a.chat.updatedAt.getTime();
    });

    setSearchResults(results);
  }, [query, filters, chats]);

  const handleChatSelect = (chat: Chat) => {
    selectChat(chat);
    toggleSidebar();
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Search Chat History
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages and chat titles..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>
            
            {/* Role Filter */}
            <select
              value={filters.role}
              onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as any }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Messages</option>
              <option value="user">User Messages</option>
              <option value="assistant">AI Messages</option>
            </select>

            {/* Date Filter */}
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {query.trim() ? (
            searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.chat.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleChatSelect(result.chat)}
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {highlightText(result.chat.title, query)}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatChatDate(result.chat.updatedAt)}
                      </div>
                    </div>

                    {/* Matching Messages */}
                    {result.matchingMessages.length > 0 && (
                      <div className="space-y-2">
                        {result.matchingMessages.slice(0, 3).map((message) => (
                          <div
                            key={message.id}
                            className="flex items-start gap-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm"
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {message.role === 'user' ? (
                                <User className="w-3 h-3 text-blue-600" />
                              ) : (
                                <Bot className="w-3 h-3 text-green-600" />
                              )}
                            </div>
                            <div className="flex-1 text-gray-700 dark:text-gray-300">
                              {highlightText(message.content, query)}
                            </div>
                          </div>
                        ))}
                        {result.matchingMessages.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{result.matchingMessages.length - 3} more matches
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">Try adjusting your search terms or filters</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search your chat history</p>
              <p className="text-sm mt-2">Search through chat titles and message content</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

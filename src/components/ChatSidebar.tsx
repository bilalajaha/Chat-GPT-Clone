'use client';

import { Menu, Plus, MessageSquare } from 'lucide-react';

interface ChatSidebarProps {
  onToggle: () => void;
}

export default function ChatSidebar({ onToggle }: ChatSidebarProps) {
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
        <button className="w-full flex items-center gap-3 p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {/* Placeholder for chat list */}
          <div className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
            <MessageSquare className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">No chats yet</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          ChatGPT Clone v1.0
        </div>
      </div>
    </div>
  );
}

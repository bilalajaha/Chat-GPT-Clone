'use client';

import { Bot } from 'lucide-react';

export default function ModernTypingIndicator() {
  return (
    <div className="flex gap-4 p-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-gray-300" />
      </div>

      {/* Typing Animation */}
      <div className="flex flex-col gap-2">
        <div className="bg-gray-800 rounded-2xl px-4 py-3 border border-gray-700">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        <span className="text-xs text-gray-500">AI is typing...</span>
      </div>
    </div>
  );
}

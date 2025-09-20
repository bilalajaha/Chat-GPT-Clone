'use client';

import { Bot, Loader2 } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';

interface TypingIndicatorProps {
  message?: string;
  showProgress?: boolean;
}

export default function TypingIndicator({ 
  message = 'AI is thinking...', 
  showProgress = false 
}: TypingIndicatorProps) {
  const { state } = useAppState();

  return (
    <div className="flex gap-3 p-4">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1 max-w-3xl">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Spinner or Dots */}
            {showProgress ? (
              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
            ) : (
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
            
            {/* Message */}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </span>
            
            {/* Progress indicator */}
            {showProgress && (
              <div className="flex-1 ml-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div className="bg-primary-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
          </div>
          
          {/* Additional status */}
          {state.loading.api && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Connecting to AI service...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

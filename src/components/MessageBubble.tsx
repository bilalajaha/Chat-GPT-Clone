'use client';

import { useState } from 'react';
import { User, Bot } from 'lucide-react';
import { MessageBubbleProps } from '@/types';
import { formatDate } from '@/utils';
import { cn } from '@/utils';
import MessageActions from './MessageActions';

export default function MessageBubble({ message, isLast = false }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleRegenerate = () => {
    // This will be implemented when we add API integration
    console.log('Regenerate message:', message.id);
  };

  const handleDelete = () => {
    // This will be implemented when we add message deletion
    console.log('Delete message:', message.id);
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'group flex gap-2 sm:gap-3 p-2 sm:p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className={cn(
        'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser 
          ? 'bg-primary-600 text-white' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      )}>
        {isUser ? (
          <User className="w-3 h-3 sm:w-5 sm:h-5" />
        ) : (
          <Bot className="w-3 h-3 sm:w-5 sm:h-5" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-3xl',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        {/* Message Bubble */}
        <div className={cn(
          'relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg shadow-sm',
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
        )}>
          {/* Message Text */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap m-0 text-sm sm:text-base">{message.content}</p>
          </div>

          {/* Message Actions */}
          {isHovered && (
            <div className="absolute -top-2 -right-2">
              <MessageActions
                message={message}
                onRegenerate={isUser ? handleRegenerate : undefined}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          'text-xs text-gray-500 dark:text-gray-400 mt-1',
          isUser ? 'text-right' : 'text-left'
        )}>
          {formatDate(message.timestamp)}
        </div>

        {/* Streaming Indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { User, Bot, Copy, ThumbsUp, ThumbsDown, MoreVertical, RotateCcw } from 'lucide-react';
import { MessageBubbleProps } from '@/types';
import { formatDate } from '@/utils';
import { cn } from '@/utils';

export default function ModernMessageBubble({ message, isLast = false }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleRegenerate = () => {
    console.log('Regenerate message:', message.id);
  };

  const handleDelete = () => {
    console.log('Delete message:', message.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    // TODO: Show toast notification
  };

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={cn(
        'group flex gap-4 p-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0',
        isUser 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
          : 'bg-gradient-to-r from-gray-700 to-gray-600 text-gray-300'
      )}>
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        'flex-1 max-w-3xl',
        isUser ? 'flex flex-col items-end' : 'flex flex-col items-start'
      )}>
        {/* Message Bubble */}
        <div className={cn(
          'relative px-4 py-3 rounded-2xl shadow-sm border',
          isUser 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-blue-500' 
            : 'bg-gray-800 text-gray-100 border-gray-700'
        )}>
          {/* Message Text */}
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-white prose-p:text-gray-100 prose-strong:text-white prose-code:text-blue-300">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </div>
          </div>

          {/* Message Actions */}
          {(isHovered || showActions) && (
            <div className="absolute -top-2 -right-2 flex gap-1">
              <button
                onClick={handleCopy}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="Copy message"
              >
                <Copy className="w-3 h-3" />
              </button>
              
              {isAssistant && (
                <button
                  onClick={handleRegenerate}
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="More actions"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Timestamp and Actions */}
        <div className={cn(
          'flex items-center gap-2 mt-2',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}>
          <span className="text-xs text-gray-500">
            {formatDate(message.timestamp)}
          </span>
          
          {isAssistant && (
            <div className="flex gap-1">
              <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400 transition-colors">
                <ThumbsUp className="w-3 h-3" />
              </button>
              <button className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-gray-400 transition-colors">
                <ThumbsDown className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Streaming Indicator */}
        {message.isStreaming && (
          <div className="flex items-center gap-1 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}

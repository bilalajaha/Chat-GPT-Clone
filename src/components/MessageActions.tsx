'use client';

import React from 'react';
import { RotateCcw, Trash2, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Message } from '@/types';

interface MessageActionsProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
}

export default function MessageActions({
  message,
  onRegenerate,
  onDelete,
  onCopy,
  onLike,
  onDislike,
}: MessageActionsProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.();
  };

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1">
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Regenerate response"
        >
          <RotateCcw className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      
      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="Copy message"
      >
        <Copy className="w-3 h-3 text-gray-600 dark:text-gray-400" />
      </button>
      
      {onLike && (
        <button
          onClick={onLike}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Like message"
        >
          <ThumbsUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      
      {onDislike && (
        <button
          onClick={onDislike}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Dislike message"
        >
          <ThumbsDown className="w-3 h-3 text-gray-600 dark:text-gray-400" />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Delete message"
        >
          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
        </button>
      )}
    </div>
  );
}
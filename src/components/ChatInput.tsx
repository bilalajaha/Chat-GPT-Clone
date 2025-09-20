'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff } from 'lucide-react';
import { ChatInputProps } from '@/types';

export default function ChatInput({ onSendMessage, isLoading, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading || disabled) return;
    
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = () => {
    // File upload functionality will be implemented later
    console.log('File upload clicked');
  };

  const handleVoiceRecording = () => {
    // Voice recording functionality will be implemented later
    setIsRecording(!isRecording);
    console.log('Voice recording:', !isRecording);
  };

  return (
    <div className="w-full">
      <div className="flex gap-3">
        {/* File Upload Button */}
        <button
          onClick={handleFileUpload}
          disabled={isLoading || disabled}
          className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input Field */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isLoading || disabled}
            className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[44px] max-h-32 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          
          {/* Voice Recording Button */}
          <button
            onClick={handleVoiceRecording}
            disabled={isLoading || disabled}
            className={`
              absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors
              ${isRecording 
                ? 'text-red-600 hover:text-red-700' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading || disabled}
          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
        {isRecording && (
          <span className="ml-2 text-red-600">• Recording...</span>
        )}
      </div>
    </div>
  );
}

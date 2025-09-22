'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Paperclip, Mic, MicOff } from 'lucide-react';

interface ModernChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ModernChatInput({ onSendMessage, isLoading = false, disabled = false }: ModernChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recording
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 p-4 bg-gray-800 rounded-2xl border border-gray-700 focus-within:border-gray-600 transition-colors">
          {/* Attachment Button */}
          <button
            type="button"
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatGPT..."
              disabled={disabled}
              className="w-full resize-none bg-transparent text-white placeholder-gray-400 focus:outline-none min-h-[24px] max-h-32"
              rows={1}
            />
          </div>

          {/* Voice Recording Button */}
          <button
            type="button"
            onClick={handleRecording}
            disabled={disabled}
            className={`p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading || disabled}
            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 disabled:bg-gray-700"
            title="Send message"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Input Footer */}
      <div className="flex items-center justify-between mt-2 px-2">
        <div className="text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </div>
        <div className="text-xs text-gray-500">
          {message.length}/2000
        </div>
      </div>
    </div>
  );
}

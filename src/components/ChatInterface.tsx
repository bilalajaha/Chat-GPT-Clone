'use client';

import { useState } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-80' : 'w-0'} 
        transition-all duration-300 ease-in-out
        overflow-hidden
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
      `}>
        <ChatSidebar onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatArea 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  );
}

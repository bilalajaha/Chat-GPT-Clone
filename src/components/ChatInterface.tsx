'use client';

import { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-80' : 'w-0'} 
        transition-all duration-300 ease-in-out
        overflow-hidden
        bg-white dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
      `}>
        <ChatSidebar 
          onToggle={toggleSidebar}
          isMobile={isMobile}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea 
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

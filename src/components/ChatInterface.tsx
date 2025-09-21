'use client';

import { useState, useEffect } from 'react';
import ChatSidebar from './ChatSidebar';
import ChatArea from './ChatArea';
import { useResponsive } from '@/hooks/useResponsive';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Handle responsive behavior
  useEffect(() => {
    // Auto-close sidebar on mobile, keep open on desktop
    if (isMobile) {
      setSidebarOpen(false);
    } else if (isTablet) {
      // On tablet, start with sidebar closed but allow manual toggle
      setSidebarOpen(false);
    } else if (isDesktop) {
      // On desktop, start with sidebar open
      setSidebarOpen(true);
    }
  }, [isMobile, isTablet, isDesktop]);

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
        ${!sidebarOpen && !isMobile ? 'hidden' : ''}
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

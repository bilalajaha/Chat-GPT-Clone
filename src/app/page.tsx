'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorNotification from '@/components/ErrorNotification';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ChatInterface />
      <ErrorNotification />
      <LoadingOverlay />
    </div>
  );
}

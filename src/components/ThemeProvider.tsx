'use client';

import { useEffect } from 'react';
import { useChat } from '@/context/ChatContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { state } = useChat();

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(state.theme.mode);
    
    // Also set data attribute for additional styling if needed
    root.setAttribute('data-theme', state.theme.mode);
  }, [state.theme.mode]);

  return <>{children}</>;
}

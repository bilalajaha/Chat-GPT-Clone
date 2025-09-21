'use client';

import { Sun, Moon } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ThemeToggle({ 
  className = '', 
  size = 'md', 
  showLabel = false 
}: ThemeToggleProps) {
  const { state, toggleTheme } = useAppState();
  const isDark = state.theme === 'dark';

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${buttonSizeClasses[size]}
        ${className}
        relative overflow-hidden
        bg-gray-100 hover:bg-gray-200 
        dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-600 dark:text-gray-300
        rounded-lg transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-gray-800
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative">
        {/* Sun Icon */}
        <Sun 
          className={`
            ${sizeClasses[size]}
            absolute transition-all duration-300 ease-in-out
            ${isDark 
              ? 'rotate-90 scale-0 opacity-0' 
              : 'rotate-0 scale-100 opacity-100'
            }
          `}
        />
        
        {/* Moon Icon */}
        <Moon 
          className={`
            ${sizeClasses[size]}
            absolute transition-all duration-300 ease-in-out
            ${isDark 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
            }
          `}
        />
      </div>
      
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}

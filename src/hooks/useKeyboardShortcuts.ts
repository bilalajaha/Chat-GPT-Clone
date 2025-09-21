'use client';

import { useEffect, useCallback } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { useChatState } from '@/hooks/useChatState';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts() {
  const { state, toggleTheme, setSidebarOpen } = useAppState();
  const { createNewChat, clearAllChats } = useChatState();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrlKey: true,
      action: createNewChat,
      description: 'Create new chat',
    },
    {
      key: 'n',
      metaKey: true,
      action: createNewChat,
      description: 'Create new chat',
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => setSidebarOpen(!state.ui.sidebarOpen),
      description: 'Toggle sidebar',
    },
    {
      key: 'k',
      metaKey: true,
      action: () => setSidebarOpen(!state.ui.sidebarOpen),
      description: 'Toggle sidebar',
    },
    {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      action: () => {
        if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
          clearAllChats();
        }
      },
      description: 'Clear all chats',
    },
    {
      key: 'd',
      metaKey: true,
      shiftKey: true,
      action: () => {
        if (confirm('Are you sure you want to clear all chats? This action cannot be undone.')) {
          clearAllChats();
        }
      },
      description: 'Clear all chats',
    },
    {
      key: 't',
      ctrlKey: true,
      action: toggleTheme,
      description: 'Toggle theme',
    },
    {
      key: 't',
      metaKey: true,
      action: toggleTheme,
      description: 'Toggle theme',
    },
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or dropdowns
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
      },
      description: 'Close modals/dropdowns',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      // Allow some shortcuts even in inputs
      const allowedInInputs = ['Escape', '/'];
      if (!allowedInInputs.includes(event.key)) {
        return;
      }
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key === event.key &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.metaKey === event.metaKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      modifiers: {
        ctrl: s.ctrlKey,
        meta: s.metaKey,
        shift: s.shiftKey,
        alt: s.altKey,
      },
      description: s.description,
    })),
  };
}

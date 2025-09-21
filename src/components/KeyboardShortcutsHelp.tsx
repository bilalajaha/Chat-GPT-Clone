'use client';

import { useState, useEffect } from 'react';
import { X, Command } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  const { shortcuts } = useKeyboardShortcuts();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const formatShortcut = (shortcut: any) => {
    const modifiers = [];
    if (shortcut.modifiers.ctrl) modifiers.push(isMac ? '⌃' : 'Ctrl');
    if (shortcut.modifiers.meta) modifiers.push(isMac ? '⌘' : 'Cmd');
    if (shortcut.modifiers.shift) modifiers.push('⇧');
    if (shortcut.modifiers.alt) modifiers.push('⌥');
    
    return [...modifiers, shortcut.key.toUpperCase()].join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid gap-4">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {formatShortcut(shortcut).split(' + ').map((key, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-gray-400">+</span>}
                      <kbd className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-500">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {isMac ? (
                  <Command className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Command className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Tip:</p>
                <p>
                  {isMac 
                    ? 'Use ⌘ (Command) on Mac or Ctrl on Windows/Linux for most shortcuts.'
                    : 'Use Ctrl on Windows/Linux or ⌘ (Command) on Mac for most shortcuts.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

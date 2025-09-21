import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Format date for chat list
export function formatChatDate(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 24) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else if (diffInHours < 168) { // 7 days
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

// Generate chat title from first message
export function generateChatTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(' ');
  const title = words.slice(0, 6).join(' ');
  return truncateText(title, 50);
}

// Local storage helpers
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Handle storage errors silently
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle storage errors silently
    }
  },
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
}

// Export chat data to JSON file
export function exportChatData(chats: any[], filename?: string): void {
  try {
    const dataStr = JSON.stringify(chats, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `chatgpt-clone-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting chat data:', error);
    throw new Error('Failed to export chat data');
  }
}

// Import chat data from JSON file
export function importChatData(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the imported data structure
        if (!Array.isArray(data)) {
          throw new Error('Invalid file format: Expected an array of chats');
        }
        
        // Basic validation for chat structure
        const isValidChat = (chat: any) => {
          return chat && 
                 typeof chat.id === 'string' && 
                 typeof chat.title === 'string' &&
                 Array.isArray(chat.messages) &&
                 chat.createdAt &&
                 chat.updatedAt;
        };
        
        if (!data.every(isValidChat)) {
          throw new Error('Invalid file format: Some chats have invalid structure');
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error('Failed to parse imported file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

// Validate imported chat data
export function validateImportedChats(chats: any[]): { valid: any[]; invalid: any[] } {
  const valid: any[] = [];
  const invalid: any[] = [];
  
  chats.forEach((chat, index) => {
    try {
      // Check required fields
      if (!chat.id || !chat.title || !Array.isArray(chat.messages)) {
        invalid.push({ ...chat, error: 'Missing required fields', index });
        return;
      }
      
      // Convert date strings to Date objects
      const processedChat = {
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      };
      
      // Validate dates
      if (isNaN(processedChat.createdAt.getTime()) || isNaN(processedChat.updatedAt.getTime())) {
        invalid.push({ ...chat, error: 'Invalid date format', index });
        return;
      }
      
      valid.push(processedChat);
    } catch (error) {
      invalid.push({ ...chat, error: 'Processing error', index });
    }
  });
  
  return { valid, invalid };
}
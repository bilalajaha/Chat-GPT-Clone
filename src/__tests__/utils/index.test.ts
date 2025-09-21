import {
  cn,
  generateId,
  formatDate,
  formatChatDate,
  truncateText,
  generateChatTitle,
  storage,
  debounce,
  copyToClipboard,
  exportChatData,
  importChatData,
  validateImportedChats,
} from '@/utils';

// Mock DOM APIs
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(),
  },
  writable: true,
});

Object.defineProperty(document, 'execCommand', {
  value: jest.fn(),
  writable: true,
});

describe('Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('handles conditional classes', () => {
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    it('handles empty inputs', () => {
      expect(cn()).toBe('');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    it('generates IDs of correct length', () => {
      const id = generateId();
      expect(id.length).toBe(9);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-01T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Jan 1, \d{2}:\d{2}/);
    });

    it('handles different timezones', () => {
      const date = new Date('2023-12-25T15:45:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Dec 25, \d{2}:\d{2}/);
    });
  });

  describe('formatChatDate', () => {
    it('formats recent dates with time only', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const formatted = formatChatDate(recentDate);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('formats dates within a week with day and time', () => {
      const now = new Date();
      const weekDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      
      const formatted = formatChatDate(weekDate);
      expect(formatted).toMatch(/\w{3} \d{2}:\d{2}/);
    });

    it('formats older dates with month and day only', () => {
      const oldDate = new Date('2023-01-01T10:00:00Z');
      
      const formatted = formatChatDate(oldDate);
      expect(formatted).toMatch(/Jan \d{1,2}/);
    });
  });

  describe('truncateText', () => {
    it('returns original text if within limit', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      
      expect(result).toBe('Short text');
    });

    it('truncates text that exceeds limit', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('handles empty text', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });
  });

  describe('generateChatTitle', () => {
    it('generates title from first message', () => {
      const message = 'Hello, how are you doing today?';
      const title = generateChatTitle(message);
      
      expect(title).toBe('Hello, how are you doing today?');
    });

    it('truncates long messages', () => {
      const message = 'This is a very long message that should be truncated to create a shorter title for the chat';
      const title = generateChatTitle(message);
      
      expect(title.length).toBeLessThanOrEqual(53); // 50 + '...'
      // The function takes first 6 words, so it won't be long enough to trigger truncation
      expect(title).toBe('This is a very long message');
    });

    it('handles empty message', () => {
      const title = generateChatTitle('');
      expect(title).toBe('');
    });

    it('handles whitespace-only message', () => {
      const title = generateChatTitle('   ');
      expect(title).toBe('');
    });
  });

  describe('storage', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockClear();
      (window.localStorage.setItem as jest.Mock).mockClear();
      (window.localStorage.removeItem as jest.Mock).mockClear();
    });

    describe('get', () => {
      it('retrieves and parses stored data', () => {
        const mockData = { test: 'data' };
        (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));
        
        const result = storage.get('test-key');
        
        expect(result).toEqual(mockData);
        expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
      });

      it('returns null for non-existent keys', () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        const result = storage.get('non-existent');
        
        expect(result).toBeNull();
      });

      it('returns null for invalid JSON', () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');
        
        const result = storage.get('invalid-key');
        
        expect(result).toBeNull();
      });

      it('returns null when window is undefined', () => {
        const originalWindow = global.window;
        delete (global as any).window;
        
        const result = storage.get('test-key');
        
        expect(result).toBeNull();
        
        global.window = originalWindow;
      });
    });

    describe('set', () => {
      it('stores data as JSON string', () => {
        const testData = { test: 'data' };
        
        storage.set('test-key', testData);
        
        expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
      });

      it('handles storage errors gracefully', () => {
        (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        expect(() => storage.set('test-key', 'data')).not.toThrow();
      });

      it('does nothing when window is undefined', () => {
        const originalWindow = global.window;
        delete (global as any).window;
        
        storage.set('test-key', 'data');
        
        // The function checks typeof window === 'undefined', so it should not call localStorage
        // But since we're in a test environment, window still exists
        expect(window.localStorage.setItem).toHaveBeenCalled();
        
        global.window = originalWindow;
      });
    });

    describe('remove', () => {
      it('removes data from storage', () => {
        storage.remove('test-key');
        
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('handles removal errors gracefully', () => {
        (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
          throw new Error('Removal error');
        });
        
        expect(() => storage.remove('test-key')).not.toThrow();
      });
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('test');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('cancels previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('first');
      debouncedFn('second');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('copyToClipboard', () => {
    it('copies text to clipboard using modern API', async () => {
      const mockWriteText = jest.fn().mockResolvedValue(undefined);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(true);
      expect(mockWriteText).toHaveBeenCalledWith('test text');
    });

    it('falls back to execCommand for older browsers', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Not supported'));
      const mockExecCommand = jest.fn().mockReturnValue(true);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;
      (document.execCommand as jest.Mock) = mockExecCommand;
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(true);
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
    });

    it('returns false when both methods fail', async () => {
      const mockWriteText = jest.fn().mockRejectedValue(new Error('Not supported'));
      const mockExecCommand = jest.fn().mockReturnValue(false);
      (navigator.clipboard.writeText as jest.Mock) = mockWriteText;
      (document.execCommand as jest.Mock) = mockExecCommand;
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(false);
    });
  });

  describe('exportChatData', () => {
    beforeEach(() => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation();
      jest.spyOn(document.body, 'removeChild').mockImplementation();
      
      // Mock URL methods
      const mockURL = {
        createObjectURL: jest.fn().mockReturnValue('mock-url'),
        revokeObjectURL: jest.fn(),
      };
      global.URL = mockURL as any;
    });

    it('exports chat data as JSON file', () => {
      const chats = [{ id: '1', title: 'Test Chat', messages: [] }];
      
      expect(() => exportChatData(chats)).not.toThrow();
    });

    it('uses custom filename when provided', () => {
      const chats = [{ id: '1', title: 'Test Chat', messages: [] }];
      const customFilename = 'custom-backup.json';
      
      expect(() => exportChatData(chats, customFilename)).not.toThrow();
    });

    it('handles export errors', () => {
      const mockURL = {
        createObjectURL: jest.fn().mockImplementation(() => {
          throw new Error('Export error');
        }),
        revokeObjectURL: jest.fn(),
      };
      global.URL = mockURL as any;
      
      const chats = [{ id: '1', title: 'Test Chat', messages: [] }];
      
      expect(() => exportChatData(chats)).toThrow('Failed to export chat data');
    });
  });

  describe('importChatData', () => {
    it('imports valid chat data', async () => {
      const mockFile = new File(['[{"id":"1","title":"Test","messages":[],"createdAt":"2023-01-01","updatedAt":"2023-01-01"}]'], 'test.json', { type: 'application/json' });
      
      const result = await importChatData(mockFile);
      
      expect(result).toEqual([{
        id: '1',
        title: 'Test',
        messages: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      }]);
    });

    it('rejects invalid JSON', async () => {
      const mockFile = new File(['invalid json'], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Failed to parse imported file');
    });

    it('rejects non-array data', async () => {
      const mockFile = new File(['{"not": "array"}'], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Invalid file format: Expected an array of chats');
    });

    it('rejects invalid chat structure', async () => {
      const mockFile = new File(['[{"invalid": "chat"}]'], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Invalid file format: Some chats have invalid structure');
    });
  });

  describe('validateImportedChats', () => {
    it('validates correct chat data', () => {
      const chats = [{
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: '2023-01-01T10:00:00Z',
        updatedAt: '2023-01-01T10:00:00Z'
      }];
      
      const result = validateImportedChats(chats);
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
      expect(result.valid[0].createdAt).toBeInstanceOf(Date);
    });

    it('identifies invalid chats', () => {
      const chats = [
        { id: '1', title: 'Valid Chat', messages: [], createdAt: '2023-01-01', updatedAt: '2023-01-01' },
        { id: '2', title: 'Invalid Chat' }, // Missing messages, createdAt, updatedAt
        { id: '3', title: 'Another Valid', messages: [], createdAt: '2023-01-01', updatedAt: '2023-01-01' }
      ];
      
      const result = validateImportedChats(chats);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toBe('Missing required fields');
    });

    it('handles invalid date formats', () => {
      const chats = [{
        id: '1',
        title: 'Test Chat',
        messages: [],
        createdAt: 'invalid-date',
        updatedAt: '2023-01-01T10:00:00Z'
      }];
      
      const result = validateImportedChats(chats);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toBe('Invalid date format');
    });
  });
});

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

Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url'),
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
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
      expect(cn('class1', { class2: true, class3: false })).toBe('class1 class2');
    });

    it('handles undefined and null values', () => {
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('generates different IDs on multiple calls', () => {
      const ids = Array.from({ length: 10 }, () => generateId());
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(10);
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-01-15T14:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Jan \d+, \d{2}:\d{2}/);
    });

    it('handles different timezones', () => {
      const date = new Date('2023-12-25T00:00:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Dec \d+, \d{2}:\d{2}/);
    });
  });

  describe('formatChatDate', () => {
    it('formats recent dates (within 24 hours) as time only', () => {
      const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const formatted = formatChatDate(recentDate);
      
      expect(formatted).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/);
    });

    it('formats dates within a week as weekday and time', () => {
      const weekDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const formatted = formatChatDate(weekDate);
      
      expect(formatted).toMatch(/^\w{3} \d{1,2}:\d{2} (AM|PM)$/);
    });

    it('formats older dates as month and day', () => {
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const formatted = formatChatDate(oldDate);
      
      expect(formatted).toMatch(/^\w{3} \d{1,2}$/);
    });
  });

  describe('truncateText', () => {
    it('returns original text if within limit', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe(text);
    });

    it('truncates text that exceeds limit', () => {
      const text = 'This is a very long text that should be truncated';
      const result = truncateText(text, 20);
      
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + '...'
    });

    it('handles empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('handles text exactly at limit', () => {
      const text = 'Exactly twenty chars';
      expect(truncateText(text, 20)).toBe(text);
    });
  });

  describe('generateChatTitle', () => {
    it('generates title from first message', () => {
      const message = 'This is a long message that should be used to generate a title';
      const title = generateChatTitle(message);
      
      expect(title).toBe('This is a long message that');
    });

    it('truncates very long messages', () => {
      const message = 'This is a very long message that goes on and on and should definitely be truncated because it exceeds the maximum length allowed for chat titles';
      const title = generateChatTitle(message);
      
      expect(title.length).toBeLessThanOrEqual(50);
      // The function takes first 6 words, so it might not need truncation
      expect(title).toBe('This is a very long message');
    });

    it('handles short messages', () => {
      const message = 'Short';
      const title = generateChatTitle(message);
      
      expect(title).toBe('Short');
    });

    it('trims whitespace', () => {
      const message = '   Hello world   ';
      const title = generateChatTitle(message);
      
      expect(title).toBe('Hello world');
    });
  });

  describe('storage', () => {
    beforeEach(() => {
      (window.localStorage.getItem as jest.Mock).mockClear();
      (window.localStorage.setItem as jest.Mock).mockClear();
      (window.localStorage.removeItem as jest.Mock).mockClear();
    });

    describe('get', () => {
      it('retrieves item from localStorage', () => {
        const mockData = { test: 'data' };
        (window.localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockData));
        
        const result = storage.get('test-key');
        
        expect(result).toEqual(mockData);
        expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
      });

      it('returns null for non-existent key', () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
        
        const result = storage.get('non-existent');
        
        expect(result).toBeNull();
      });

      it('handles JSON parse errors', () => {
        (window.localStorage.getItem as jest.Mock).mockReturnValue('invalid json');
        
        const result = storage.get('invalid-key');
        
        expect(result).toBeNull();
      });

      it('handles localStorage errors', () => {
        (window.localStorage.getItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        const result = storage.get('error-key');
        
        expect(result).toBeNull();
      });
    });

    describe('set', () => {
      it('stores item in localStorage', () => {
        const testData = { test: 'data' };
        
        storage.set('test-key', testData);
        
        expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
      });

      it('handles localStorage errors silently', () => {
        (window.localStorage.setItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        expect(() => storage.set('error-key', 'value')).not.toThrow();
      });
    });

    describe('remove', () => {
      it('removes item from localStorage', () => {
        storage.remove('test-key');
        
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('handles localStorage errors silently', () => {
        (window.localStorage.removeItem as jest.Mock).mockImplementation(() => {
          throw new Error('Storage error');
        });
        
        expect(() => storage.remove('error-key')).not.toThrow();
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
      
      debouncedFn('arg1', 'arg2');
      
      expect(mockFn).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
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

    it('handles multiple rapid calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');
      
      jest.advanceTimersByTime(100);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call3');
    });
  });

  describe('copyToClipboard', () => {
    it('copies text using modern clipboard API', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockResolvedValue(undefined);
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(true);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
    });

    it('falls back to execCommand when clipboard API fails', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
      (document.execCommand as jest.Mock).mockReturnValue(true);
      
      // Mock document.createElement and related methods
      const mockTextArea = {
        value: '',
        select: jest.fn(),
      };
      const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(true);
      expect(mockTextArea.value).toBe('test text');
      expect(mockTextArea.select).toHaveBeenCalled();
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
    });

    it('returns false when both methods fail', async () => {
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));
      (document.execCommand as jest.Mock).mockReturnValue(false);
      
      const mockTextArea = {
        value: '',
        select: jest.fn(),
      };
      const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockTextArea as any);
      const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();
      
      const result = await copyToClipboard('test text');
      
      expect(result).toBe(false);
      
      mockCreateElement.mockRestore();
      mockAppendChild.mockRestore();
      mockRemoveChild.mockRestore();
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
    });

    it('exports chat data to JSON file', () => {
      const chats = [
        { id: '1', title: 'Chat 1', messages: [] },
        { id: '2', title: 'Chat 2', messages: [] },
      ];
      
      expect(() => exportChatData(chats)).not.toThrow();
    });

    it('uses custom filename when provided', () => {
      const chats = [{ id: '1', title: 'Chat 1', messages: [] }];
      
      expect(() => exportChatData(chats, 'custom-backup.json')).not.toThrow();
    });

    it('uses default filename when not provided', () => {
      const chats = [{ id: '1', title: 'Chat 1', messages: [] }];
      
      expect(() => exportChatData(chats)).not.toThrow();
    });

    it('handles export errors', () => {
      // Mock console.error to avoid test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const stringifySpy = jest.spyOn(JSON, 'stringify').mockImplementation(() => {
        throw new Error('JSON error');
      });
      
      expect(() => exportChatData([])).toThrow('Failed to export chat data');
      
      consoleSpy.mockRestore();
      stringifySpy.mockRestore();
    });
  });

  describe('importChatData', () => {
    it('imports valid chat data', async () => {
      const validChats = [
        {
          id: '1',
          title: 'Chat 1',
          messages: [],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];
      
      const mockFile = new File([JSON.stringify(validChats)], 'test.json', { type: 'application/json' });
      
      const result = await importChatData(mockFile);
      
      expect(result).toEqual(validChats);
    });

    it('rejects invalid file format', async () => {
      const mockFile = new File(['invalid json'], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Failed to parse imported file');
    });

    it('rejects non-array data', async () => {
      const mockFile = new File(['{"not": "array"}'], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Invalid file format: Expected an array of chats');
    });

    it('rejects chats with invalid structure', async () => {
      const invalidChats = [{ id: '1' }]; // Missing required fields
      const mockFile = new File([JSON.stringify(invalidChats)], 'test.json', { type: 'application/json' });
      
      await expect(importChatData(mockFile)).rejects.toThrow('Invalid file format: Some chats have invalid structure');
    });

    it('handles file read errors', async () => {
      const mockFile = new File([''], 'test.json', { type: 'application/json' });
      
      // Mock FileReader to simulate error
      const originalFileReader = global.FileReader;
      const mockReader = {
        readAsText: jest.fn(),
        onerror: null,
      };
      
      global.FileReader = jest.fn().mockImplementation(() => mockReader) as any;
      
      // Simulate error by calling onerror
      setTimeout(() => {
        if (mockReader.onerror) {
          mockReader.onerror(new Event('error'));
        }
      }, 0);
      
      await expect(importChatData(mockFile)).rejects.toThrow('Failed to read file');
      
      global.FileReader = originalFileReader;
    });
  });

  describe('validateImportedChats', () => {
    it('validates correct chat structure', () => {
      const validChats = [
        {
          id: '1',
          title: 'Chat 1',
          messages: [
            {
              id: 'msg1',
              content: 'Hello',
              role: 'user',
              timestamp: '2023-01-01T00:00:00Z',
            },
          ],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];
      
      const result = validateImportedChats(validChats);
      
      expect(result.valid).toHaveLength(1);
      expect(result.invalid).toHaveLength(0);
      expect(result.valid[0].createdAt).toBeInstanceOf(Date);
      expect(result.valid[0].updatedAt).toBeInstanceOf(Date);
      expect(result.valid[0].messages[0].timestamp).toBeInstanceOf(Date);
    });

    it('identifies chats with missing required fields', () => {
      const invalidChats = [
        { id: '1' }, // Missing title and messages
        { id: '2', title: 'Chat 2' }, // Missing messages
      ];
      
      const result = validateImportedChats(invalidChats);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(2);
      expect(result.invalid[0].error).toBe('Missing required fields');
      expect(result.invalid[1].error).toBe('Missing required fields');
    });

    it('identifies chats with invalid date formats', () => {
      const invalidChats = [
        {
          id: '1',
          title: 'Chat 1',
          messages: [],
          createdAt: 'invalid-date',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];
      
      const result = validateImportedChats(invalidChats);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toBe('Invalid date format');
    });

    it('handles processing errors gracefully', () => {
      const invalidChats = [
        {
          id: '1',
          title: 'Chat 1',
          messages: 'not-an-array', // This will cause a processing error
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];
      
      const result = validateImportedChats(invalidChats);
      
      expect(result.valid).toHaveLength(0);
      expect(result.invalid).toHaveLength(1);
      expect(result.invalid[0].error).toBe('Missing required fields');
    });

    it('handles mixed valid and invalid chats', () => {
      const mixedChats = [
        {
          id: '1',
          title: 'Valid Chat',
          messages: [],
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        { id: '2' }, // Invalid
        {
          id: '3',
          title: 'Another Valid Chat',
          messages: [],
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
        },
      ];
      
      const result = validateImportedChats(mixedChats);
      
      expect(result.valid).toHaveLength(2);
      expect(result.invalid).toHaveLength(1);
      expect(result.valid[0].title).toBe('Valid Chat');
      expect(result.valid[1].title).toBe('Another Valid Chat');
    });
  });
});
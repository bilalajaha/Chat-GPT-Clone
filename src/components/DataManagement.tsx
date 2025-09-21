'use client';

import { useState, useRef } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';
import { useChatState } from '@/hooks/useChatState';

interface DataManagementProps {
  onClose: () => void;
}

export default function DataManagement({ onClose }: DataManagementProps) {
  const { state } = useAppState();
  const { chats } = useChatState();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    valid: any[];
    invalid: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      // TODO: Implement export functionality
      console.log('Export functionality not yet implemented');
      setError(null);
    } catch (err) {
      setError('Failed to export chat data. Please try again.');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // TODO: Implement import functionality
      const result = { valid: [], invalid: [] };
      setImportResult(result);
      
      if (result.valid.length > 0) {
        // Clear the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import chat data');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Data Management
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Export Chat Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download all your chat conversations as a JSON file for backup or migration.
            </p>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {chats.length} chat{chats.length !== 1 ? 's' : ''} available
              </div>
              <button
                onClick={handleExport}
                disabled={chats.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Import Chat Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Import chat conversations from a previously exported JSON file.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            
            <button
              onClick={handleFileSelect}
              disabled={isImporting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Select File to Import'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-2">
              {importResult.valid.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-700 dark:text-green-400">
                    Successfully imported {importResult.valid.length} chat{importResult.valid.length !== 1 ? 's' : ''}.
                  </div>
                </div>
              )}
              
              {importResult.invalid.length > 0 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    {importResult.invalid.length} chat{importResult.invalid.length !== 1 ? 's' : ''} could not be imported due to invalid format.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <strong>Note:</strong> Imported chats will be added to your existing conversations. 
            Duplicate chats (same ID) will be skipped. Make sure to export your current data before importing if you want to keep it.
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

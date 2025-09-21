'use client';

import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Eye, EyeOff, Key, Cpu, Palette, Globe, Volume2, VolumeX } from 'lucide-react';
import { useAppState } from '@/hooks/useAppState';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const { 
    state, 
    toggleTheme 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'api' | 'preferences' | 'appearance'>('api');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    apiKey: '',
    selectedModel: 'gemini-pro',
    temperature: 0.7,
    maxTokens: 1000,
    enableStreaming: true,
    autoSave: true,
    theme: 'light',
    soundEnabled: true,
    animationsEnabled: true,
    defaultModel: 'gemini-pro',
    language: 'en',
  });

  // Track changes
  useEffect(() => {
    // TODO: Implement proper change tracking
    setHasChanges(false);
  }, [formData]);

  const handleSave = () => {
    // Update settings
    // TODO: Implement updateSettings
    console.log('updateSettings not implemented:', {
      apiKey: formData.apiKey,
      selectedModel: formData.selectedModel,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      enableStreaming: formData.enableStreaming,
      autoSave: formData.autoSave,
    });

    // Update preferences
    // TODO: Implement updatePreferences
    console.log('updatePreferences not implemented:', {
      theme: formData.theme,
      soundEnabled: formData.soundEnabled,
      animationsEnabled: formData.animationsEnabled,
      defaultModel: formData.defaultModel,
      language: formData.language,
    });

    // Apply theme immediately
    if (formData.theme !== state.theme) {
      // TODO: Implement setTheme
      console.log('setTheme not implemented:', formData.theme);
    }

    setHasChanges(false);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      // TODO: Implement resetSettings and resetPreferences
      console.log('resetSettings and resetPreferences not implemented');
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { id: 'api', label: 'API & Model', icon: Key },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* API & Model Settings */}
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      API Configuration
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={formData.apiKey}
                            onChange={(e) => handleInputChange('apiKey', e.target.value)}
                            placeholder="Enter your API key"
                            className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                          >
                            {showApiKey ? (
                              <EyeOff className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Your API key is stored locally and never shared
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Model
                        </label>
                        <select
                          value={formData.selectedModel}
                          onChange={(e) => handleInputChange('selectedModel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="gemini-pro">Gemini Pro</option>
                          <option value="gemini-pro-vision">Gemini Pro Vision</option>
                          <option value="gemini-ultra">Gemini Ultra</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Temperature: {formData.temperature}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.temperature}
                          onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>More focused</span>
                          <span>More creative</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Tokens
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="4000"
                          value={formData.maxTokens}
                          onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.enableStreaming}
                            onChange={(e) => handleInputChange('enableStreaming', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Enable streaming responses
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.autoSave}
                            onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Auto-save conversations
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      General Preferences
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Language
                        </label>
                        <select
                          value={formData.language}
                          onChange={(e) => handleInputChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Default Model
                        </label>
                        <select
                          value={formData.defaultModel}
                          onChange={(e) => handleInputChange('defaultModel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="gemini-pro">Gemini Pro</option>
                          <option value="gemini-pro-vision">Gemini Pro Vision</option>
                          <option value="gemini-ultra">Gemini Ultra</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.soundEnabled}
                            onChange={(e) => handleInputChange('soundEnabled', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Enable sound notifications
                          </span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.animationsEnabled}
                            onChange={(e) => handleInputChange('animationsEnabled', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Enable animations and transitions
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Appearance Settings
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Theme
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'light', label: 'Light', icon: '☀️' },
                            { value: 'dark', label: 'Dark', icon: '🌙' },
                            { value: 'auto', label: 'Auto', icon: '🔄' },
                          ].map((theme) => (
                            <button
                              key={theme.value}
                              onClick={() => handleInputChange('theme', theme.value)}
                              className={`p-3 border rounded-lg text-center transition-colors ${
                                formData.theme === theme.value
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="text-2xl mb-1">{theme.icon}</div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {theme.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                          Preview
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          This is how your interface will look with the selected theme.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { apiClient } from './api';
import { storage } from '@/utils';

export interface MigrationData {
  chats: any[];
  preferences: any;
  settings: any;
  ui?: any;
}

export interface MigrationResult {
  success: boolean;
  migrated: {
    chats: number;
    preferences: boolean;
    settings: boolean;
  };
  errors: string[];
}

class DataMigrationService {
  private isMigrating = false;
  private migrationComplete = false;

  /**
   * Check if migration has been completed
   */
  isMigrationComplete(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('migration_complete') === 'true' || this.migrationComplete;
  }

  /**
   * Mark migration as complete
   */
  markMigrationComplete(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('migration_complete', 'true');
    this.migrationComplete = true;
  }

  /**
   * Get data from localStorage
   */
  getLocalStorageData(): MigrationData {
    return {
      chats: storage.get('chats') || [],
      preferences: storage.get('preferences') || {},
      settings: storage.get('settings') || {},
      ui: storage.get('ui') || {},
    };
  }

  /**
   * Transform frontend chat data to backend format
   */
  transformChatData(frontendChats: any[]): any[] {
    return frontendChats.map(chat => ({
      title: chat.title || 'Untitled Chat',
      description: null,
      settings: {
        model: chat.settings?.selectedModel || 'gemini-pro',
        temperature: chat.settings?.temperature || 0.7,
        max_tokens: chat.settings?.maxTokens || 1000,
        enable_streaming: chat.settings?.enableStreaming || true,
      },
      messages: chat.messages?.map((msg: any) => ({
        content: msg.content,
        role: msg.role,
        metadata: {
          timestamp: msg.timestamp,
          is_streaming: msg.isStreaming || false,
        },
      })) || [],
    }));
  }

  /**
   * Transform frontend preferences to backend format
   */
  transformPreferencesData(frontendPreferences: any): any {
    return {
      theme: frontendPreferences.theme || 'light',
      language: 'en',
      default_model: frontendPreferences.defaultModel || 'gemini-pro',
      temperature: frontendPreferences.temperature || 0.7,
      max_tokens: frontendPreferences.maxTokens || 1000,
      auto_save: frontendPreferences.autoSave !== false,
      notifications: true,
      api_settings: {
        gemini_api_key: frontendPreferences.apiKey || null,
        openai_api_key: null,
        anthropic_api_key: null,
      },
    };
  }

  /**
   * Transform frontend settings to backend format
   */
  transformSettingsData(frontendSettings: any): any {
    return {
      selected_model: frontendSettings.selectedModel || 'gemini-pro',
      temperature: frontendSettings.temperature || 0.7,
      max_tokens: frontendSettings.maxTokens || 1000,
      enable_streaming: frontendSettings.enableStreaming !== false,
      auto_save: frontendSettings.autoSave !== false,
      api_key: frontendSettings.apiKey || null,
    };
  }

  /**
   * Migrate data from localStorage to backend
   */
  async migrateToBackend(): Promise<MigrationResult> {
    if (this.isMigrating || this.isMigrationComplete()) {
      return {
        success: true,
        migrated: { chats: 0, preferences: false, settings: false },
        errors: [],
      };
    }

    this.isMigrating = true;
    const errors: string[] = [];
    let migratedChats = 0;
    let migratedPreferences = false;
    let migratedSettings = false;

    try {
      // Get localStorage data
      const localData = this.getLocalStorageData();

      // Migrate chats
      if (localData.chats.length > 0) {
        try {
          const transformedChats = this.transformChatData(localData.chats);
          
          for (const chatData of transformedChats) {
            try {
              const createdChat = await apiClient.createChat({
                title: chatData.title,
                // description: chatData.description, // Not supported in current API
                // settings: chatData.settings, // Not supported in current API
              });

              // Create messages for the chat
              if (createdChat.success && createdChat.data) {
                const chatId = (createdChat.data as any).id;
                for (const messageData of chatData.messages) {
                  await apiClient.createMessage(chatId, {
                    content: messageData.content,
                    role: messageData.role,
                    // metadata: messageData.metadata, // Not supported in current API
                  });
                }
              }

              migratedChats++;
            } catch (error) {
              errors.push(`Failed to migrate chat "${chatData.title}": ${error}`);
            }
          }
        } catch (error) {
          errors.push(`Failed to migrate chats: ${error}`);
        }
      }

      // Migrate preferences
      if (Object.keys(localData.preferences).length > 0) {
        try {
          const transformedPreferences = this.transformPreferencesData(localData.preferences);
          await apiClient.updateUserPreferences(transformedPreferences);
          migratedPreferences = true;
        } catch (error) {
          errors.push(`Failed to migrate preferences: ${error}`);
        }
      }

      // Migrate settings (store in preferences)
      if (Object.keys(localData.settings).length > 0) {
        try {
          const transformedSettings = this.transformSettingsData(localData.settings);
          await apiClient.updateUserPreferences({
            default_model: transformedSettings.selected_model,
            temperature: transformedSettings.temperature,
            max_tokens: transformedSettings.max_tokens,
            auto_save: transformedSettings.auto_save,
            api_settings: {
              gemini_api_key: transformedSettings.api_key,
            },
          });
          migratedSettings = true;
        } catch (error) {
          errors.push(`Failed to migrate settings: ${error}`);
        }
      }

      // Mark migration as complete if successful
      if (errors.length === 0) {
        this.markMigrationComplete();
      }

      return {
        success: errors.length === 0,
        migrated: {
          chats: migratedChats,
          preferences: migratedPreferences,
          settings: migratedSettings,
        },
        errors,
      };

    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return {
        success: false,
        migrated: {
          chats: migratedChats,
          preferences: migratedPreferences,
          settings: migratedSettings,
        },
        errors,
      };
    } finally {
      this.isMigrating = false;
    }
  }

  /**
   * Clear localStorage data after successful migration
   */
  clearLocalStorageData(): void {
    if (typeof window === 'undefined') return;
    
    const keysToKeep = ['migration_complete', 'auth_token'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Export data from backend
   */
  async exportFromBackend(): Promise<any> {
    try {
      const [chats, preferences] = await Promise.all([
        apiClient.getChats(1), // Get first page of chats
        apiClient.getUserPreferences(),
        // apiClient.getUserStatistics(), // Not implemented in current API
      ]);

      return {
        chats: chats.data,
        preferences,
        // statistics, // Not available
        export_date: new Date().toISOString(),
        version: '1.0',
      };
    } catch (error) {
      throw new Error(`Export failed: ${error}`);
    }
  }

  /**
   * Import data to backend
   */
  async importToBackend(data: any): Promise<MigrationResult> {
    const errors: string[] = [];
    let importedChats = 0;
    let importedPreferences = false;

    try {
      // Import chats
      if (data.chats && Array.isArray(data.chats)) {
        for (const chatData of data.chats) {
          try {
            const createdChat = await apiClient.createChat({
              title: chatData.title,
              // description: chatData.description, // Not supported in current API
              // settings: chatData.settings, // Not supported in current API
            });

            // Import messages
            if (chatData.messages && Array.isArray(chatData.messages)) {
              for (const messageData of chatData.messages) {
                if (createdChat.success && createdChat.data) {
                  const chatId = (createdChat.data as any).id;
                  await apiClient.createMessage(chatId, {
                    content: messageData.content,
                    role: messageData.role,
                    // metadata: messageData.metadata, // Not supported in current API
                  });
                }
              }
            }

            importedChats++;
          } catch (error) {
            errors.push(`Failed to import chat "${chatData.title}": ${error}`);
          }
        }
      }

      // Import preferences
      if (data.preferences) {
        try {
          await apiClient.updateUserPreferences(data.preferences);
          importedPreferences = true;
        } catch (error) {
          errors.push(`Failed to import preferences: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        migrated: {
          chats: importedChats,
          preferences: importedPreferences,
          settings: false,
        },
        errors,
      };

    } catch (error) {
      errors.push(`Import failed: ${error}`);
      return {
        success: false,
        migrated: {
          chats: importedChats,
          preferences: importedPreferences,
          settings: false,
        },
        errors,
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication(): Promise<boolean> {
    try {
      // TODO: Implement getCurrentUser in API client
      // await apiClient.getCurrentUser();
      return true; // Simplified for now
    } catch (error) {
      return false;
    }
  }

  /**
   * Get migration status
   */
  getMigrationStatus(): {
    isComplete: boolean;
    isMigrating: boolean;
    hasLocalData: boolean;
  } {
    const localData = this.getLocalStorageData();
    return {
      isComplete: this.isMigrationComplete(),
      isMigrating: this.isMigrating,
      hasLocalData: localData.chats.length > 0 || 
                   Object.keys(localData.preferences).length > 0 ||
                   Object.keys(localData.settings).length > 0,
    };
  }
}

// Export singleton instance
export const migrationService = new DataMigrationService();

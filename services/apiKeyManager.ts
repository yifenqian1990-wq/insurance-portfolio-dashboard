
import { SavedKey } from '../types';

const STORAGE_KEY = 'insurance_saved_api_keys';
const DEPLETED_KEYS_SESSION = new Set<string>();

export const apiKeyManager = {
  getSavedKeys(): SavedKey[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load API keys', e);
      return [];
    }
  },

  saveKeys(keys: SavedKey[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  },

  setAllKeys(keys: SavedKey[]) {
    this.saveKeys(keys);
  },

  addKey(name: string, key: string) {
    const keys = this.getSavedKeys();
    keys.push({ name, key, addedAt: Date.now() });
    this.saveKeys(keys);
  },

  updateKey(index: number, name: string, key: string) {
    const keys = this.getSavedKeys();
    if (keys[index]) {
      keys[index] = { ...keys[index], name, key };
      this.saveKeys(keys);
    }
  },

  removeKey(index: number) {
    const keys = this.getSavedKeys();
    keys.splice(index, 1);
    this.saveKeys(keys);
  },

  /**
   * Returns the first available key that hasn't been marked as depleted in this session.
   * Fallback to process.env.API_KEY if no saved keys or all are depleted.
   */
  getApiKey(): string {
    const keys = this.getSavedKeys();
    const available = keys.find(k => !DEPLETED_KEYS_SESSION.has(k.key));
    
    if (available) {
      return available.key;
    }
    
    // If all saved keys are depleted or none exist, use the environment key
    return process.env.API_KEY || '';
  },

  /**
   * Mark a key as depleted (quota exceeded) for the current session.
   */
  markAsDepleted(key: string) {
    if (key) {
      DEPLETED_KEYS_SESSION.add(key);
      console.warn('API Key marked as depleted for this session:', key.substring(0, 8) + '...');
    }
  },

  isDepleted(key: string): boolean {
    return DEPLETED_KEYS_SESSION.has(key);
  },

  resetDepleted() {
    DEPLETED_KEYS_SESSION.clear();
  }
};

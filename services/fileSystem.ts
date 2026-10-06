
/**
 * Service to handle File System Access API operations.
 * Allows the app to read/write directly to a local file selected by the user.
 */

import { Policy, Note, AuditLogEntry, SavedKey } from "../types";

export interface AppData {
    policies: Policy[];
    notes: Note[];
    logs?: AuditLogEntry[]; // Added logs persistence
    apiKeys?: SavedKey[]; // Added API keys persistence
    history: any[];
    timestamp: string;
    version: string;
}

// --- IndexedDB Helpers for Persisting Handles ---
const DB_NAME = 'InsuranceDB';
const STORE_NAME = 'file_handles';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const storeFileHandle = async (handle: FileSystemFileHandle) => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(handle, 'active_handle');
        return new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Failed to store file handle", e);
    }
};

export const getStoredFileHandle = async (): Promise<FileSystemFileHandle | undefined> => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('active_handle');
        return new Promise((resolve) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(undefined);
        });
    } catch (e) {
        return undefined;
    }
};

export const removeStoredFileHandle = async () => {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('active_handle');
    } catch (e) {
        console.error("Failed to remove file handle", e);
    }
};

// --- Standard File System API ---

// Check if the API is supported
export const isFileSystemSupported = () => {
    return 'showOpenFilePicker' in window;
};

// Open a file handler
export const openFileHandle = async (): Promise<FileSystemFileHandle> => {
    const [handle] = await (window as any).showOpenFilePicker({
        types: [
            {
                description: 'JSON Database File',
                accept: {
                    'application/json': ['.json']
                }
            }
        ],
        multiple: false
    });
    return handle;
};

// Create a new file handler
export const saveFileHandle = async (): Promise<FileSystemFileHandle> => {
    const handle = await (window as any).showSaveFilePicker({
        types: [
            {
                description: 'JSON Database File',
                accept: {
                    'application/json': ['.json']
                }
            }
        ],
        suggestedName: `insurance_db_${new Date().toISOString().slice(0, 10)}.json`
    });
    return handle;
};

// Read data from the handle
export const readFromFile = async (handle: FileSystemFileHandle): Promise<AppData> => {
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
};

// Write data to the handle
export const writeToFile = async (handle: FileSystemFileHandle, data: AppData): Promise<void> => {
    // Create a writable stream
    const writable = await (handle as any).createWritable();
    // Write the data
    await writable.write(JSON.stringify(data, null, 2));
    // Close the file
    await writable.close();
};

// Verify permissions (needed if the handle is stored and reused)
export const verifyPermission = async (handle: FileSystemFileHandle, readWrite: boolean): Promise<boolean> => {
    const options = { mode: readWrite ? 'readwrite' : 'read' };
    
    // Check if permission was already granted
    if ((await (handle as any).queryPermission(options)) === 'granted') {
        return true;
    }
    
    // Request permission
    if ((await (handle as any).requestPermission(options)) === 'granted') {
        return true;
    }
    
    return false;
};

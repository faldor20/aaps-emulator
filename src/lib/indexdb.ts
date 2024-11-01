interface LogEntry {
    name: string;
    content: string;
}

interface LogMetadata {
    name: string;
}

class LogDatabase {
    private db: IDBDatabase | null = null;
    private dbName = 'logsDB';
    private storeName = 'logs';
    private version = 1;
    private maxLogs = 20;

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = (event) => {
                console.error("IndexedDB error:", event);
                reject(event);
            };

            request.onupgradeneeded = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    this.db.createObjectStore(this.storeName, { keyPath: 'name' });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
        });
    }

    async getAllLogNames(): Promise<LogMetadata[]> {
        if (!this.db) throw new Error('Database not initialized');
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAllKeys();

            request.onsuccess = () => {
                const names = request.result.map(name => ({ name: name as string }));
                resolve(names);
            };
            request.onerror = () => reject({error:request.error,msg:"Error getting all log names"});
        });
    }

    async getLogContent(name: string): Promise<string> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(name);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result.content);
                } else {
                    reject(new Error('Log not found'));
                }
            };
            request.onerror = () => reject({error:request.error,msg:"Error getting log content"});
        });
    }

    async addLog(log: LogEntry): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        const currentLogs = await this.getAllLogNames();
        
        if (currentLogs.length >= this.maxLogs) {
            // Remove oldest logs to maintain max limit
            const logsToRemove = currentLogs.slice(0, currentLogs.length - this.maxLogs + 1);
            await this.deleteLogs(logsToRemove.map(log => log.name));
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(log);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject({error:transaction.error,msg:"Error adding log"});
        });
    }

    async deleteLogs(names: string[]): Promise<void> {
        if (!this.db) throw new Error('Database not initialized');

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            names.forEach(name => {
                store.delete(name);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject({error:transaction.error,msg:"Error deleting logs"});
        });
    }

    async keepOnlyLatest(count: number = 5): Promise<void> {
        const logs = await this.getAllLogNames();
        if (logs.length <= count) return;

        const logsToRemove = logs.slice(0, -count);
        await this.deleteLogs(logsToRemove.map(log => log.name));
    }
}

export const logDB = new LogDatabase();
export type { LogEntry, LogMetadata };
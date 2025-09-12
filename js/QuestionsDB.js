// Simple IndexedDB wrapper for storing admin questions
class QuestionsDB {
    constructor() {
        this.dbName = 'Ta3leamFanyExamDB';
        this.storeName = 'questions';
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve(this.db);
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('by_subject', 'subject', { unique: false });
                }
            };
            req.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    _tx(mode = 'readonly') {
        const tx = this.db.transaction([this.storeName], mode);
        const store = tx.objectStore(this.storeName);
        return { tx, store };
    }

    add(question) {
        return new Promise((resolve, reject) => {
            if (!question.id) question.id = Date.now(); // unique id
            const { tx, store } = this._tx('readwrite');
            const req = store.put(question);
            req.onsuccess = () => resolve(question);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    getAll() {
        return new Promise((resolve, reject) => {
            const { tx, store } = this._tx('readonly');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    delete(id) {
        return new Promise((resolve, reject) => {
            const { tx, store } = this._tx('readwrite');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    update(question) {
        return this.add(question);
    }

    clearAll() {
        return new Promise((resolve, reject) => {
            const { tx, store } = this._tx('readwrite');
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }
}

// single exported instance
window.__QuestionsDB = new QuestionsDB();
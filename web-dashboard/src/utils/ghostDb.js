const DB_NAME = 'jarvis_ghost_db';
const DB_VERSION = 1;

export const GHOST_STORES = {
  sessions: 'ghost_sessions',
  macros: 'ghost_learned_macros',
  executionLogs: 'ghost_execution_logs',
};

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed'));
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'));
  });
}

export async function openGhostDb() {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment');
  }

  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(GHOST_STORES.sessions)) {
      db.createObjectStore(GHOST_STORES.sessions, { keyPath: 'sessionId' });
    }
    if (!db.objectStoreNames.contains(GHOST_STORES.macros)) {
      db.createObjectStore(GHOST_STORES.macros, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(GHOST_STORES.executionLogs)) {
      db.createObjectStore(GHOST_STORES.executionLogs, { keyPath: 'id' });
    }
  };

  return reqToPromise(req);
}

export async function idbGetAll(storeName) {
  const db = await openGhostDb();
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  const result = await reqToPromise(store.getAll());
  await txDone(tx);
  db.close();
  return result;
}

export async function idbPut(storeName, value) {
  const db = await openGhostDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(value);
  await txDone(tx);
  db.close();
}

export async function idbBulkPut(storeName, values) {
  const db = await openGhostDb();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const v of values) store.put(v);
  await txDone(tx);
  db.close();
}

export async function idbDelete(storeName, key) {
  const db = await openGhostDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  await txDone(tx);
  db.close();
}

export async function idbClear(storeName) {
  const db = await openGhostDb();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).clear();
  await txDone(tx);
  db.close();
}

export async function loadGhostSessions() {
  const sessions = await idbGetAll(GHOST_STORES.sessions);
  return (sessions || []).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}

export async function saveGhostSession(session) {
  await idbPut(GHOST_STORES.sessions, session);
}

export async function pruneGhostSessions(maxSessions = 100) {
  const sessions = await loadGhostSessions();
  if (sessions.length <= maxSessions) return sessions;

  const toDelete = sessions.slice(0, sessions.length - maxSessions);
  const db = await openGhostDb();
  const tx = db.transaction(GHOST_STORES.sessions, 'readwrite');
  const store = tx.objectStore(GHOST_STORES.sessions);
  for (const s of toDelete) store.delete(s.sessionId);
  await txDone(tx);
  db.close();

  return sessions.slice(-maxSessions);
}

export async function loadLearnedMacros() {
  const macros = await idbGetAll(GHOST_STORES.macros);
  return (macros || []).sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
}

export async function saveLearnedMacros(macros) {
  await idbBulkPut(GHOST_STORES.macros, macros || []);
}

export async function deleteLearnedMacro(id) {
  await idbDelete(GHOST_STORES.macros, id);
}

export async function saveExecutionLog(logEntry) {
  await idbPut(GHOST_STORES.executionLogs, logEntry);
}

export async function loadExecutionLogs(limit = 100) {
  const logs = await idbGetAll(GHOST_STORES.executionLogs);
  const sorted = (logs || []).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

export async function clearGhostLearningData() {
  await Promise.all([
    idbClear(GHOST_STORES.sessions),
    idbClear(GHOST_STORES.macros),
    idbClear(GHOST_STORES.executionLogs),
  ]);
}


import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearGhostLearningData,
  deleteLearnedMacro,
  loadExecutionLogs,
  loadLearnedMacros,
  pruneGhostSessions,
  saveExecutionLog,
  saveGhostSession,
  saveLearnedMacros,
} from '../utils/ghostDb.js';
import { detectRepeatedSequences, getMatchingMacrosForFile } from '../utils/ghostEngine.js';
import { executeSequence } from '../utils/executeSequence.js';

const STORAGE_KEYS = {
  actionLog: 'jarvis_ghost_actions',
  legacyMacros: 'jarvis_ghost_macros',
  mode: 'jarvis_ghost_mode',
  confidenceThreshold: 'jarvis_ghost_confidence_threshold',
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function toActionType(action) {
  if (!action) return null;
  return action.type || action.actionType || null;
}

function normalizeLogEntry(action) {
  const type = toActionType(action);
  const fileName = action?.fileName ?? null;
  const fileType = action?.fileType ?? null;
  const metadata = action?.metadata || {};
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    type,
    fileName,
    fileType,
    metadata,
    macro: action?.macro,
    task: action?.task,
    format: action?.format,
  };
}

function normalizeSessionAction(action) {
  const type = toActionType(action);
  if (!type) return null;
  if (type === 'OPEN_FILE') return { type: 'OPEN_FILE' };
  if (type === 'RUN_MACRO') return { type: 'RUN_MACRO', macro: action?.macro, task: action?.task };
  if (type === 'EXPORT') return { type: 'EXPORT', format: action?.format };
  if (type === 'RUN_MACRO_BUTTON') return { type: 'RUN_MACRO_BUTTON', macro: action?.metadata?.code };
  // Avoid polluting learned sequences with engine-internal events.
  if (type === 'RUN_GHOST_MACRO') return null;
  if (type === 'AUTO_EXECUTE') return null;
  return { type, ...(action?.metadata ? { metadata: action.metadata } : {}) };
}

function migrateLegacyMacros(legacy) {
  const list = Array.isArray(legacy) ? legacy : [];
  return list
    .map((m) => {
      const seq = Array.isArray(m.sequence) ? m.sequence : [];
      const fileType = seq[0]?.fileType || '';
      const fileName = seq[0]?.fileName || '';
      const actionSequence = seq.map((a) => ({
        type: a.actionType,
        macro: a.metadata?.code || a.metadata?.taskType || undefined,
        task: a.metadata?.task || undefined,
        format: a.metadata?.format || undefined,
      }));
      return {
        id: m.id || crypto.randomUUID(),
        fingerprint: m.fingerprint || `${fileType || '*'}::${actionSequence.map((a) => a.type).join('>')}::legacy`,
        fileTypePattern: fileType || '*',
        fileNamePattern: fileName || '*',
        fileNameRegex: null,
        actionSequence,
        repetitionCount: m.repetitionCount || 2,
        confidenceScore: m.confidenceScore || 60,
        lastTriggered: null,
        autoRunEnabled: !!m.enabled,
        createdAt: m.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    })
    .filter((m) => Array.isArray(m.actionSequence) && m.actionSequence.length > 0);
}

function mergeCandidatesIntoMacros(existingMacros, candidates) {
  const nowIso = new Date().toISOString();
  const byFingerprint = new Map((existingMacros || []).map((m) => [m.fingerprint, m]));
  const merged = [];

  for (const c of candidates || []) {
    const prev = byFingerprint.get(c.fingerprint);
    if (prev) {
      merged.push({
        ...prev,
        fileTypePattern: c.fileTypePattern,
        fileNamePattern: c.fileNamePattern,
        fileNameRegex: c.fileNameRegex,
        actionSequence: c.actionSequence,
        repetitionCount: c.repetitionCount,
        confidenceScore: c.confidenceScore,
        lastSeenAt: c.lastSeenAt,
        updatedAt: nowIso,
      });
      byFingerprint.delete(c.fingerprint);
    } else {
      merged.push({
        id: crypto.randomUUID(),
        fingerprint: c.fingerprint,
        fileTypePattern: c.fileTypePattern,
        fileNamePattern: c.fileNamePattern,
        fileNameRegex: c.fileNameRegex,
        actionSequence: c.actionSequence,
        repetitionCount: c.repetitionCount,
        confidenceScore: c.confidenceScore,
        lastSeenAt: c.lastSeenAt,
        lastTriggered: null,
        autoRunEnabled: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }

  // Keep any macros that weren't in this detection pass
  for (const [, remaining] of byFingerprint.entries()) merged.push(remaining);

  return merged.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
}

const GhostMacroContext = createContext(null);

export const GhostMacroProvider = ({ children }) => {
  const [actions, setActions] = useState(() => readJson(STORAGE_KEYS.actionLog, []));
  const [sessions, setSessions] = useState([]);
  const [learnedMacros, setLearnedMacros] = useState([]);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [suggestedMacro, setSuggestedMacro] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.mode);
      return raw === 'off' ? false : true;
    } catch {
      return true;
    }
  });
  const [confidenceThreshold, setConfidenceThreshold] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.confidenceThreshold);
      const n = raw ? Number(raw) : 70;
      if (!Number.isFinite(n)) return 70;
      return Math.max(0, Math.min(100, Math.round(n)));
    } catch {
      return 70;
    }
  });

  const sessionsRef = useRef([]);
  const macrosRef = useRef([]);
  const executionLogsRef = useRef([]);
  const currentSessionRef = useRef(null);
  const idleTimerRef = useRef(null);
  const executingRef = useRef(false);
  const detectDebounceRef = useRef(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  useEffect(() => {
    macrosRef.current = learnedMacros;
  }, [learnedMacros]);

  useEffect(() => {
    writeJson(STORAGE_KEYS.actionLog, (actions || []).slice(-500));
  }, [actions]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.mode, ghostModeEnabled ? 'on' : 'off');
    } catch {
      // ignore
    }
  }, [ghostModeEnabled]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.confidenceThreshold, String(confidenceThreshold));
    } catch {
      // ignore
    }
  }, [confidenceThreshold]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loadedSessions = await pruneGhostSessions(100);
        if (!cancelled) setSessions(loadedSessions);
      } catch {
        // ignore IDB failures; keep in-memory only
      }

      try {
        const loadedMacros = await loadLearnedMacros();
        if (!cancelled) setLearnedMacros(loadedMacros);
      } catch {
        // ignore
      }

      try {
        const logs = await loadExecutionLogs(200);
        if (!cancelled) {
          executionLogsRef.current = logs;
          setExecutionHistory(logs);
        }
      } catch {
        // ignore
      }

      // One-time migration from localStorage if needed
      try {
        const existing = macrosRef.current;
        if (!existing || existing.length === 0) {
          const legacy = readJson(STORAGE_KEYS.legacyMacros, []);
          const migrated = migrateLegacyMacros(legacy);
          if (migrated.length > 0) {
            if (!cancelled) setLearnedMacros(migrated);
            await saveLearnedMacros(migrated);
          }
        }
      } catch {
        // ignore
      }

      // Initial detection pass from sessions to learned macros
      try {
        const currentSessions = sessionsRef.current;
        if (currentSessions && currentSessions.length >= 2) {
          const candidates = detectRepeatedSequences(currentSessions);
          if (candidates && candidates.length) {
            const merged = mergeCandidatesIntoMacros(macrosRef.current, candidates);
            if (!cancelled) setLearnedMacros(merged);
            await saveLearnedMacros(merged);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const recomputeLearnedMacros = useCallback(async () => {
    const currentSessions = sessionsRef.current;
    if (!currentSessions || currentSessions.length < 2) return;
    const candidates = detectRepeatedSequences(currentSessions);
    if (!candidates || candidates.length === 0) return;

    const merged = mergeCandidatesIntoMacros(macrosRef.current, candidates);
    setLearnedMacros(merged);
    try {
      await saveLearnedMacros(merged);
      // Also keep a lightweight backup in localStorage for survivability
      writeJson(STORAGE_KEYS.legacyMacros, merged);
    } catch {
      // ignore
    }
  }, []);

  const finalizeSession = useCallback(async (reason) => {
    const session = currentSessionRef.current;
    if (!session || !Array.isArray(session.actions) || session.actions.length === 0) return;

    currentSessionRef.current = null;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;

    const endedAt = session.lastActionAt || Date.now();
    const stored = {
      sessionId: session.sessionId,
      fileName: session.fileName,
      fileType: session.fileType,
      actions: session.actions,
      timestamp: session.timestamp,
      endedAt,
      endReason: reason || null,
    };

    try {
      await saveGhostSession(stored);
      const pruned = await pruneGhostSessions(100);
      setSessions(pruned);
    } catch {
      // In-memory fallback
      const next = [...sessionsRef.current, stored].slice(-100);
      setSessions(next);
    }

    // Detection is run only after session ends (debounced)
    if (detectDebounceRef.current) clearTimeout(detectDebounceRef.current);
    detectDebounceRef.current = setTimeout(() => {
      void recomputeLearnedMacros();
    }, 250);
  }, [recomputeLearnedMacros]);

  const scheduleIdleFinalize = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      void finalizeSession('idle_timeout');
    }, 2 * 60 * 1000);
  }, [finalizeSession]);

  const startNewSession = useCallback(({ fileName, fileType }) => {
    const now = Date.now();
    currentSessionRef.current = {
      sessionId: crypto.randomUUID(),
      fileName,
      fileType,
      actions: [{ type: 'OPEN_FILE' }],
      timestamp: now,
      lastActionAt: now,
    };
    scheduleIdleFinalize();
  }, [scheduleIdleFinalize]);

  const recordSessionAction = useCallback((action, { fileName, fileType } = {}) => {
    const type = toActionType(action);
    if (!type) return;

    if (type === 'OPEN_FILE') {
      const name = fileName || action?.fileName || '';
      const fType = fileType || action?.fileType || '';
      if (!name) return;

      const current = currentSessionRef.current;
      if (current && current.fileName && current.fileName !== name) {
        void finalizeSession('file_changed');
      }
      if (!currentSessionRef.current) {
        startNewSession({ fileName: name, fileType: fType });
      } else {
        // Same file re-open: update type and keep session alive
        currentSessionRef.current.fileType = fType || currentSessionRef.current.fileType;
        currentSessionRef.current.lastActionAt = Date.now();
        scheduleIdleFinalize();
      }
      return;
    }

    const current = currentSessionRef.current;
    if (!current) return;

    const sessionAction = normalizeSessionAction(action);
    if (!sessionAction) return;
    current.actions.push(sessionAction);
    current.lastActionAt = Date.now();
    scheduleIdleFinalize();
  }, [finalizeSession, scheduleIdleFinalize, startNewSession]);

  const logAction = useCallback((action) => {
    const entry = normalizeLogEntry(action);
    setActions((prev) => [...(prev || []), entry].slice(-500));

    recordSessionAction(
      { ...action, type: entry.type },
      { fileName: entry.fileName || undefined, fileType: entry.fileType || undefined },
    );

    return entry;
  }, [recordSessionAction]);

  const removeMacro = useCallback(async (id) => {
    setLearnedMacros((prev) => (prev || []).filter((m) => m.id !== id));
    try {
      await deleteLearnedMacro(id);
    } catch {
      // ignore
    }
  }, []);

  const toggleMacroEnabled = useCallback(async (id) => {
    const next = (macrosRef.current || []).map((m) =>
      m.id === id ? { ...m, autoRunEnabled: !m.autoRunEnabled, updatedAt: new Date().toISOString() } : m,
    );
    setLearnedMacros(next);
    try {
      await saveLearnedMacros(next);
    } catch {
      // ignore
    }
  }, []);

  const onFileOpened = useCallback((file) => {
    if (!file) return;
    logAction({
      type: 'OPEN_FILE',
      fileName: file.name,
      fileType: file.type || '',
      metadata: {},
    });
  }, [logAction]);

  const evaluateFileForGhost = useCallback(async (file, handlers) => {
    if (!file) return;
    if (executingRef.current) return;

    const matches = getMatchingMacrosForFile(macrosRef.current, file, { minConfidence: confidenceThreshold });
    const best = matches[0] || null;

    if (!best) {
      setSuggestedMacro(null);
      return;
    }

    const shouldAutoRun =
      ghostModeEnabled &&
      best.autoRunEnabled &&
      (best.confidenceScore || 0) >= confidenceThreshold;
    setSuggestedMacro(shouldAutoRun ? null : best);

    if (!shouldAutoRun) return;

    executingRef.current = true;
    setIsExecuting(true);

    const logBase = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      macroId: best.id,
      fileName: file.name || '',
      fileType: file.type || '',
    };

    try {
      logAction({
        type: 'AUTO_EXECUTE',
        fileName: file.name,
        fileType: file.type || '',
        metadata: { macroId: best.id },
      });

      await executeSequence(best.actionSequence, handlers, {});

      const updatedMacros = (macrosRef.current || []).map((m) =>
        m.id === best.id ? { ...m, lastTriggered: Date.now(), updatedAt: new Date().toISOString() } : m,
      );
      setLearnedMacros(updatedMacros);
      try {
        await saveLearnedMacros(updatedMacros);
      } catch {
        // ignore
      }

      try {
        const endTs = Date.now();
        const durationMs = endTs - (logBase.timestamp || endTs);
        const actionsExecuted = (best.actionSequence || []).map((a) => a.type);
        const logEntry = {
          ...logBase,
          status: 'success',
          durationMs,
          actionsExecuted,
        };
        const nextLogs = [logEntry, ...(executionLogsRef.current || [])].slice(0, 200);
        executionLogsRef.current = nextLogs;
        setExecutionHistory(nextLogs);
        await saveExecutionLog(logEntry);
      } catch {
        // ignore
      }
    } catch (err) {
      try {
        const endTs = Date.now();
        const durationMs = endTs - (logBase.timestamp || endTs);
        const logEntry = {
          ...logBase,
          status: 'error',
          durationMs,
          error: String(err?.message || err),
        };
        const nextLogs = [logEntry, ...(executionLogsRef.current || [])].slice(0, 200);
        executionLogsRef.current = nextLogs;
        setExecutionHistory(nextLogs);
        await saveExecutionLog(logEntry);
      } catch {
        // ignore
      }
      throw err;
    } finally {
      executingRef.current = false;
      setIsExecuting(false);
    }
  }, [confidenceThreshold, ghostModeEnabled, logAction]);

  const clearLearningHistory = useCallback(async () => {
    // Reset in-memory / UI state
    setSessions([]);
    setLearnedMacros([]);
    setExecutionHistory([]);
    executionLogsRef.current = [];
    sessionsRef.current = [];
    macrosRef.current = [];
    currentSessionRef.current = null;

    // Clear persisted stores
    try {
      await clearGhostLearningData();
    } catch {
      // ignore
    }

    // Clear legacy backup
    try {
      window.localStorage.removeItem(STORAGE_KEYS.legacyMacros);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      actions,
      sessions,
      learnedMacros,
      executionHistory,
      suggestedMacro,
      isExecuting,
      ghostModeEnabled,
      setGhostModeEnabled,
      confidenceThreshold,
      setConfidenceThreshold,
      logAction,
      onFileOpened,
      evaluateFileForGhost,
      removeMacro,
      toggleMacroEnabled,
      finalizeSession,
      clearLearningHistory,
      getExecutionLogs: (limit = 50) =>
        (executionLogsRef.current || [])
          .slice()
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, limit),
    }),
    [
      actions,
      sessions,
      learnedMacros,
      executionHistory,
      suggestedMacro,
      isExecuting,
      ghostModeEnabled,
      confidenceThreshold,
      logAction,
      onFileOpened,
      evaluateFileForGhost,
      removeMacro,
      toggleMacroEnabled,
      finalizeSession,
      clearLearningHistory,
    ],
  );

  return <GhostMacroContext.Provider value={value}>{children}</GhostMacroContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGhostMacro = () => {
  const ctx = useContext(GhostMacroContext);
  if (!ctx) throw new Error('useGhostMacro must be used within GhostMacroProvider');
  return ctx;
};


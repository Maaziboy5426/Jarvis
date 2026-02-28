import { useMemo } from 'react';
import { useApp } from '../state/AppContext.jsx';
import { useGhostMacro } from '../state/GhostMacroContext.jsx';

const AVG_STEP_TIME_SECONDS = 4;

function safeDate(value: unknown): Date | null {
  if (!value) return null;
  try {
    const d = new Date(value as any);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function getFileExtension(fileName?: string | null): string | null {
  if (!fileName) return null;
  const idx = fileName.lastIndexOf('.');
  if (idx === -1 || idx === fileName.length - 1) return null;
  return fileName.slice(idx + 1).toLowerCase();
}

function formatTimeSaved(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '0m saved';
  const minutesTotal = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutesTotal / 60);
  const minutes = minutesTotal % 60;
  if (hours <= 0) return `${minutes}m saved`;
  return `${hours}h ${minutes}m saved`;
}

export function useDashboardAnalytics() {
  const { history, macros } = useApp();
  const ghost = useGhostMacro();

  const macroExecutionLogs = useMemo(() => {
    // Prefer dedicated getter so we always read from the real ghost engine store.
    try {
      if (ghost.getExecutionLogs) {
        return ghost.getExecutionLogs(200) || [];
      }
    } catch {
      // fall back to in‑memory executionHistory only if getter is unavailable
    }
    return ghost.executionHistory || [];
  }, [ghost]);

  const processedFilesStore = history || [];
  const macroDefinitionsStore = macros || [];
  const ghostLearningStore = ghost.learnedMacros || [];

  const liveActivity = useMemo(() => {
    return (macroExecutionLogs || [])
      .slice()
      .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10);
  }, [macroExecutionLogs]);

  const usageStats = useMemo(() => {
    const filesProcessed = processedFilesStore.length || 0;
    const macrosCreated = macroDefinitionsStore.length || 0;
    const activeAutomations = (ghostLearningStore || []).filter((m: any) => m.autoRunEnabled).length;

    let totalSeconds = 0;
    (macroExecutionLogs || []).forEach((log: any) => {
      let estimatedSteps = 0;
      if (Array.isArray(log.actionsExecuted) && log.actionsExecuted.length > 0) {
        estimatedSteps = log.actionsExecuted.length;
      } else if (log.macroId) {
        const m = (ghostLearningStore || []).find((x: any) => x.id === log.macroId);
        if (m && Array.isArray(m.actionSequence)) {
          estimatedSteps = m.actionSequence.length;
        }
      }
      if (!Number.isFinite(estimatedSteps) || estimatedSteps < 0) {
        estimatedSteps = 0;
      }
      totalSeconds += estimatedSteps * AVG_STEP_TIME_SECONDS;
    });

    return {
      filesProcessed,
      macrosCreated,
      activeAutomations,
      totalTimeSavedSeconds: totalSeconds,
      formattedTimeSaved: formatTimeSaved(totalSeconds),
    };
  }, [processedFilesStore, macroDefinitionsStore, ghostLearningStore, macroExecutionLogs]);

  const recentFiles = useMemo(() => {
    return (processedFilesStore || [])
      .slice()
      .sort((a: any, b: any) => {
        const da = safeDate(a.createdAt);
        const db = safeDate(b.createdAt);
        return (db?.getTime() || 0) - (da?.getTime() || 0);
      })
      .slice(0, 5);
  }, [processedFilesStore]);

  const aiInsights = useMemo(() => {
    // 1. Most processed file type (by extension)
    const extCounts = new Map<string, number>();
    (processedFilesStore || []).forEach((item: any) => {
      const ext =
        getFileExtension(item.fileName) ||
        getFileExtension(item.metadata?.name) ||
        (typeof item.fileType === 'string' ? item.fileType.toLowerCase() : null);
      if (!ext) return;
      extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
    });
    let mostProcessedFileType: { label: string; count: number } | null = null;
    for (const [ext, count] of extCounts.entries()) {
      if (!mostProcessedFileType || count > mostProcessedFileType.count) {
        mostProcessedFileType = { label: ext, count };
      }
    }

    // 2. Most used macro (by macroId in execution logs)
    const macroCounts = new Map<string, number>();
    (macroExecutionLogs || []).forEach((log: any) => {
      const id = log.macroId || log.metadata?.macroId || null;
      if (!id) return;
      macroCounts.set(id, (macroCounts.get(id) || 0) + 1);
    });
    let mostUsedMacro: { id: string; count: number } | null = null;
    for (const [id, count] of macroCounts.entries()) {
      if (!mostUsedMacro || count > mostUsedMacro.count) {
        mostUsedMacro = { id, count };
      }
    }

    // 3. Simple pattern detection: repeated file name patterns (>=2)
    const patternCounts = new Map<string, { count: number; sampleName: string }>();
    (processedFilesStore || []).forEach((item: any) => {
      const name = item.fileName || item.metadata?.name || '';
      if (!name) return;
      const key = name.toLowerCase();
      const existing = patternCounts.get(key) || { count: 0, sampleName: name };
      patternCounts.set(key, { count: existing.count + 1, sampleName: existing.sampleName });
    });
    let detectedPattern: { description: string } | null = null;
    for (const [, value] of patternCounts.entries()) {
      if (value.count >= 2) {
        detectedPattern = {
          description: `Repeated processing of “${value.sampleName}” (${value.count}×)`,
        };
        break;
      }
    }

    // 4. Ghost confidence — derived from ghostLearningStore (learned macros)
    let ghostConfidence = 0;
    if (ghostLearningStore && ghostLearningStore.length > 0) {
      const sum = ghostLearningStore.reduce(
        (acc: number, m: any) => acc + (Number.isFinite(m.confidenceScore) ? m.confidenceScore : 0),
        0,
      );
      ghostConfidence = Math.round(sum / ghostLearningStore.length);
    }

    return {
      mostProcessedFileType,
      mostUsedMacro,
      detectedPattern,
      ghostConfidence,
    };
  }, [processedFilesStore, macroExecutionLogs, ghostLearningStore]);

  const ghostEngineState = useMemo(() => {
    const learnedWorkflowsCount = ghostLearningStore.length || 0;
    const autoRunEnabledCount = (ghostLearningStore || []).filter((m: any) => m.autoRunEnabled).length;

    let lastPredictionTriggered: Date | null = null;
    (ghostLearningStore || []).forEach((m: any) => {
      const ts = safeDate(m.lastTriggered);
      if (!ts) return;
      if (!lastPredictionTriggered || ts > lastPredictionTriggered) {
        lastPredictionTriggered = ts;
      }
    });

    let avgConfidence = 0;
    if (ghostLearningStore && ghostLearningStore.length > 0) {
      const sum = ghostLearningStore.reduce(
        (acc: number, m: any) => acc + (Number.isFinite(m.confidenceScore) ? m.confidenceScore : 0),
        0,
      );
      avgConfidence = Math.round(sum / ghostLearningStore.length);
    }

    return {
      ghostModeOn: !!ghost.ghostModeEnabled,
      learnedWorkflowsCount,
      autoRunEnabledCount,
      lastPredictionTriggeredAt: lastPredictionTriggered,
      averageConfidencePercent: avgConfidence,
    };
  }, [ghostLearningStore, ghost.ghostModeEnabled]);

  return {
    macroExecutionLogs,
    processedFilesStore,
    macroDefinitionsStore,
    automationState: {
      activeCount: ghostEngineState.autoRunEnabledCount,
    },
    liveActivity,
    usageStats,
    aiInsights,
    ghostEngineState,
    recentFiles,
  };
}


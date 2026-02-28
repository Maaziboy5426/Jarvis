import React, { useMemo, useState } from 'react';
import { Ghost, Sparkles, Shield, Activity, Clock, FileText, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../state/AppContext.jsx';
import { useGhostMacro } from '../state/GhostMacroContext.jsx';

const GhostMacros = () => {
  const { history } = useApp();
  const {
    actions,
    learnedMacros,
    ghostModeEnabled,
    setGhostModeEnabled,
    removeMacro,
    toggleMacroEnabled,
  } = useGhostMacro();
  const navigate = useNavigate();
  const [orbPanelOpen, setOrbPanelOpen] = useState(true);

  const groupedByDay = useMemo(() => {
    if (!history || history.length === 0) return [];

    const byDay = {};

    history.forEach((item) => {
      const d = new Date(item.createdAt);
      const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
      if (!byDay[dayKey]) byDay[dayKey] = [];
      byDay[dayKey].push(item);
    });

    const days = Object.entries(byDay)
      .map(([day, items]) => {
        const taskCounts = {};
        const fileTypeCounts = {};

        items.forEach((item) => {
          const t = item.taskType || 'custom';
          taskCounts[t] = (taskCounts[t] || 0) + 1;

          if (item.fileType) {
            fileTypeCounts[item.fileType] = (fileTypeCounts[item.fileType] || 0) + 1;
          }
        });

        const sortedTasks = Object.entries(taskCounts).sort(([, a], [, b]) => b - a);
        const sortedFileTypes = Object.entries(fileTypeCounts).sort(([, a], [, b]) => b - a);

        const topTask = sortedTasks[0];

        let suggestedLabel = 'Run a smart macro';
        let suggestedAction = null;

        if (topTask) {
          const [taskType] = topTask;
          if (taskType === 'summarize') {
            suggestedLabel = 'Auto-summarize today’s docs';
            suggestedAction = 'summarize';
          } else if (taskType === 'rewrite') {
            suggestedLabel = 'Rewrite similar content';
            suggestedAction = 'rewrite';
          } else if (taskType === 'format') {
            suggestedLabel = 'Auto-format recurring reports';
            suggestedAction = 'format';
          } else if (taskType === 'cleanup' || taskType === 'clean-up') {
            suggestedLabel = 'Clean up noisy documents';
            suggestedAction = 'cleanup';
          }
        }

        return {
          day,
          dateLabel: new Date(day).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
          count: items.length,
          tasks: sortedTasks,
          fileTypes: sortedFileTypes,
          suggestedLabel,
          suggestedAction,
          sample: items[0],
        };
      })
      .sort((a, b) => (a.day < b.day ? 1 : -1));

    return days;
  }, [history]);

  const handleRunSuggested = (suggestedAction, sample) => {
    if (!suggestedAction) {
      navigate('/run-macro');
      return;
    }
    navigate('/run-macro', {
      state: {
        action: suggestedAction,
        fromGhost: true,
        sampleTask: sample?.task,
        sampleFileName: sample?.fileName,
      },
    });
  };

  return (
    <>
      <div className="page-container">
        <div className="section-header" style={{ marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.9rem' }}>Ghost Macros</h1>
            <p className="section-subtitle">
              View learned workflows and control Ghost Mode execution.
            </p>
          </div>
          <div className="badge accent" style={{ gap: '0.4rem' }}>
            <Ghost size={16} /> Ghost Mode
          </div>
        </div>

        {/* Repeated sequences are learned automatically; enable auto-run per macro below. */}

        <div className="card-grid-2" style={{ alignItems: 'stretch', marginBottom: '1.8rem' }}>
          {/* Passive Observation (real data) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <h3>Passive Observation</h3>
              </div>
              <span className="badge subtle">Last 5 actions</span>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>
              Every time you run a macro or open a file, Ghost records it locally and looks for repeated workflows.
            </p>
            <div className="mono-box" style={{ maxHeight: 150 }}>
              {actions.length === 0 ? (
                <p>No actions observed yet. Run a macro to begin training Ghost.</p>
              ) : (
                actions
                  .slice(-5)
                  .reverse()
                  .map((a) => (
                    <p key={a.id} style={{ fontSize: '0.86rem' }}>
                      [{new Date(a.timestamp).toLocaleTimeString()}] {a.type}
                      {a.fileName ? ` • ${a.fileName}` : ''}
                      {a.fileType ? ` (${a.fileType})` : ''}
                    </p>
                  ))
              )}
            </div>
          </div>

          {/* Context-Aware Execution (description, wired to engine) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <Shield size={16} color="var(--accent-secondary)" />
                <h3>Context-Aware Execution</h3>
              </div>
              <span className="badge success">UI Smart Detection Active</span>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              When Ghost Mode is enabled, learned macros can auto-run when a similar file and action context appear again.
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p>• Matching is based on file type and name patterns (e.g. “Weekly_Reports_*.xlsx”).</p>
              <p>• All decisions run locally; nothing leaves your machine.</p>
            </div>
          </div>
        </div>

        <div className="card-grid-2" style={{ alignItems: 'stretch', marginTop: '1.8rem' }}>
          {/* Daily Ghost Suggestions from history */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <Activity size={16} color="var(--accent-primary)" />
                <h3>Predictive Suggestions</h3>
              </div>
              <span className="badge subtle">Non-intrusive</span>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>
              Based on your daily history and detected patterns, Ghost proposes macros you’re likely to run again.
            </p>
            {groupedByDay.length === 0 ? (
              <div className="mono-box" style={{ maxHeight: 130 }}>
                <p>No Ghost suggestions yet.</p>
                <p>Run a few macros from the Dashboard and History will start feeding this panel.</p>
              </div>
            ) : (
              <div className="mono-box" style={{ maxHeight: 190, overflowY: 'auto' }}>
                {groupedByDay.slice(0, 5).map((day) => (
                  <div key={day.day} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <Clock size={14} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{day.dateLabel}</span>
                        <span className="badge subtle" style={{ fontSize: '0.75rem' }}>
                          {day.count} runs
                        </span>
                      </div>
                      {day.suggestedAction && (
                        <span className="badge accent" style={{ fontSize: '0.75rem' }}>
                          <Zap size={12} /> Ghost macro ready
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      {day.tasks.length > 0 && (
                        <span>
                          Top task: <strong>{day.tasks[0][0].replace('-', ' ')}</strong> · {day.tasks[0][1]} times
                        </span>
                      )}
                      {day.fileTypes.length > 0 && (
                        <span style={{ marginLeft: '0.75rem' }}>
                          File type: <strong>{day.fileTypes[0][0]}</strong>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleRunSuggested(day.suggestedAction, day.sample)}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                    >
                      <FileText size={14} /> {day.suggestedLabel}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cross-App Automation Watcher (simulated in web) */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <Ghost size={16} />
                <h3>Cross-App Automation Watcher</h3>
              </div>
              <span className="badge subtle">Watcher status</span>
            </div>
            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '0.8rem' }}>
              Uses your recent history and file patterns to decide when a learned Ghost Macro should trigger.
            </p>
            <div className="mono-box" style={{ maxHeight: 150 }}>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Web-only mode:</strong> when you drop a new file whose name and type match a learned Ghost Macro, the macro can run automatically (if enabled) or be suggested.
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                For Electron, you can extend this with real folder watching via <code>fs.watch</code> without changing the Ghost engine.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ghost Orb */}
      <div
        className={`ghost-orb ${ghostModeEnabled ? '' : 'off'}`}
        onClick={() => setOrbPanelOpen((open) => !open)}
      >
        <Ghost size={26} color="#0b0f14" style={{ opacity: 0.9 }} />
      </div>

      {orbPanelOpen && (
        <div className="ghost-orb-panel">
          <div className="ghost-toggle-row">
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600 }}>Ghost Mode</div>
                <div className="muted" style={{ fontSize: '0.8rem' }}>
                  {ghostModeEnabled ? 'Auto-execution is enabled.' : 'Auto-execution is paused.'}
                </div>
            </div>
            <div
              className={`toggle-pill ${ghostModeEnabled ? 'on' : ''}`}
              onClick={() => setGhostModeEnabled(!ghostModeEnabled)}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          <div className="flex-between" style={{ marginTop: '0.6rem' }}>
            <span className="muted" style={{ fontSize: '0.8rem' }}>Automation Confidence Score</span>
            <span className="badge accent" style={{ fontSize: '0.78rem' }}>
              {learnedMacros.length ? 'Adaptive' : 'Learning'}
            </span>
          </div>

          <div className="mono-box" style={{ maxHeight: 160, overflowY: 'auto' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Learned behaviors</p>
            {learnedMacros.length === 0 ? (
              <p style={{ fontSize: '0.8rem' }}>No Ghost Macros learned yet. Repeating workflows will appear here.</p>
            ) : (
              learnedMacros.slice(0, 4).map((m, idx) => (
                <div key={m.id} style={{ marginBottom: '0.4rem' }}>
                  <p style={{ fontSize: '0.8rem' }}>
                      {idx + 1}. {(m.actionSequence || []).map((a) => a.type).join(' → ')}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge subtle" style={{ fontSize: '0.75rem' }}>
                      <Activity size={12} /> {m.repetitionCount}× • {m.confidenceScore}% confidence
                    </span>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }}
                        onClick={() => toggleMacroEnabled(m.id)}
                      >
                          {m.autoRunEnabled ? 'Auto-run: On' : 'Auto-run: Off'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', color: '#fca5a5' }}
                        onClick={() => removeMacro(m.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                    {m.lastTriggered && (
                      <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.15rem' }}>
                        Last triggered: {new Date(m.lastTriggered).toLocaleString()}
                      </div>
                    )}
                </div>
              ))
            )}
          </div>

          <div className="flex-between" style={{ marginTop: '0.4rem' }}>
            <span className="badge subtle" style={{ fontSize: '0.78rem' }}>
              <Sparkles size={12} /> Predictive suggestions {ghostModeEnabled ? 'enabled' : 'ready'}
            </span>
            <span className="badge subtle" style={{ fontSize: '0.78rem' }}>
              <Shield size={12} /> Runs locally
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default GhostMacros;

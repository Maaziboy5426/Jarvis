import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Brain, Clock, Cpu, Ghost, Trash2, Zap, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGhostMacro } from '../state/GhostMacroContext.jsx';
import { useApp } from '../state/AppContext.jsx';

const AVG_STEP_SECONDS = 3;

const GhostIntelligence = () => {
  const navigate = useNavigate();
  const { history, storageKeys } = useApp();
  const {
    actions,
    sessions,
    learnedMacros,
    executionHistory,
    ghostModeEnabled,
    setGhostModeEnabled,
    confidenceThreshold,
    setConfidenceThreshold,
    toggleMacroEnabled,
    removeMacro,
    clearLearningHistory,
    logAction,
  } = useGhostMacro();


  const hasAnyData =
    (actions?.length || 0) > 0 ||
    (sessions?.length || 0) > 0 ||
    (learnedMacros?.length || 0) > 0 ||
    (executionHistory?.length || 0) > 0 ||
    (history?.length || 0) > 0;

  const metrics = useMemo(() => {
    const totalActions = actions?.length || 0;
    const totalSessions = sessions?.length || 0;
    const totalMacros = learnedMacros?.length || 0;
    const autoExecutions = executionHistory?.length || 0;

    let totalSecondsSaved = 0;
    (learnedMacros || []).forEach((m) => {
      const steps = (m.actionSequence || []).length || 0;
      const reps = m.repetitionCount || 0;
      totalSecondsSaved += steps * AVG_STEP_SECONDS * reps;
    });
    const timeSavedMinutes = totalSecondsSaved / 60;

    return {
      totalActions,
      totalSessions,
      totalMacros,
      autoExecutions,
      timeSavedMinutes,
    };
  }, [actions, sessions, learnedMacros, executionHistory]);

  const detectedPatterns = useMemo(() => {
    if (!history || history.length === 0) {
      return { taskTypePatterns: [], fileTypePatterns: [] };
    }

    const taskTypeCounts = {};
    const fileTypeCounts = {};

    history.forEach((item) => {
      const taskType = item.taskType || 'custom';
      taskTypeCounts[taskType] = (taskTypeCounts[taskType] || 0) + 1;

      if (item.fileType) {
        const key = item.fileType.toString();
        fileTypeCounts[key] = (fileTypeCounts[key] || 0) + 1;
      }
    });

    const task = Object.entries(taskTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const file = Object.entries(fileTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return { taskTypePatterns: task, fileTypePatterns: file };
  }, [history]);

  const sortedMacros = useMemo(() => {
    return (learnedMacros || [])
      .slice()
      .sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
  }, [learnedMacros]);

  const timeline = useMemo(() => {
    return (executionHistory || [])
      .slice()
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10);
  }, [executionHistory]);

  const lastActions = useMemo(() => {
    return (actions || [])
      .slice()
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);
  }, [actions]);

  const growth = useMemo(() => {
    const byDay = new Map();
    (executionHistory || []).forEach((e) => {
      const ts = e.timestamp || 0;
      if (!ts) return;
      const key = new Date(ts).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + 1);
    });

    const points = [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([day, count]) => ({ day, count }));

    return points;
  }, [executionHistory]);

  const fileTypeDistribution = useMemo(() => {
    const mapType = (ft) => {
      const t = (ft || '').toLowerCase();
      if (!t) return null;
      if (t.includes('application/pdf') || t === 'pdf') return 'pdf';
      if (t.includes('spreadsheetml') || t.includes('excel') || t === 'xlsx') return 'xlsx';
      if (t.includes('wordprocessingml') || t.includes('word') || t === 'docx') return 'docx';
      if (t.includes('presentationml') || t.includes('powerpoint') || t === 'pptx' || t === 'ppt') return 'ppt';
      return null;
    };

    const counts = {};
    (sessions || []).forEach((s) => {
      const key = mapType(s.fileType);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([, a], [, b]) => b - a);
  }, [sessions]);

  const ghostScore = useMemo(() => {
    const totalSessions = metrics.totalSessions || 0;
    if (!totalSessions) return 0;

    const macros = learnedMacros || [];
    const avgConfidence =
      macros.length === 0
        ? 0
        : macros.reduce((sum, m) => sum + (m.confidenceScore || 0), 0) / macros.length;

    const autoExecRatio = metrics.autoExecutions / totalSessions;
    const timePerSession = metrics.timeSavedMinutes / totalSessions;

    const score =
      avgConfidence * 0.4 +
      Math.max(0, Math.min(100, autoExecRatio * 100)) * 0.3 +
      Math.max(0, Math.min(100, timePerSession)) * 0.3;

    return clamp0to100(score);
  }, [learnedMacros, metrics]);


  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>Ghost Intelligence Dashboard</h1>
          <p className="section-subtitle">
            Real-time analytics from Ghost learning data. No mock values.
          </p>
        </div>
        <span className="badge accent">
          <Brain size={14} /> Ghost analytics
        </span>
      </div>

      {!hasAnyData ? (
        <EmptyState />
      ) : (
        <>
          {/* SECTION 1 — AUTOMATION OVERVIEW */}
          <div className="card-grid-4" style={{ marginBottom: '1.25rem' }}>
            <MetricCard icon={Activity} label="Total Actions Logged" value={metrics.totalActions} />
            <MetricCard icon={Cpu} label="Total Sessions" value={metrics.totalSessions} />
            <MetricCard icon={Ghost} label="Learned Ghost Macros" value={metrics.totalMacros} />
            <MetricCard icon={Zap} label="Auto-Executions Triggered" value={metrics.autoExecutions} />
          </div>
          <div className="card-grid-2" style={{ marginBottom: '2.5rem', alignItems: 'stretch' }}>
            <div className="glass-panel" style={{ padding: '1.35rem 1.4rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                <div className="muted" style={{ fontSize: '0.8rem' }}>Estimated Time Saved</div>
                <Clock size={16} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                <CountUpNumber value={Math.round(metrics.timeSavedMinutes)} /> min
              </div>
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Computed from learned macros: \(steps × {AVG_STEP_SECONDS}s × repetitionCount\).
              </div>
            </div>

            {/* SECTION 6 — GHOST INTELLIGENCE SCORE */}
            <div className="glass-panel" style={{ padding: '1.35rem 1.4rem' }}>
              <div className="flex-between" style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Brain size={16} />
                  <div style={{ fontWeight: 700 }}>Ghost Intelligence Score</div>
                </div>
                <span className="badge subtle">{ghostScore}%</span>
              </div>
              <CircularProgress value={ghostScore} />
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.6rem', marginBottom: '2rem' }}>
            <div className="section-header" style={{ marginBottom: '0.9rem' }}>
              <div className="flex-row" style={{ gap: '0.5rem' }}>
                <Sparkles size={16} />
                <h3>Detected Patterns</h3>
              </div>
            </div>
            {detectedPatterns.taskTypePatterns.length === 0 && detectedPatterns.fileTypePatterns.length === 0 ? (
              <p className="muted" style={{ fontSize: '0.9rem' }}>
                No patterns detected yet. Run a few macros to let JARVIS learn from your history.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {detectedPatterns.taskTypePatterns.length > 0 && (
                    <div>
                      <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        Most common tasks
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {detectedPatterns.taskTypePatterns.map(([type, count]) => (
                          <span key={type} className="badge subtle">
                            {String(type).replace('-', ' ')} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {detectedPatterns.fileTypePatterns.length > 0 && (
                    <div>
                      <div className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        Most used file types
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {detectedPatterns.fileTypePatterns.map(([type, count]) => (
                          <span key={type} className="badge subtle">
                            {type} · {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '0.9rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Patterns are based on your last {Math.min((history || []).length, 100)} macro runs.
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="card-grid-2" style={{ alignItems: 'stretch', marginBottom: '2rem' }}>
        {/* SECTION 2 — LEARNED MACROS TABLE */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Cpu size={16} />
              <h3>Learned Macros</h3>
            </div>
            <span className="badge subtle">Real data</span>
          </div>

          {sortedMacros.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              No learned macros yet.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.55rem 0.4rem' }}>File type</th>
                    <th style={{ padding: '0.55rem 0.4rem' }}>Pattern</th>
                    <th style={{ padding: '0.55rem 0.4rem' }}>Repeats</th>
                    <th style={{ padding: '0.55rem 0.4rem' }}>Confidence</th>
                    <th style={{ padding: '0.55rem 0.4rem' }}>Auto-run</th>
                    <th style={{ padding: '0.55rem 0.4rem' }}>Last triggered</th>
                    <th style={{ padding: '0.55rem 0.4rem' }} />
                  </tr>
                </thead>
                <tbody>
                  {sortedMacros.map((m) => (
                    <tr key={m.id} style={{ borderTop: '1px solid rgba(148,163,184,0.18)' }}>
                      <td style={{ padding: '0.55rem 0.4rem', whiteSpace: 'nowrap' }}>
                        <span className="badge subtle">{m.fileTypePattern || '*'}</span>
                      </td>
                      <td style={{ padding: '0.55rem 0.4rem', minWidth: 160 }}>
                        <code>{m.fileNamePattern || '*'}</code>
                      </td>
                      <td style={{ padding: '0.55rem 0.4rem' }}>{m.repetitionCount || 0}</td>
                      <td style={{ padding: '0.55rem 0.4rem', minWidth: 140 }}>
                        <ProgressBar value={clamp0to100(m.confidenceScore || 0)} />
                      </td>
                      <td style={{ padding: '0.55rem 0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.8rem' }}
                          onClick={() => toggleMacroEnabled(m.id)}
                        >
                          {m.autoRunEnabled ? 'On' : 'Off'}
                        </button>
                      </td>
                      <td style={{ padding: '0.55rem 0.4rem', whiteSpace: 'nowrap' }}>
                        {m.lastTriggered ? new Date(m.lastTriggered).toLocaleString() : '—'}
                      </td>
                      <td style={{ padding: '0.55rem 0.4rem' }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ padding: '0.25rem 0.5rem', color: '#fca5a5' }}
                          onClick={() => removeMacro(m.id)}
                          aria-label="Delete macro"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 3 — EXECUTION TIMELINE */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Clock size={16} />
              <h3>Execution Timeline</h3>
            </div>
            <span className="badge subtle">Last 10</span>
          </div>

          {timeline.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.9rem' }}>No auto-executions yet.</p>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {timeline.map((e) => (
                <div
                  key={e.id}
                  style={{
                    padding: '0.55rem 0',
                    borderBottom: '1px dashed rgba(148,163,184,0.22)',
                  }}
                >
                  <div className="flex-between" style={{ gap: '0.8rem', flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'} • {e.fileName || 'Unknown file'}
                    </div>
                    <span className={`badge ${e.status === 'success' ? 'success' : 'subtle'}`}>
                      {e.status || 'unknown'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Sequence: {(e.actionsExecuted || []).length ? e.actionsExecuted.join(' → ') : '—'}
                  </div>
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    Duration: {Number.isFinite(e.durationMs) ? `${Math.round(e.durationMs / 100) / 10}s` : '—'}
                  </div>
                  {e.status === 'error' && e.error && (
                    <div style={{ color: '#fca5a5', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                      {e.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-grid-2" style={{ alignItems: 'stretch', marginBottom: '2rem' }}>
        {/* SECTION 4 — AUTOMATION GROWTH GRAPH */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Activity size={16} />
              <h3>Automation Growth</h3>
            </div>
            <span className="badge subtle">Auto-executions/day</span>
          </div>
          <GrowthChart data={growth} />
        </div>

        {/* SECTION 5 — FILE TYPE DISTRIBUTION */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Cpu size={16} />
              <h3>File Type Distribution</h3>
            </div>
            <span className="badge subtle">From sessions</span>
          </div>
          <BarChart data={fileTypeDistribution} />
        </div>
      </div>

      <div className="card-grid-2" style={{ alignItems: 'stretch', marginBottom: '2rem' }}>
        {/* SECTION 7 — REAL-TIME ACTIVITY PANEL */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Zap size={16} />
              <h3>Real-time Activity</h3>
            </div>
            <span className="badge subtle">Last 5 actions</span>
          </div>
          {lastActions.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              No actions yet.
            </p>
          ) : (
            <div className="mono-box" style={{ maxHeight: 190, overflowY: 'auto' }}>
              {lastActions.map((a) => (
                <p key={a.id} style={{ fontSize: '0.86rem' }}>
                  [{a.timestamp ? new Date(a.timestamp).toLocaleTimeString() : '—'}] {a.type}
                  {a.fileName ? ` • ${a.fileName}` : ''}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 8 — SAFETY CONTROL PANEL */}
        <div className="glass-panel" style={{ padding: '1.6rem' }}>
          <div className="section-header" style={{ marginBottom: '0.9rem' }}>
            <div className="flex-row" style={{ gap: '0.5rem' }}>
              <Brain size={16} />
              <h3>Safety Controls</h3>
            </div>
            <span className="badge subtle">Production-grade</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="flex-between">
              <div>
                <div style={{ fontWeight: 700 }}>Ghost Mode</div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Enable/disable auto-execution globally.
                </div>
              </div>
              <div
                className={`toggle-pill ${ghostModeEnabled ? 'on' : ''}`}
                onClick={() => setGhostModeEnabled(!ghostModeEnabled)}
                style={{ cursor: 'pointer' }}
              >
                <div className="toggle-thumb" />
              </div>
            </div>

            <div>
              <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Confidence threshold</div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Minimum confidence required for auto-execution.
                  </div>
                </div>
                <span className="badge subtle">{confidenceThreshold}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div className="flex-between" style={{ marginTop: '0.25rem' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Clear learning history</div>
                <div className="muted" style={{ fontSize: '0.85rem' }}>
                  Clears sessions, learned macros, and execution history.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ color: '#fca5a5' }}
                onClick={() => {
                  const ok = window.confirm('Clear Ghost learning history? This cannot be undone.');
                  if (ok) void clearLearningHistory();
                }}
              >
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = memo(() => {
  return (
    <div className="glass-panel" style={{ padding: '1.6rem', marginBottom: '1.5rem' }}>
      <div style={{ fontWeight: 800, marginBottom: '0.35rem' }}>
        No automation data yet.
      </div>
      <div className="muted" style={{ fontSize: '0.95rem' }}>
        Start using Jarvis (upload files, run macros) to generate insights.
      </div>
    </div>
  );
});

const MetricCard = memo(({ icon: Icon, label, value }) => {
  const v = Number.isFinite(value) ? value : 0;
  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.2rem 1.25rem',
        borderRadius: '1rem',
        border: '1px solid rgba(129,140,248,0.32)',
        boxShadow: 'var(--shadow-soft)',
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex-between" style={{ marginBottom: '0.35rem' }}>
        <div className="muted" style={{ fontSize: '0.8rem' }}>{label}</div>
        {React.createElement(Icon, { size: 16 })}
      </div>
      <div className="stat-number" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
        <CountUpNumber value={v} />
      </div>
    </div>
  );
});

const CountUpNumber = memo(({ value }) => {
  const target = Number.isFinite(value) ? value : 0;
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = target;
    const duration = 650;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{display}</span>;
});

const ProgressBar = memo(({ value }) => {
  const v = clamp0to100(value);
  return (
    <div>
      <div className="muted" style={{ fontSize: '0.78rem', marginBottom: '0.2rem' }}>{v}%</div>
      <div style={{ width: '100%', height: 7, borderRadius: 999, background: 'rgba(148,163,184,0.18)', overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary), rgba(129,140,248,0.25))' }} />
      </div>
    </div>
  );
});

const GrowthChart = memo(({ data }) => {
  if (!data || data.length === 0) {
    return <p className="muted" style={{ fontSize: '0.9rem' }}>No auto-executions yet.</p>;
  }

  if (data.length < 2) {
    return (
      <div className="mono-box">
        <p style={{ fontSize: '0.85rem' }}>
          Not enough data to plot a trend. Need at least 2 days of auto-execution history.
        </p>
      </div>
    );
  }

  const width = 520;
  const height = 160;
  const pad = 18;
  const maxY = Math.max(...data.map((d) => d.count), 1);

  const points = data.map((d, idx) => {
    const x = pad + (idx / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - d.count / maxY) * (height - pad * 2);
    return [x, y];
  });

  const poly = points.map((p) => p.join(',')).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <polyline points={poly} fill="none" stroke="rgba(129,140,248,0.95)" strokeWidth="2.5" />
        {points.map(([x, y], i) => (
          <circle key={data[i].day} cx={x} cy={y} r="3" fill="rgba(129,140,248,0.95)" />
        ))}
      </svg>
      <div className="muted" style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>{data[0].day}</span>
        <span>{data[data.length - 1].day}</span>
      </div>
    </div>
  );
});

const BarChart = memo(({ data }) => {
  if (!data || data.length === 0) {
    return <p className="muted" style={{ fontSize: '0.9rem' }}>No session file types yet.</p>;
  }
  const max = data[0][1] || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {data.map(([label, count]) => {
        const pct = Math.round((count / max) * 100);
        return (
          <div key={label}>
            <div className="flex-between" style={{ fontSize: '0.85rem' }}>
              <span style={{ fontWeight: 700 }}>{label}</span>
              <span className="muted">{count}</span>
            </div>
            <div style={{ width: '100%', height: 7, borderRadius: 999, background: 'rgba(148,163,184,0.18)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-secondary), rgba(16,185,129,0.25))' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
});

const CircularProgress = memo(({ value }) => {
  const v = clamp0to100(value);
  const angle = (v / 100) * 360;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: '50%',
          background: `conic-gradient(var(--accent-primary) 0deg ${angle}deg, rgba(148,163,184,0.4) ${angle}deg 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 1px rgba(148,163,184,0.35)',
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'var(--bg-card-strong)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            fontWeight: 800,
          }}
        >
          {v}%
        </div>
      </div>
      <div className="muted" style={{ fontSize: '0.9rem' }}>
        Score formula uses average macro confidence, auto-execution density, and time saved per session.
      </div>
    </div>
  );
});

function clamp0to100(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default GhostIntelligence;


import React from 'react';
import { Activity, FileText, Wand2, Edit3, Eraser, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../state/AppContext.jsx';

// Map task type / task text → icon + accent colour
function resolveTask(item: any): { label: string; color: string; Icon: React.ElementType } {
  const type = (item.taskType || '').toLowerCase();
  const task = (item.task || '').toLowerCase();

  if (type === 'summarize' || task.includes('summar')) {
    return { label: 'Summarize', color: '#8b5cf6', Icon: FileText };
  }
  if (type === 'rewrite' || task.includes('rewrite') || task.includes('rephrase')) {
    return { label: 'Rewrite', color: '#14b8a6', Icon: Edit3 };
  }
  if (type === 'auto-format' || type === 'format' || task.includes('format')) {
    return { label: 'Auto Format', color: '#fbbf24', Icon: Wand2 };
  }
  if (type === 'clean-up' || type === 'cleanup' || task.includes('clean')) {
    return { label: 'Clean Up', color: '#fb7185', Icon: Eraser };
  }
  return { label: 'Custom', color: '#818cf8', Icon: Sparkles };
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDuration(s: number | undefined): string {
  if (!s || !isFinite(s)) return '—';
  return `${s.toFixed(1)}s`;
}

const LiveActivityFeed: React.FC = () => {
  const { history } = useApp();

  // Take up to last 8 processed items (most recent first; already stored newest-first)
  const items: any[] = ((history as any[]) || []).slice(0, 8);
  const hasItems = items.length > 0;

  return (
    <div
      className="glass-panel"
      style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.45rem', background: 'rgba(129,140,248,0.12)', borderRadius: '8px' }}>
            <Activity size={17} color="var(--accent-primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.97rem' }}>Live Activity</div>
            <div className="muted" style={{ fontSize: '0.8rem' }}>Your recent macro runs</div>
          </div>
        </div>
        <span
          className="badge accent"
          style={{ fontSize: '0.75rem' }}
        >
          {items.length} run{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Empty state */}
      {!hasItems && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            textAlign: 'center',
            padding: '2rem 1rem',
            opacity: 0.7,
          }}
        >
          <Activity size={32} color="var(--text-muted)" />
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            No activity yet. Run a macro to see results here.
          </p>
        </div>
      )}

      {/* Activity list */}
      {hasItems && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
          {items.map((item: any, idx: number) => {
            const { label, color, Icon } = resolveTask(item);
            const isLast = idx === items.length - 1;

            return (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.65rem 0.35rem',
                  borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 150ms ease',
                  borderRadius: '8px',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Icon */}
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    background: `${color}18`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '0.05rem',
                  }}
                >
                  <Icon size={16} color={color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      className="badge success"
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', gap: '0.25rem' }}
                    >
                      <CheckCircle2 size={10} />
                      done
                    </span>
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: '0.8rem',
                      marginTop: '0.1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.fileName || 'Text input'}
                  </div>
                </div>

                {/* Meta */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    className="muted"
                    style={{ fontSize: '0.77rem', display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}
                  >
                    <Clock size={11} />
                    {relativeTime(item.createdAt)}
                  </div>
                  {item.durationSeconds != null && (
                    <div className="muted" style={{ fontSize: '0.75rem', marginTop: '0.1rem' }}>
                      {formatDuration(item.durationSeconds)}
                    </div>
                  )}
                  {item.quality != null && (
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: item.quality >= 0.90 ? '#10b981' : item.quality >= 0.75 ? '#fbbf24' : '#fb7185',
                        marginTop: '0.1rem',
                      }}
                    >
                      {Math.round(item.quality * 100)}% quality
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveActivityFeed;

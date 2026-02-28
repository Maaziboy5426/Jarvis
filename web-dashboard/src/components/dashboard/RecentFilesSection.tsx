import React from 'react';
import { FileText } from 'lucide-react';
import { useDashboardAnalytics } from '../../services/dashboardAnalytics';

function formatDateTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) {
    return `Yesterday · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  if (diffDays < 7) {
    return `${date.toLocaleDateString(undefined, { weekday: 'short' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
}

const RecentFilesSection: React.FC = () => {
  const { recentFiles } = useDashboardAnalytics();
  const hasFiles = Array.isArray(recentFiles) && recentFiles.length > 0;

  return (
    <div
      className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:scale-[1.01] transition-transform duration-150"
      style={{ padding: '1.4rem 1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} />
          <div>
            <div style={{ fontWeight: 700 }}>Recent Files</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Last processed documents
            </div>
          </div>
        </div>
      </div>

      {!hasFiles && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="muted" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            Drop a file to start automation.
          </p>
        </div>
      )}

      {hasFiles && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ minWidth: 700, borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.45rem 0.35rem' }}>File</th>
                <th style={{ padding: '0.45rem 0.35rem' }}>Type</th>
                <th style={{ padding: '0.45rem 0.35rem' }}>Action</th>
                <th style={{ padding: '0.45rem 0.35rem' }}>Date & Time</th>
                <th style={{ padding: '0.45rem 0.35rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentFiles.map((item: any) => {
                const createdAt = item.createdAt ? new Date(item.createdAt) : null;
                const dateLabel = createdAt ? formatDateTime(createdAt) : '—';
                const fileType = item.fileType || '—';
                const action = item.taskType || 'custom';
                const status = 'Success';
                return (
                  <tr key={item.id} style={{ borderTop: '1px solid rgba(148,163,184,0.22)' }}>
                    <td style={{ padding: '0.55rem 0.35rem', minWidth: 260 }}>
                      <span style={{ whiteSpace: 'nowrap' }}>
                        {item.fileName || 'Unknown file'}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.35rem' }}>
                      <span className="badge subtle" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                        {String(fileType)}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.35rem' }}>{String(action).replace('-', ' ')}</td>
                    <td style={{ padding: '0.55rem 0.35rem', minWidth: 140, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>{dateLabel}</td>
                    <td style={{ padding: '0.55rem 0.35rem' }}>
                      <span className="badge success">{status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentFilesSection;


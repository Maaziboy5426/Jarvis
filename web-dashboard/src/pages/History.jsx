import React from 'react';
import { CheckCircle, Clock, FileText, ChevronDown, ChevronUp, Zap, Activity } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';

const HistoryCard = ({ item, expanded, onToggle }) => (
  <div className="glass-panel" style={{ padding: '1.4rem', marginBottom: '1rem' }}>
    <div className="flex-between" style={{ alignItems: 'center' }}>
      <div className="flex-row">
        <div style={{ padding: '0.7rem', borderRadius: '12px', background: 'rgba(16,185,129,0.12)' }}>
          <CheckCircle size={20} color="var(--accent-secondary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ marginBottom: '0.2rem' }}>{item.task}</h4>
          <div style={{ display: 'flex', gap: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <span className="flex-row" style={{ gap: '0.4rem' }}><FileText size={14} /> {item.file}</span>
            <span>{item.fileType && `(${item.fileType})`}</span>
            <span>{item.fileSize && `${item.fileSize}`}</span>
            <span className="flex-row" style={{ gap: '0.4rem' }}><Clock size={14} /> {item.time}</span>
          </div>
          {item.wordCount && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {item.wordCount} words • ~{item.pageEstimate} pages
            </div>
          )}
        </div>
      </div>
      <div className="flex-row" style={{ gap: '1.5rem' }}>
        <div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>Time Taken</div>
          <div style={{ fontWeight: 700 }}>{item.duration}</div>
        </div>
        <button className="btn btn-ghost" onClick={onToggle}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
    </div>
    {
      expanded && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <div className="badge accent" style={{ gap: '0.4rem' }}>
              <Activity size={14} /> Analyzed {item.analyzed}
            </div>
            <div className="badge subtle">
              <Zap size={14} /> Macro confidence score: {item.quality}
            </div>
          </div>
          <p className="muted" style={{ maxWidth: '720px' }}>
            “Why this change?” — Detected redundant sections, applied concise summaries, and highlighted decision points for quick review.
          </p>
        </div>
      )
    }
  </div >
);

const History = () => {
  const { history } = useApp();
  const [expandedIndex, setExpandedIndex] = React.useState(0);

  return (
    <div className="page-container">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <h1>History</h1>
        <div className="badge subtle">Timeline of past macro executions</div>
      </div>

      {history.map((item, idx) => (
        <HistoryCard
          key={item.id}
          item={{
            task: item.task,
            file: item.fileName,
            time: new Date(item.createdAt).toLocaleString(),
            duration: `${item.durationSeconds ?? 0}s`,
            quality: `${item.quality ?? 95}%`,
            analyzed: '100%',
            fileType: item.fileType,
            fileSize: item.fileSize,
            wordCount: item.wordCount,
            pageEstimate: item.pageEstimate
          }}
          expanded={expandedIndex === idx}
          onToggle={() => setExpandedIndex(expandedIndex === idx ? -1 : idx)}
        />
      ))}
    </div>
  );
};
export default History;

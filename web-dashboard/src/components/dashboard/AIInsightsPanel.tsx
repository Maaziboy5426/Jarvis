import React from 'react';
import { Brain, FileText, Zap } from 'lucide-react';
import { useDashboardAnalytics } from '../../services/dashboardAnalytics';

const AIInsightsPanel: React.FC = () => {
  const { aiInsights } = useDashboardAnalytics();
  const { mostProcessedFileType, mostUsedMacro, detectedPattern, ghostConfidence } = aiInsights || {};

  const hasAnyInsight =
    !!mostProcessedFileType || !!mostUsedMacro || !!detectedPattern || (ghostConfidence ?? 0) > 0;

  return (
    <div
      className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:scale-[1.01] transition-transform duration-150"
      style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Brain size={18} />
          <div>
            <div style={{ fontWeight: 700 }}>AI Insights</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Patterns from real macro and file history
            </div>
          </div>
        </div>
      </div>

      {!hasAnyInsight && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Jarvis is still learning your workflow.
          </p>
        </div>
      )}

      {hasAnyInsight && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem' }}>
          <div>
            <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.15rem' }}>
              Most processed file type
            </div>
            {mostProcessedFileType ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="badge subtle">
                  <FileText size={14} /> {mostProcessedFileType.label.toUpperCase()}
                </span>
                <span className="muted">{mostProcessedFileType.count} runs</span>
              </div>
            ) : (
              <div className="muted">No files processed yet.</div>
            )}
          </div>

          <div>
            <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.15rem' }}>
              Most used macro
            </div>
            {mostUsedMacro ? (
              <span className="badge subtle">
                <Zap size={14} /> {mostUsedMacro.id} · {mostUsedMacro.count} triggers
              </span>
            ) : (
              <div className="muted">No macro executions recorded yet.</div>
            )}
          </div>

          <div>
            <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.15rem' }}>
              Detected pattern
            </div>
            {detectedPattern ? (
              <div style={{ fontSize: '0.86rem' }}>{detectedPattern.description}</div>
            ) : (
              <div className="muted">No recurring file patterns detected yet.</div>
            )}
          </div>

          <div>
            <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.15rem' }}>
              Ghost confidence
            </div>
            {ghostConfidence && ghostConfidence > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="badge accent">{ghostConfidence}%</span>
                <span className="muted">Average confidence across learned workflows</span>
              </div>
            ) : (
              <div className="muted">Jarvis is still learning your workflow.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsPanel;


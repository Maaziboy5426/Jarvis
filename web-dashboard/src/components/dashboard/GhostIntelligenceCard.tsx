import React from 'react';
import { Ghost } from 'lucide-react';
import { useDashboardAnalytics } from '../../services/dashboardAnalytics';

const GhostIntelligenceCard: React.FC = () => {
  const { ghostEngineState } = useDashboardAnalytics();

  const {
    ghostModeOn,
    learnedWorkflowsCount,
    autoRunEnabledCount,
    lastPredictionTriggeredAt,
    averageConfidencePercent,
  } = ghostEngineState || {};

  const isInitialized = (learnedWorkflowsCount || 0) > 0;

  return (
    <div
      className="glass-panel bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl hover:scale-[1.01] transition-transform duration-150"
      style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: 'rgba(148,163,184,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ghost size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Ghost Intelligence</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Status from the live Ghost engine
            </div>
          </div>
        </div>
        <span
          className={`badge ${ghostModeOn ? 'success' : 'subtle'}`}
          style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          {ghostModeOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {!isInitialized && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="muted" style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            Ghost Intelligence not initialized.
          </p>
        </div>
      )}

      {isInitialized && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Learned Workflows</span>
            <span>{learnedWorkflowsCount ?? 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Auto-run Enabled</span>
            <span>{autoRunEnabledCount && autoRunEnabledCount > 0 ? 'true' : 'false'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Last Prediction Triggered</span>
            <span>
              {lastPredictionTriggeredAt
                ? new Date(lastPredictionTriggeredAt).toLocaleString()
                : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="muted">Average Confidence</span>
            <span>{Number.isFinite(averageConfidencePercent) ? `${averageConfidencePercent}%` : '0%'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GhostIntelligenceCard;


import React from 'react';
import { FileText, Edit3, Wand2, Eraser } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGhostMacro } from '../state/GhostMacroContext.jsx';
import UsageStatsRow from '../components/dashboard/UsageStatsRow';
import LiveActivityFeed from '../components/dashboard/LiveActivityFeed';
import AIInsightsPanel from '../components/dashboard/AIInsightsPanel';
import GhostIntelligenceCard from '../components/dashboard/GhostIntelligenceCard';
import RecentFilesSection from '../components/dashboard/RecentFilesSection';
import BrandLogo from '../components/BrandLogo.jsx';

const actions = [
  {
    icon: FileText,
    title: 'Summarize',
    description: 'Get key points from long docs',
    colorVar: 'var(--accent-summarize)',
    softBgVar: 'var(--accent-summarize-soft)',
    code: 'summarize',
  },
  {
    icon: Edit3,
    title: 'Rewrite',
    description: 'Improve tone and clarity',
    colorVar: 'var(--accent-rewrite)',
    softBgVar: 'var(--accent-rewrite-soft)',
    code: 'rewrite',
  },
  {
    icon: Wand2,
    title: 'Auto Format',
    description: 'Structure messy content',
    colorVar: 'var(--accent-format)',
    softBgVar: 'var(--accent-format-soft)',
    code: 'format',
  },
  {
    icon: Eraser,
    title: 'Clean Up',
    description: 'Remove noise and formatting',
    colorVar: 'var(--accent-cleanup)',
    softBgVar: 'var(--accent-cleanup-soft)',
    code: 'cleanup',
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { logAction } = useGhostMacro();

  return (
    <div className="page-container">
      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <BrandLogo size="xl" className="brand-logo-fade-in" />
        <h1 style={{ fontSize: '4.5rem', letterSpacing: '0.06em', fontWeight: 900, background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Jarvis</h1>
        <p className="muted" style={{ marginTop: '0.1rem', fontSize: '1.2rem' }}>
          Think Less. Do More.
        </p>
      </div>

      {/* Quick Actions at top */}
      <section style={{ marginTop: '1.5rem', marginBottom: '2.25rem' }}>
        <div className="section-header">
          <h2>Quick Actions</h2>
          <span className="muted">Launch a macro instantly or drag a file</span>
        </div>
        <div className="card-grid-4">
          {actions.map((action) => (
            <div
              key={action.title}
              className="glass-panel floating"
              style={{ padding: '1.4rem', cursor: 'pointer' }}
              onClick={() => {
                logAction({
                  actionType: 'RUN_MACRO_BUTTON',
                  fileName: null,
                  fileType: '',
                  metadata: { code: action.code, source: 'dashboard_quick_action' },
                });
                navigate('/run-macro', { state: { action: action.code } });
              }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: action.softBgVar, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <action.icon size={20} color={action.colorVar} />
              </div>
              <h3 style={{ marginBottom: '0.35rem' }}>{action.title}</h3>
              <p style={{ fontSize: '0.95rem' }}>{action.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Analytics and intelligence grid below quick actions */}
      <section style={{ marginBottom: '2rem' }}>
        <UsageStatsRow />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.2fr)', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <LiveActivityFeed />
        <AIInsightsPanel />
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 2fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <GhostIntelligenceCard />
        <RecentFilesSection />
      </section>
    </div>
  );
};

export default Dashboard;

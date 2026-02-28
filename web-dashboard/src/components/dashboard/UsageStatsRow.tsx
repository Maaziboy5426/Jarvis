import React from 'react';
import { FileText, Zap, Cpu, Clock } from 'lucide-react';
import { useDashboardAnalytics } from '../../services/dashboardAnalytics';

const UsageStatsRow: React.FC = () => {
  const { usageStats } = useDashboardAnalytics();
  const filesProcessed = usageStats?.filesProcessed ?? 0;
  const macrosCreated = usageStats?.macrosCreated ?? 0;
  const activeAutomations = usageStats?.activeAutomations ?? 0;
  const formattedTimeSaved = usageStats?.formattedTimeSaved ?? '0m saved';

  const StatCard = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string | number;
  }) => (
    <div className="glass-panel" style={{ padding: '1.1rem 1.2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.3rem',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span className="muted" style={{ fontSize: '0.8rem' }}>
          {label}
        </span>
        <Icon size={16} />
      </div>
      <div className="stat-number" style={{ fontSize: '1.3rem', fontWeight: 800 }}>{value}</div>
    </div>
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
      }}
    >
      <StatCard icon={FileText} label="Files Processed" value={filesProcessed} />
      <StatCard icon={Zap} label="Macros Created" value={macrosCreated} />
      <StatCard icon={Cpu} label="Active Automations" value={activeAutomations} />
      <StatCard icon={Clock} label="Estimated Time Saved" value={formattedTimeSaved} />
    </div>
  );
};

export default UsageStatsRow;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Play, LayoutDashboard, FileText, Clock, Settings, Folder, Ghost, Brain } from 'lucide-react';

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);

  const commands = React.useMemo(
    () => [
      { label: 'Dashboard', icon: LayoutDashboard, meta: 'Navigation', run: () => navigate('/') },
      { label: 'Run Macro', icon: Play, meta: 'Navigation', run: () => navigate('/run-macro') },
      { label: 'My Macros', icon: Folder, meta: 'Navigation', run: () => navigate('/my-macros') },
      { label: 'Ghost Macros', icon: Ghost, meta: 'Navigation', run: () => navigate('/ghost-macros') },
      { label: 'Ghost Intelligence Dashboard', icon: Brain, meta: 'Navigation', run: () => navigate('/ghost-intelligence') },
      { label: 'Templates', icon: FileText, meta: 'Navigation', run: () => navigate('/templates') },
      { label: 'History', icon: Clock, meta: 'Navigation', run: () => navigate('/history') },
      { label: 'Settings', icon: Settings, meta: 'Navigation', run: () => navigate('/settings') },
      // Module-level actions
      {
        label: 'Smart Reader — Analyze file',
        icon: FileText,
        meta: 'Module • SMART READER',
        run: () => navigate('/run-macro', { state: { action: 'summarize' } })
      },
      {
        label: 'Auto-Fixer — Clean formatting',
        icon: Play,
        meta: 'Module • AUTO-FIXER',
        run: () => navigate('/run-macro', { state: { action: 'format' } })
      },
      {
        label: 'Content Enriched — Rewrite content',
        icon: FileText,
        meta: 'Module • CONTENT ENRICHED',
        run: () => navigate('/run-macro', { state: { action: 'rewrite' } })
      },
      {
        label: 'Ghost Macro — Invisible Assistant',
        icon: Ghost,
        meta: 'Module • GHOST MACRO',
        run: () => navigate('/ghost-macros')
      }
    ],
    [navigate]
  );

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  React.useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
  }, [open, query]);

  const handleRun = (cmd) => {
    cmd.run();
    onClose();
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!filteredCommands.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[activeIndex];
      if (cmd) handleRun(cmd);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="cmdk-backdrop" onClick={onClose}>
      <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
          <div className="badge accent" style={{ gap: '0.35rem' }}>
            <Command size={14} /> Command Palette
          </div>
          <span className="muted" style={{ fontSize: '0.9rem' }}>Search macros, modules, and pages</span>
        </div>
        <input
          className="input-field"
          autoFocus
          placeholder="Type a command or page…"
          style={{ marginBottom: '1rem' }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="cmdk-list flex-col">
          {filteredCommands.map((item, index) => (
            <button
              key={`${item.label}-${index}`}
              className={`btn btn-secondary cmdk-item ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleRun(item)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.meta && <span className="cmdk-item-meta">{item.meta}</span>}
            </button>
          ))}
          {!filteredCommands.length && (
            <div className="muted" style={{ fontSize: '0.9rem' }}>
              No commands found. Try a different query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

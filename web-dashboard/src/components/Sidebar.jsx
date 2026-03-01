import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Play,
  Folder,
  Ghost,
  FileText,
  Clock,
  Settings,
  LogOut,
  Zap,
  User,
  Palette,
  Brain,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';

const Sidebar = () => {
  const navigate = useNavigate();
  const { logOut } = useApp();

  const handleLogout = () => {
    logOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Sparkles, label: 'Smart Intent Prediction', path: '/smart-intent' },
    { icon: Play, label: 'Run Macro', path: '/run-macro' },
    { icon: Folder, label: 'My Macros', path: '/my-macros' },
    { icon: Ghost, label: 'Ghost Macros', path: '/ghost-macros' },
    { icon: Brain, label: 'Ghost Intelligence Dashboard', path: '/ghost-intelligence' },
    { icon: FileText, label: 'Templates', path: '/templates' },
    { icon: Clock, label: 'History', path: '/history' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 10, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border-color)',
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 60,
      }}
    >

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.9rem',
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(108,110,255,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(108,110,255,0.35)' : '1px solid transparent',
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
              transition: 'all 160ms ease'
            })}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="glass-panel" style={{ padding: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: 'auto' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <User size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>JARVIS User</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Secure Local Mode</div>
        </div>
        <Palette size={18} color="var(--text-secondary)" />
      </div>

      <div
        style={{
          marginTop: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.75rem 1rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer'
        }}
        onClick={handleLogout}
      >
        <LogOut size={18} />
        <span style={{ fontSize: '0.95rem' }}>Logout</span>
      </div>
    </aside>
  );
};

export default Sidebar;

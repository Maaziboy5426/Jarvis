import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Search, Menu, LayoutDashboard, Play, Folder, Ghost, FileText, Clock, Settings, LogOut, Brain, Sparkles } from 'lucide-react';
import { useApp } from '../state/AppContext.jsx';
import BrandLogo from './BrandLogo.jsx';

const Layout = ({ onOpenPalette }) => {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logOut } = useApp();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setNavOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

  const handleNavigate = (path) => {
    navigate(path);
    setNavOpen(false);
  };

  const handleLogout = () => {
    setNavOpen(false);
    logOut();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="content-area">
        {/* Top sticky bar: Navigation button + status pills */}
        <div
          style={{
            position: 'sticky',
            top: '1.5rem',
            zIndex: 40,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', pointerEvents: 'auto' }}>
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: '999px',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
              onClick={() => setNavOpen((open) => !open)}
            >
              <Menu size={16} />
              Menu
            </button>
          </div>

          <div style={{ pointerEvents: 'auto' }}>
            <button
              className="btn-ghost"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
              onClick={onOpenPalette}
            >
              <Search size={14} /> Ctrl + K
            </button>
          </div>
        </div>

        {/* Navigation overlay + drawer */}
        <div
          className={`nav-overlay ${navOpen ? 'open' : ''}`}
          onClick={() => setNavOpen(false)}
        />
        <div className={`nav-drawer ${navOpen ? 'open' : ''}`}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>JARVIS Navigation</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.label}
                  className="nav-item-btn"
                  style={{
                    background: isActive ? 'rgba(108,110,255,0.16)' : 'transparent',
                    borderColor: isActive ? 'rgba(108,110,255,0.55)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onClick={() => handleNavigate(item.path)}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <button
              className="nav-item-btn"
              style={{ color: '#f97373', borderColor: 'transparent' }}
              onClick={handleLogout}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <main className="main-scroll" style={{ position: 'relative', marginTop: '1rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

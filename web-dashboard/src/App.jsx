import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RunMacro from './pages/RunMacro';
import History from './pages/History';
import Templates from './pages/Templates';
import MyMacros from './pages/MyMacros';
import GhostMacros from './pages/GhostMacros';
import GhostIntelligence from './pages/GhostIntelligence.jsx';
import SmartIntentPrediction from './pages/SmartIntentPrediction.jsx';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import CommandPalette from './components/CommandPalette';
import SplashScreen from './components/SplashScreen';
import { useApp } from './state/AppContext.jsx';

const PrivateShell = ({ onOpenPalette }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Layout onOpenPalette={onOpenPalette} />;
};

const App = () => {
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const { showSplash, setShowSplash } = useApp();

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      <Router>
        <Routes>
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />

          <Route element={<PrivateShell onOpenPalette={() => setPaletteOpen(true)} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/run-macro" element={<RunMacro />} />
            <Route path="/history" element={<History />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/my-macros" element={<MyMacros />} />
            <Route path="/ghost-macros" element={<GhostMacros />} />
            <Route path="/ghost-intelligence" element={<GhostIntelligence />} />
            <Route path="/smart-intent" element={<SmartIntentPrediction />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>

        <CommandPalette open={isPaletteOpen} onClose={() => setPaletteOpen(false)} />
      </Router>
    </>
  );
};

export default App;

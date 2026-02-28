import React, { useEffect } from 'react';

/**
 * Netflix-style Splash Screen — JARVIS
 *
 * Strip animation: yellow, orange, red, pink flow across the logo.
 * Clean font, premium OTT intro.
 *
 * Animation (2.8s total):
 * - Phase 1 (0–0.6s): Fade in, scale 0.95→1
 * - Phase 2 (0.6–2.2s): Letter-spacing + color strip sweep
 * - Phase 3 (2.2–2.8s): Fade-out to black
 *
 * Shows: app launch, refresh, after login.
 */
const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const timer = setTimeout(() => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      if (typeof onFinish === 'function') onFinish();
    }, 2800);

    return () => {
      clearTimeout(timer);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [onFinish]);

  return (
    <div className="jarvis-splash-cinematic" aria-hidden="true">
      <div className="jarvis-splash-bg" />
      <div className="jarvis-splash-content">
        <h1 className="jarvis-splash-text">JARVIS</h1>
      </div>
    </div>
  );
};

export default SplashScreen;

import React from 'react';
import jarvisLogo from '../assets/jarvis-logo.png';

// Always render the raw logo image directly with no extra shapes or containers.
const BrandLogo = ({ size = 'md', variant = 'full', loading = 'lazy' }) => {
  return (
    <img
      src={jarvisLogo}
      alt="Jarvis logo"
      loading={loading}
      className={`brand-logo brand-logo-${size} brand-logo-fade-in`}
    />
  );
};

export default BrandLogo;


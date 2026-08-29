import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div style={splashContainerStyle}>
      <div style={logoWrapperStyle}>
        <LayoutGrid size={48} color="#ffffff" />
      </div>
      <h1 style={titleStyle}>CollabBoard</h1>
      <p style={subtitleStyle}>Connecting your team...</p>
    </div>
  );
}

const splashContainerStyle = {
  position: 'fixed',
  inset: 0,
  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontFamily: 'Outfit, sans-serif',
  zIndex: 9999,
  pointerEvents: 'none',
  animation: 'fadeOut 0.5s ease-in-out 1.5s forwards',
};

const logoWrapperStyle = {
  width: '80px',
  height: '80px',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  animation: 'pulse 2s infinite',
};

const titleStyle = {
  fontSize: '32px',
  fontWeight: 700,
  margin: 0,
  marginBottom: '12px',
};

const subtitleStyle = {
  fontSize: '16px',
  opacity: 0.9,
};

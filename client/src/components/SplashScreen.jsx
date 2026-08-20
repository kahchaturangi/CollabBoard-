import React, { useEffect } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SplashScreen({ onFinish }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFinish();
      navigate('/login', { replace: true });
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [navigate, onFinish]);

  return (
    <main className="splash-screen" aria-label="Loading CollabBoard">
      <div className="splash-content">
        <div className="splash-logo" aria-hidden="true">
          <LayoutGrid size={42} strokeWidth={2.2} />
        </div>
        <h1>CollabBoard</h1>
      </div>
    </main>
  );
}

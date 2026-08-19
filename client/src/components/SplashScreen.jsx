import React from 'react';
import { LayoutGrid, ArrowUpRight } from 'lucide-react';

export default function SplashScreen() {
  return (
    <main className="splash-screen" aria-label="Loading CollabBoard">
      <div className="splash-glow splash-glow-left" />
      <div className="splash-glow splash-glow-right" />

      <section className="splash-content">
        <div className="splash-mark">
          <LayoutGrid size={34} strokeWidth={2.4} />
          <span className="splash-mark-dot" />
        </div>
        <p className="splash-kicker">TEAM WORKSPACE</p>
        <h1>Collab<span>Board</span></h1>
        <p className="splash-tagline">Make progress visible.</p>
        <div className="splash-loader" aria-hidden="true">
          <span />
          <ArrowUpRight size={16} />
        </div>
      </section>

      <p className="splash-footer">Plan together <span>•</span> Build better</p>
    </main>
  );
}

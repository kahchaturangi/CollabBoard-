import React, { useState, useEffect } from 'react';
import sunImg from '../assets/sun.png';
import moonCloudImg from '../assets/moon-cloud.png';

export default function DayNightGreeting({ compact = false }) {
  const [manualMode, setManualMode] = useState(null); // 'day' | 'night' | null (auto)
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeString = `${displayHours}:${minutes}:${seconds} ${ampm}`;

  // Daytime: 5 AM - 6:59 PM (hours 5 to 18)
  // Nighttime: 7 PM - 4:59 AM (hours 19 to 4)
  let isDay = hours >= 5 && hours < 19;
  if (manualMode === 'day') isDay = true;
  if (manualMode === 'night') isDay = false;

  let greetingTitle = 'Good Night! 🌙';
  let greetingSub = 'Rest well and recharge under the starry sky. See you tomorrow!';
  let badgeText = 'Night Atmosphere';

  if (isDay) {
    if (hours >= 5 && hours < 12) {
      greetingTitle = 'Good Morning! ☀️';
      greetingSub = 'Rise and shine! Ready to collaborate and achieve your goals today?';
      badgeText = 'Morning Energy';
    } else if (hours >= 12 && hours < 17) {
      greetingTitle = 'Good Afternoon! ☀️';
      greetingSub = 'Keep up the momentum! You are making great progress today.';
      badgeText = 'Afternoon Focus';
    } else {
      greetingTitle = 'Good Evening! 🌇';
      greetingSub = 'Wrapping up today’s tasks? Review your board and celebrate small wins.';
      badgeText = 'Golden Hour';
    }
  }

  return (
    <div className={`dynamic-greeting-card ${isDay ? 'theme-day' : 'theme-night'} ${compact ? 'compact' : ''}`}>
      {/* Background Starry / Cloud ambient effects */}
      <div className="card-ambient-sky">
        {!isDay && (
          <div className="card-stars">
            <span className="twinkle-dot s1" style={{ top: '15%', left: '20%' }}></span>
            <span className="twinkle-dot s2" style={{ top: '25%', left: '80%' }}></span>
            <span className="twinkle-dot s3" style={{ top: '75%', left: '15%' }}></span>
            <span className="twinkle-dot s4" style={{ top: '65%', left: '85%' }}></span>
            <span className="twinkle-dot s5" style={{ top: '40%', left: '50%' }}></span>
          </div>
        )}
      </div>

      {/* Top Header with Live Time and Switcher */}
      <div className="greeting-top-bar">
        <div className="live-clock-pill">
          <span className="clock-icon">⏰</span>
          <span>{timeString}</span>
        </div>

        <div className="mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${manualMode === 'day' ? 'active' : ''}`}
            onClick={() => setManualMode('day')}
            title="Day Mode (Sun)"
          >
            ☀️
          </button>
          <button
            type="button"
            className={`mode-btn ${manualMode === null ? 'active' : ''}`}
            onClick={() => setManualMode(null)}
            title="Real Time Auto"
          >
            ⚡
          </button>
          <button
            type="button"
            className={`mode-btn ${manualMode === 'night' ? 'active' : ''}`}
            onClick={() => setManualMode('night')}
            title="Night Mode (Moon)"
          >
            🌙
          </button>
        </div>
      </div>

      {/* Greeting Content & Animated Stage */}
      <div className="greeting-main-body">
        <div className="greeting-text-area">
          <div className="greeting-badge">
            <span className="dot"></span>
            <span>{badgeText}</span>
          </div>
          <h2 className="greeting-heading">{greetingTitle}</h2>
          <p className="greeting-desc">{greetingSub}</p>
        </div>

        {/* Animated Sun / Moon Stage */}
        <div className="greeting-character-viewport">
          {isDay ? (
            <div className="character-anim-wrapper sun-anim">
              <div className="sun-pulse-ring"></div>
              <img src={sunImg} alt="Smiling Sun" className="character-img sun-img-tag" />
              <div className="sparkle-item sp1">✨</div>
              <div className="sparkle-item sp2">✨</div>
              <div className="sparkle-item sp3">☀️</div>
            </div>
          ) : (
            <div className="character-anim-wrapper moon-anim">
              <div className="moon-pulse-halo"></div>
              <img src={moonCloudImg} alt="Sleeping Moon on Cloud" className="character-img moon-img-tag" />
              <div className="night-star-item ns1">⭐</div>
              <div className="night-star-item ns2">✨</div>
              <div className="night-star-item ns3">🌟</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

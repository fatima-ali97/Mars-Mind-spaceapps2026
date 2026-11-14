import React from 'react';

interface MissionOverviewProps {
  onAskChatbot: (prompt: string) => void;
}

export const MissionOverview: React.FC<MissionOverviewProps> = ({ onAskChatbot }) => {
  return (
    <div className="mission-overview">
      <div className="overview-hero">
        <div className="hero-content">
          <div className="hero-badge">MISSION PHASE: EXPEDITION SOL 142</div>
          <h1 className="hero-title">Mars Surface & Habitat Telemetry</h1>
          <p className="hero-desc">
            Mars Mind is a high-availability planetary exploration interface combining real-time subsystem
            monitoring with an intelligent onboard autonomous AI assistant.
          </p>
        </div>

        <div className="quick-actions-bar">
          <span className="quick-actions-label">Ask ARES Onboard AI:</span>
          <button
            className="quick-chip"
            onClick={() => onAskChatbot('What is the current atmospheric composition on Mars?')}
          >
            Atmospheric Composition ↗
          </button>
          <button
            className="quick-chip"
            onClick={() => onAskChatbot('How does the habitat life support system recycle water?')}
          >
            Water & Life Support ↗
          </button>
          <button
            className="quick-chip"
            onClick={() => onAskChatbot('What is the communication time delay between Earth and Mars?')}
          >
            Comms Latency ↗
          </button>
        </div>
      </div>

      <div className="telemetry-grid">
        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-tag">ENVIRONMENT</span>
            <span className="card-badge live">LIVE</span>
          </div>
          <h3 className="card-title">Jezero Crater Surface</h3>
          <div className="metric-row">
            <div className="metric">
              <span className="metric-val">-63°C</span>
              <span className="metric-label">Ambient Temp</span>
            </div>
            <div className="metric">
              <span className="metric-val">612 Pa</span>
              <span className="metric-label">Surface Pressure</span>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-labels">
              <span>Dust Opacity (Tau)</span>
              <span>0.34 (Clear)</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: '34%' }} />
            </div>
          </div>
          <button
            className="card-action-btn"
            onClick={() => onAskChatbot('Explain Jezero crater weather conditions')}
          >
            Analyze Weather with AI
          </button>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-tag">ECLSS HABITAT</span>
            <span className="card-badge ok">NOMINAL</span>
          </div>
          <h3 className="card-title">Life Support & Reserves</h3>
          <div className="metric-row">
            <div className="metric">
              <span className="metric-val">98.2%</span>
              <span className="metric-label">Water Recycled</span>
            </div>
            <div className="metric">
              <span className="metric-val">21.1 kPa</span>
              <span className="metric-label">Oxygen Partial Pressure</span>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-labels">
              <span>MOXIE O2 Production Target</span>
              <span>88% Completed</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-green" style={{ width: '88%' }} />
            </div>
          </div>
          <button
            className="card-action-btn"
            onClick={() => onAskChatbot('How does the habitat life support system recycle water?')}
          >
            Audit Life Support Status
          </button>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-tag">ROVER OPERATIONS</span>
            <span className="card-badge warning">IN TRANSIT</span>
          </div>
          <h3 className="card-title">Autonomous Mobile Unit</h3>
          <div className="metric-row">
            <div className="metric">
              <span className="metric-val">94%</span>
              <span className="metric-label">MMRTG Reserve</span>
            </div>
            <div className="metric">
              <span className="metric-val">14.2 km</span>
              <span className="metric-label">Odometer Total</span>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-labels">
              <span>Sample Cache Capacity</span>
              <span>8 / 20 Sealed</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-accent" style={{ width: '40%' }} />
            </div>
          </div>
          <button
            className="card-action-btn"
            onClick={() => onAskChatbot('Summarize rover battery and navigation telemetry.')}
          >
            Inspect Rover Telemetry
          </button>
        </div>

        <div className="telemetry-card">
          <div className="card-header">
            <span className="card-tag">DEEP SPACE NETWORK</span>
            <span className="card-badge ok">ACTIVE RELAY</span>
          </div>
          <h3 className="card-title">Earth Uplink & Downlink</h3>
          <div className="metric-row">
            <div className="metric">
              <span className="metric-val">12m 44s</span>
              <span className="metric-label">One-Way Light Delay</span>
            </div>
            <div className="metric">
              <span className="metric-val">2.0 Mbps</span>
              <span className="metric-label">Ka-Band Relay Bandwidth</span>
            </div>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-labels">
              <span>Next Window Closes</span>
              <span>03h 18m remaining</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill fill-blue" style={{ width: '65%' }} />
            </div>
          </div>
          <button
            className="card-action-btn"
            onClick={() => onAskChatbot('What is the communication time delay between Earth and Mars?')}
          >
            Query Comms Buffer Status
          </button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { SystemHealth } from '../types/chat';

interface NavbarProps {
  health: SystemHealth;
  activeTab: 'overview' | 'chat';
  setActiveTab: (tab: 'overview' | 'chat') => void;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  health,
  activeTab,
  setActiveTab,
  onRefreshHealth,
}) => {
  const isHealthy = health.status === 'operational';

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => setActiveTab('overview')}>
          <div className="brand-logo-orbit">
            <div className="planet-icon" />
          </div>
          <div>
            <div className="brand-title">
              MARS MIND <span className="spaceapps-tag">SPACE APPS 2026</span>
            </div>
            <div className="brand-subtitle">Autonomous Mission Telemetry & Onboard AI</div>
          </div>
        </div>

        <nav className="navbar-tabs">
          <button
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Mission Control
          </button>
          <button
            className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            AI Specialist (ARES)
          </button>
        </nav>

        <div className="navbar-status-wrap">
          <button
            className={`status-pill ${isHealthy ? 'status-ok' : 'status-err'}`}
            onClick={onRefreshHealth}
            title="Click to re-check backend connection"
          >
            <span className="status-dot" />
            <span className="status-text">
              BE: {isHealthy ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="api-docs-link"
            title="Open FastAPI Swagger Docs"
          >
            API Docs ↗
          </a>
        </div>
      </div>
    </header>
  );
};


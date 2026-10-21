import React from 'react';
import type { ProgressMetric } from '../types/tracker';
import {
  MapPin,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  statewideProgress: ProgressMetric;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  statewideProgress,
  onReset,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo-icon">
          <MapPin size={22} className="logo-pin" />
          <CheckCircle2 size={14} className="logo-check" />
        </div>
        <div className="header-title-group">
          <h1 className="header-title">CA School District Tracker</h1>
          <span className="header-tagline">California Educational Research & Coverage</span>
        </div>
      </div>

      {/* Statewide Progress Gauge */}
      <div className="header-progress-gauge">
        <div className="gauge-labels">
          <span className="gauge-title">Statewide Completion</span>
          <span className="gauge-metric">
            <strong>{statewideProgress.completed}</strong> / {statewideProgress.total} Districts
            <span className="gauge-pct">({statewideProgress.percentage}%)</span>
          </span>
        </div>
        <div className="gauge-track">
          <div
            className="gauge-fill"
            style={{ width: `${statewideProgress.percentage}%` }}
          />
        </div>
      </div>

      {/* Actions: Reset */}
      <div className="header-actions">
        <button
          onClick={onReset}
          className="header-action-btn header-reset-btn"
          title="Reset all tracked districts to uncompleted"
        >
          <RotateCcw size={15} />
          <span className="btn-label">Reset All</span>
        </button>
      </div>
    </header>
  );
};

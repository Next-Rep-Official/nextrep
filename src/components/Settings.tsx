import React from 'react';

type Theme = 'green' | 'blue' | 'purple-orange';

interface SettingsProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentTheme, onThemeChange }) => {
  const handleThemeSelect = (theme: Theme) => {
    onThemeChange(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nextrep_theme', theme);
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>
      <div className="settings-card">
        <div className="settings-section">
          <h2>Theme</h2>
          <div className="theme-options">
            <div
              className={`theme-option theme-green ${currentTheme === 'green' ? 'active' : ''}`}
              onClick={() => handleThemeSelect('green')}
            >
              <div className="theme-preview green"></div>
              <div className="theme-label">Green</div>
            </div>
            <div
              className={`theme-option theme-blue ${currentTheme === 'blue' ? 'active' : ''}`}
              onClick={() => handleThemeSelect('blue')}
            >
              <div className="theme-preview blue"></div>
              <div className="theme-label">Blue</div>
            </div>
            <div
              className={`theme-option theme-purple-orange ${currentTheme === 'purple-orange' ? 'active' : ''}`}
              onClick={() => handleThemeSelect('purple-orange')}
            >
              <div className="theme-preview purple-orange"></div>
              <div className="theme-label">Purple-Orange</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

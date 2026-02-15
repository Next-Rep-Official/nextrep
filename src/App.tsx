import React, { useState, useEffect } from 'react';
import './App.css';
import { getToken, clearToken } from './api/auth';
import { getSelfProfile } from './api/endpoints';
import Login from './components/Login';
import Signup from './components/Signup';
import Feed from './components/Feed';
import CreatePost from './components/CreatePost';
import Profile from './components/Profile';
import UserProfile from './components/UserProfile';
import Users from './components/Users';
import Settings from './components/Settings';

type View = 'login' | 'signup' | 'feed' | 'create' | 'profile' | 'users' | 'settings';
type Theme = 'green' | 'blue' | 'purple-orange';

function App() {
  const [view, setView] = useState<View>('login');
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('nextrep_theme') as Theme;
    return savedTheme || 'green';
  });

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
      loadUserProfile();
      setView('feed');
    }
  }, []);

  useEffect(() => {
    // Apply theme when it changes
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const loadUserProfile = async () => {
    try {
      const response = await getSelfProfile();
      const profile = response.body.data?.profile;
      setCurrentUserId(profile?.id || profile?._id || profile?.user_id);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleLogin = () => {
    setToken(getToken());
    loadUserProfile();
    setView('feed');
  };

  const handleSignup = () => {
    setToken(getToken());
    loadUserProfile();
    setView('feed');
  };

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setCurrentUserId(null);
    setView('login');
  };

  const handlePostCreated = () => {
    setRefreshFeed((prev) => prev + 1);
    setView('feed');
  };

  if (!token) {
    return (
      <div className="App">
        <div className="animated-background"></div>
        {view === 'login' ? (
          <Login onLogin={handleLogin} onSwitchToSignup={() => setView('signup')} />
        ) : (
          <Signup onSignup={handleSignup} onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <div className="animated-background"></div>
      <nav className="navbar">
        <div className="nav-brand">Nextrep</div>
        <div className="nav-links">
          <button
            onClick={() => setView('feed')}
            className={view === 'feed' ? 'nav-link active' : 'nav-link'}
          >
            Feed
          </button>
          <button
            onClick={() => setView('create')}
            className={view === 'create' ? 'nav-link active' : 'nav-link'}
          >
            Create Post
          </button>
          <button
            onClick={() => setView('users')}
            className={view === 'users' ? 'nav-link active' : 'nav-link'}
          >
            Users
          </button>
          <button
            onClick={() => setView('profile')}
            className={view === 'profile' ? 'nav-link active' : 'nav-link'}
          >
            Profile
          </button>
          <button
            onClick={() => setView('settings')}
            className={view === 'settings' ? 'nav-link active' : 'nav-link'}
          >
            Settings
          </button>
          <button onClick={handleLogout} className="nav-link logout">
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'feed' && (
          <Feed
            key={refreshFeed}
            currentUserId={currentUserId || undefined}
            onUserClick={(userId) => setViewingUserId(userId)}
          />
        )}
        {view === 'create' && <CreatePost onPostCreated={handlePostCreated} />}
        {view === 'users' && (
          <Users
            currentUserId={currentUserId || undefined}
            onUserClick={(userId) => setViewingUserId(userId)}
          />
        )}
        {view === 'profile' && <Profile onUpdate={loadUserProfile} currentUserId={currentUserId || undefined} />}
        {view === 'settings' && (
          <Settings
            currentTheme={theme}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              document.documentElement.setAttribute('data-theme', newTheme);
            }}
          />
        )}
      </main>

      {viewingUserId && (
        <UserProfile
          userId={viewingUserId}
          currentUserId={currentUserId || undefined}
          onClose={() => setViewingUserId(null)}
        />
      )}
    </div>
  );
}

export default App;

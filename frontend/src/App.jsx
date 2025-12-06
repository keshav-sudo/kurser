import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import Button from './components/Button.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LiveLogsPage from './pages/LiveLogsPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import RepositoriesPage from './pages/RepositoriesPage.jsx';
import logger from './utils/logger.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function Home() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [trackedRepos, setTrackedRepos] = useState([]);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Token handling moved to main App component
  useEffect(() => {
    // Check for token in localStorage if not in state
    if (!token) {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      showMessage('Profile loaded successfully!');
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchRepos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/repos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepos(res.data.repos);
      showMessage('Repositories loaded!');
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedRepos = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/repos/tracked`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrackedRepos(res.data.repos);
      showMessage('Tracked repositories loaded!');
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const setupWebhook = async () => {
    if (!selectedRepo) {
      showMessage('Please select a repository');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/repos/webhook`, { repoFullName: selectedRepo }, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('Webhook configured successfully!');
      setSelectedRepo('');
      fetchTrackedRepos();
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const removeWebhook = async (repoId) => {
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/repos/webhook/${repoId}`, { headers: { Authorization: `Bearer ${token}` } });
      showMessage('Webhook removed successfully!');
      fetchTrackedRepos();
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookEvents = async () => {
    if (!selectedRepoId) {
      showMessage('Please select a tracked repository');
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/webhook/events/${selectedRepoId}?limit=20`, { headers: { Authorization: `Bearer ${token}` } });
      setWebhookEvents(res.data.events);
      showMessage('Webhook events loaded!');
    } catch (err) {
      showMessage('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/github`;
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    setToken('');
    setUser(null);
    setRepos([]);
    setTrackedRepos([]);
    setWebhookEvents([]);
    setSelectedRepo('');
    setSelectedRepoId('');
    setMessage('');
    showMessage('Logged out successfully. Click "Login with GitHub" to sign in again.');
  };

  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/health`);
      showMessage('API Status: ' + res.data.status + ' ✅');
    } catch (err) {
      showMessage('API Error: ' + (err.response?.data?.error || err.message) + ' ❌');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="app">
        <h1>🚀 Kurser - GitHub Repository Manager</h1>
        <p className="subtitle">Manage your GitHub repositories with automated deployments</p>
        <div className="login-container">
          <Button variant="primary" onClick={handleLogin}>Login with GitHub</Button>
          <Button variant="secondary" onClick={checkHealth} style={{ marginLeft: '10px' }}>Check API Health</Button>
        </div>
        {message && <div className="message">{message}</div>}
        <div className="info-box"><p><strong>API URL:</strong> {API_BASE}</p></div>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🚀 Kurser - GitHub Repository Manager</h1>
      {message && <div className="message">{message}</div>}
      {loading && <div className="loading">⏳ Loading...</div>}

      {/* Navigation removed - handled by Sidebar */}

      {/* User Profile */}
      <section>
        <h2>👤 User Profile</h2>
        {user ? (
          <div className="profile">
            <img src={user.avatarUrl} alt="Avatar" width="50" />
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email || 'N/A'}</p>
          </div>
        ) : (
          <Button onClick={fetchProfile}>Load Profile</Button>
        )}
      </section>

      {/* Repositories */}
      <section>
        <h2>📦 GitHub Repositories</h2>
        <Button onClick={fetchRepos}>Load Repositories</Button>
        {repos.length > 0 && (
          <div className="repo-list">
            <p>Found {repos.length} repositories</p>
            <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)} className="select">
              <option value="">Select a repository</option>
              {repos.map(repo => (
                <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
              ))}
            </select>
            <Button variant="primary" onClick={setupWebhook}>Setup Webhook & Deploy</Button>
          </div>
        )}
      </section>

      {/* Tracked Repositories */}
      <section>
        <h2>✅ Tracked Repositories</h2>
        <Button onClick={fetchTrackedRepos}>Load Tracked Repos</Button>
        {trackedRepos.length > 0 && (
          <div className="tracked-list">
            {trackedRepos.map(repo => (
              <div key={repo._id} className="tracked-item">
                <div>
                  <strong>{repo.fullName}</strong>
                  <span className={`status ${repo.isActive ? 'active' : 'inactive'}`}>
                    {repo.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
                <div>
                  <small>Webhook ID: {repo.webhookId}</small>
                  <small>Last Event: {repo.lastWebhookEvent ? new Date(repo.lastWebhookEvent).toLocaleString() : 'N/A'}</small>
                </div>
                <Button variant="danger" onClick={() => removeWebhook(repo.repoId)} className="btn-sm">Remove Webhook</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Webhook Events */}
      <section>
        <h2>📊 Webhook Events & Logs</h2>
        <div className="events-controls">
          <select value={selectedRepoId} onChange={(e) => setSelectedRepoId(e.target.value)} className="select">
            <option value="">Select a tracked repository</option>
            {trackedRepos.map(repo => (
              <option key={repo._id} value={repo.repoId}>{repo.fullName}</option>
            ))}
          </select>
          <Button onClick={fetchWebhookEvents}>Load Events</Button>
        </div>
        {webhookEvents.length > 0 && (
          <div className="events-list">
            {webhookEvents.map(event => (
              <div key={event._id} className="event-item">
                <div>
                  <strong>{event.eventType}</strong>
                  <span className={`status ${event.status}`}>
                    {event.status === 'completed' ? '✅' : event.status === 'failed' ? '❌' : '⏳'} {event.status}
                  </span>
                </div>
                <div>
                  <small>Created: {new Date(event.createdAt).toLocaleString()}</small>
                  {event.processedAt && <small>Processed: {new Date(event.processedAt).toLocaleString()}</small>}
                </div>
                {event.error && <div className="error-text">Error: {event.error}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Health Check */}
      <section>
        <Button variant="secondary" onClick={checkHealth}>Check API Health</Button>
        <div className="info-box"><p><strong>API URL:</strong> {API_BASE}</p></div>
      </section>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      // Clear the query param from URL without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/dashboard');
    }
  }, [location, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
      <Route path="/repositories" element={<Layout><RepositoriesPage /></Layout>} />
      <Route path="/logs" element={<Layout><LiveLogsPage /></Layout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

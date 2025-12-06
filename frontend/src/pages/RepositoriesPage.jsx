import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Star, GitFork, Eye, Clock, CheckCircle, Loader, X, AlertCircle, Rocket, RefreshCw } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import axios from 'axios';
import './RepositoriesPage.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const DeployModal = ({ repo, onClose, onDeploy }) => {
    const [deploying, setDeploying] = useState(false);
    const [error, setError] = useState('');

    const handleDeploy = async () => {
        setDeploying(true);
        setError('');
        try {
            await onDeploy(repo.full_name);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Deployment failed');
            setDeploying(false);
        }
    };

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="modal-content deploy-modal"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="modal-title">
                        <Rocket size={24} className="text-primary" />
                        <h2>Deploy Repository</h2>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="repo-deploy-info">
                        <div className="repo-avatar">
                            {repo.owner?.avatar_url ? (
                                <img src={repo.owner.avatar_url} alt={repo.owner.login} />
                            ) : (
                                <GitBranch size={24} />
                            )}
                        </div>
                        <div>
                            <h3>{repo.name}</h3>
                            <p className="text-muted">{repo.full_name}</p>
                        </div>
                    </div>

                    <div className="deploy-details">
                        <div className="deploy-detail-item">
                            <span className="label">Default Branch:</span>
                            <span className="value">{repo.default_branch || 'main'}</span>
                        </div>
                        <div className="deploy-detail-item">
                            <span className="label">Visibility:</span>
                            <span className="value">{repo.private ? '🔒 Private' : '🌐 Public'}</span>
                        </div>
                        <div className="deploy-detail-item">
                            <span className="label">Language:</span>
                            <span className="value">{repo.language || 'Not specified'}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="deploy-info-box">
                        <AlertCircle size={18} className="text-info" />
                        <div>
                            <strong>What will happen:</strong>
                            <ul>
                                <li>GitHub webhook will be created</li>
                                <li>Repository will be cloned</li>
                                <li>Code analysis will be performed</li>
                                <li>Deploy will be ready in 1-2 minutes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <Button variant="secondary" onClick={onClose} disabled={deploying}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="glow-effect"
                    >
                        {deploying ? (
                            <>
                                <Loader size={18} className="spinning" />
                                <span>Deploying...</span>
                            </>
                        ) : (
                            <>
                                <Rocket size={18} />
                                <span>Deploy Now</span>
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const RepositoryCard = ({ repo, onDeploy, isDeployed, deploymentInfo }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <Card className="repo-card ultra-card">
                <div className="repo-card-header">
                    <div className="repo-info">
                        <div className="repo-avatar-small">
                            {repo.owner?.avatar_url ? (
                                <img src={repo.owner.avatar_url} alt={repo.owner.login} />
                            ) : (
                                <GitBranch size={20} />
                            )}
                        </div>
                        <div className="repo-name-section">
                            <h3>{repo.name}</h3>
                            <p className="repo-owner text-muted">{repo.owner?.login}</p>
                        </div>
                    </div>
                    {isDeployed ? (
                        <div className="deployed-badge">
                            <CheckCircle size={16} />
                            <span>Deployed</span>
                        </div>
                    ) : (
                        <Button
                            variant="primary"
                            className="deploy-btn glow-effect"
                            onClick={() => setShowModal(true)}
                        >
                            <Rocket size={16} />
                            <span>Deploy</span>
                        </Button>
                    )}
                </div>

                {repo.description && (
                    <p className="repo-description">{repo.description}</p>
                )}

                <div className="repo-stats">
                    <div className="stat-item">
                        <Star size={14} />
                        <span>{repo.stargazers_count || 0}</span>
                    </div>
                    <div className="stat-item">
                        <GitFork size={14} />
                        <span>{repo.forks_count || 0}</span>
                    </div>
                    <div className="stat-item">
                        <Eye size={14} />
                        <span>{repo.watchers_count || 0}</span>
                    </div>
                    {repo.language && (
                        <div className="stat-item language">
                            <span className="language-dot" style={{ backgroundColor: getLanguageColor(repo.language) }}></span>
                            <span>{repo.language}</span>
                        </div>
                    )}
                </div>

                {deploymentInfo && deploymentInfo.previewUrl && (
                    <div className="deployment-link-section">
                        <a 
                            href={deploymentInfo.previewUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="deployment-link"
                        >
                            🚀 View Deployment
                        </a>
                        <span className="deployment-time text-muted">
                            Deployed {getTimeAgo(deploymentInfo.createdAt)}
                        </span>
                    </div>
                )}

                <div className="repo-meta">
                    <div className="meta-item">
                        <Clock size={12} />
                        <span>Updated {getTimeAgo(repo.updated_at)}</span>
                    </div>
                    <div className="meta-item">
                        <span className={`visibility-badge ${repo.private ? 'private' : 'public'}`}>
                            {repo.private ? '🔒 Private' : '🌐 Public'}
                        </span>
                    </div>
                </div>
            </Card>

            <AnimatePresence>
                {showModal && (
                    <DeployModal
                        repo={repo}
                        onClose={() => setShowModal(false)}
                        onDeploy={onDeploy}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

const RepositoriesPage = () => {
    const navigate = useNavigate();
    const [repos, setRepos] = useState([]);
    const [trackedRepos, setTrackedRepos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [filter, setFilter] = useState('all'); // all, deployed, undeployed

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }
        loadRepositories();
    }, [navigate]);

    const loadRepositories = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            setLoading(true);
            setError('');

            // Load both GitHub repos and tracked repos in parallel
            const [reposResponse, trackedResponse] = await Promise.all([
                axios.get(`${API_BASE}/repos`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${API_BASE}/repos/tracked`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            setRepos(reposResponse.data.repos || []);
            setTrackedRepos(trackedResponse.data.repos || []);
        } catch (err) {
            console.error('Error loading repositories:', err);
            setError(err.response?.data?.error || 'Failed to load repositories');
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/login', { replace: true });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadRepositories();
        setRefreshing(false);
        showSuccess('Repositories refreshed!');
    };

    const handleDeploy = async (repoFullName) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        try {
            const response = await axios.post(
                `${API_BASE}/repos/webhook`,
                { repoFullName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showSuccess(`🚀 ${repoFullName} deployed successfully!`);
            
            // Reload tracked repos to update UI
            const trackedResponse = await axios.get(`${API_BASE}/repos/tracked`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTrackedRepos(trackedResponse.data.repos || []);
        } catch (err) {
            throw err; // Re-throw to be caught by modal
        }
    };

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 5000);
    };

    const isRepoDeployed = (repoFullName) => {
        return trackedRepos.some(tr => tr.fullName === repoFullName);
    };

    const getDeploymentInfo = (repoFullName) => {
        const trackedRepo = trackedRepos.find(tr => tr.fullName === repoFullName);
        return trackedRepo?.latestDeployment || null;
    };

    const filteredRepos = repos.filter(repo => {
        if (filter === 'deployed') return isRepoDeployed(repo.full_name);
        if (filter === 'undeployed') return !isRepoDeployed(repo.full_name);
        return true;
    });

    if (loading) {
        return (
            <div className="repositories-container">
                <div className="loading-state">
                    <Loader size={48} className="spinning" />
                    <h2>Loading Repositories...</h2>
                    <p>Fetching your GitHub repositories</p>
                </div>
            </div>
        );
    }

    return (
        <div className="repositories-container">
            <div className="dashboard-bg-glow"></div>

            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        className="success-toast"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                    >
                        <CheckCircle size={20} />
                        <span>{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="repositories-header">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-gradient"
                    >
                        My Repositories
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        {repos.length} repositories found • {trackedRepos.length} deployed
                    </motion.p>
                </div>
                <Button
                    variant="secondary"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="refresh-btn"
                >
                    <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
                    <span>Refresh</span>
                </Button>
            </header>

            {error && (
                <div className="error-banner-large">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="repositories-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({repos.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'deployed' ? 'active' : ''}`}
                    onClick={() => setFilter('deployed')}
                >
                    Deployed ({trackedRepos.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'undeployed' ? 'active' : ''}`}
                    onClick={() => setFilter('undeployed')}
                >
                    Undeployed ({repos.length - trackedRepos.length})
                </button>
            </div>

            {filteredRepos.length === 0 ? (
                <div className="empty-state">
                    <GitBranch size={64} className="text-muted" />
                    <h2>No repositories found</h2>
                    <p>
                        {filter === 'deployed' && 'You haven\'t deployed any repositories yet.'}
                        {filter === 'undeployed' && 'All repositories are deployed!'}
                        {filter === 'all' && 'Create a repository on GitHub to get started.'}
                    </p>
                </div>
            ) : (
                <motion.div
                    className="repositories-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {filteredRepos.map((repo, index) => (
                        <motion.div
                            key={repo.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <RepositoryCard
                                repo={repo}
                                onDeploy={handleDeploy}
                                isDeployed={isRepoDeployed(repo.full_name)}
                                deploymentInfo={getDeploymentInfo(repo.full_name)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

// Helper functions
const getLanguageColor = (language) => {
    const colors = {
        JavaScript: '#f1e05a',
        TypeScript: '#2b7489',
        Python: '#3572A5',
        Java: '#b07219',
        Go: '#00ADD8',
        Rust: '#dea584',
        Ruby: '#701516',
        PHP: '#4F5D95',
        CSS: '#563d7c',
        HTML: '#e34c26',
        C: '#555555',
        'C++': '#f34b7d',
        'C#': '#178600',
        Swift: '#ffac45',
        Kotlin: '#F18E33',
    };
    return colors[language] || '#8b949e';
};

const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
};

export default RepositoriesPage;

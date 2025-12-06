import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Pause, Play, Trash2, Download, Filter, Rocket, GitBranch, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import logger from '../utils/logger.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import './LiveLogsPage.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Helper to parse and format log messages
const parseLogMessage = (logText) => {
    const patterns = {
        error: /❌|ERROR|error|Failed|failed/i,
        success: /✅|SUCCESS|success|completed|deployed/i,
        warning: /⚠️|WARNING|warning|WARN/i,
        info: /ℹ️|INFO|info/i,
        build: /🔨|Building|build/i,
        deploy: /🚀|Deploying|deployment/i,
        clone: /📦|Cloning|clone/i,
        upload: /☁️|Uploading|upload/i,
    };

    let type = 'default';
    for (const [key, pattern] of Object.entries(patterns)) {
        if (pattern.test(logText)) {
            type = key;
            break;
        }
    }

    return { text: logText, type };
};

function LiveLogsPage() {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [error, setError] = useState(null);
    const [isPaused, setIsPaused] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        errors: 0,
        success: 0,
        deployments: 0
    });
    const logsEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        const source = new EventSource(`${API_BASE}/logs/stream`);
        logger.info('LiveLogsPage: Connecting to SSE endpoint');

        source.onmessage = (event) => {
            if (!isPaused) {
                const parsedLog = parseLogMessage(event.data);
                setLogs((prev) => [...prev, parsedLog]);
                
                // Update stats
                setStats(prev => ({
                    total: prev.total + 1,
                    errors: prev.errors + (parsedLog.type === 'error' ? 1 : 0),
                    success: prev.success + (parsedLog.type === 'success' ? 1 : 0),
                    deployments: prev.deployments + (parsedLog.type === 'deploy' ? 1 : 0)
                }));
            }
        };

        source.onerror = (e) => {
            logger.error('LiveLogsPage: SSE connection error', e);
            setError('Connection lost. Reconnecting...');
            source.close();
        };

        return () => {
            source.close();
        };
    }, [isPaused, navigate]);

    // Filter logs based on selected filter
    useEffect(() => {
        if (filterType === 'all') {
            setFilteredLogs(logs);
        } else {
            setFilteredLogs(logs.filter(log => log.type === filterType));
        }
    }, [logs, filterType]);

    useEffect(() => {
        if (!isPaused && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredLogs, isPaused]);

    const clearLogs = () => {
        setLogs([]);
        setFilteredLogs([]);
        setStats({ total: 0, errors: 0, success: 0, deployments: 0 });
    };

    const downloadLogs = () => {
        const element = document.createElement("a");
        const file = new Blob([logs.map(l => l.text).join('\n')], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `kurser-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const getLogIcon = (type) => {
        switch (type) {
            case 'error': return <XCircle size={14} />;
            case 'success': return <CheckCircle size={14} />;
            case 'warning': return <AlertCircle size={14} />;
            case 'deploy': return <Rocket size={14} />;
            case 'clone': return <GitBranch size={14} />;
            default: return <span className="log-prefix">$</span>;
        }
    };

    return (
        <div className="live-logs-container">
            <header className="logs-header">
                <div className="header-title">
                    <Terminal className="terminal-icon" size={28} />
                    <div>
                        <h1>Live Terminal</h1>
                        <p>Real-time system events and deployment logs</p>
                    </div>
                </div>

                <div className="logs-actions">
                    <Button
                        variant="secondary"
                        onClick={() => setIsPaused(!isPaused)}
                        className="action-btn"
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        <span>{isPaused ? 'Resume' : 'Pause'}</span>
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={clearLogs}
                        className="action-btn"
                    >
                        <Trash2 size={16} />
                        <span>Clear</span>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={downloadLogs}
                        className="action-btn"
                    >
                        <Download size={16} />
                        <span>Export</span>
                    </Button>
                </div>
            </header>

            {/* Stats Bar */}
            <div className="logs-stats">
                <div className="stat-card">
                    <Terminal size={20} />
                    <div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Logs</div>
                    </div>
                </div>
                <div className="stat-card success">
                    <CheckCircle size={20} />
                    <div>
                        <div className="stat-value">{stats.success}</div>
                        <div className="stat-label">Success</div>
                    </div>
                </div>
                <div className="stat-card deploy">
                    <Rocket size={20} />
                    <div>
                        <div className="stat-value">{stats.deployments}</div>
                        <div className="stat-label">Deployments</div>
                    </div>
                </div>
                <div className="stat-card error">
                    <XCircle size={20} />
                    <div>
                        <div className="stat-value">{stats.errors}</div>
                        <div className="stat-label">Errors</div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="logs-filters">
                <Filter size={16} />
                <span className="filter-label">Filter:</span>
                <button 
                    className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterType('all')}
                >
                    All ({logs.length})
                </button>
                <button 
                    className={`filter-btn ${filterType === 'deploy' ? 'active' : ''}`}
                    onClick={() => setFilterType('deploy')}
                >
                    Deployments
                </button>
                <button 
                    className={`filter-btn ${filterType === 'build' ? 'active' : ''}`}
                    onClick={() => setFilterType('build')}
                >
                    Builds
                </button>
                <button 
                    className={`filter-btn ${filterType === 'error' ? 'active' : ''}`}
                    onClick={() => setFilterType('error')}
                >
                    Errors
                </button>
                <button 
                    className={`filter-btn ${filterType === 'success' ? 'active' : ''}`}
                    onClick={() => setFilterType('success')}
                >
                    Success
                </button>
            </div>

            <Card className="terminal-window">
                <div className="terminal-bar">
                    <div className="terminal-dots">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                    </div>
                    <div className="terminal-title">
                        root@kurser:~ {isPaused && <span className="paused-indicator">[PAUSED]</span>}
                    </div>
                    <div className="terminal-status">
                        {filteredLogs.length} logs {filterType !== 'all' && `(filtered)`}
                    </div>
                </div>

                <div className="terminal-content" data-testid="logs-container">
                    {filteredLogs.length === 0 && !error && (
                        <div className="empty-state">
                            <Terminal size={48} className="empty-icon" />
                            <h3>{filterType === 'all' ? 'Waiting for logs...' : `No ${filterType} logs yet`}</h3>
                            <p>
                                {isPaused 
                                    ? 'Logs are paused. Click Resume to continue.' 
                                    : 'Logs will appear here in real-time as events occur.'}
                            </p>
                            <span className="cursor">_</span>
                        </div>
                    )}

                    {filteredLogs.map((log, idx) => (
                        <motion.div
                            key={idx}
                            className={`log-line log-${log.type}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {getLogIcon(log.type)}
                            <span className="log-text">{log.text}</span>
                        </motion.div>
                    ))}

                    {error && (
                        <div className="log-error">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}
                    <div ref={logsEndRef} />
                </div>
            </Card>
        </div>
    );
}

export default LiveLogsPage;

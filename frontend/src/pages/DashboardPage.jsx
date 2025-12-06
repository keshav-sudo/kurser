import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitBranch, Star, Activity, Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, Server, Pause } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import './DashboardPage.css';

const Sparkline = ({ color, data }) => (
    <div className="sparkline">
        {data.map((h, i) => (
            <motion.div
                key={i}
                className="spark-bar"
                style={{ height: `${h}%`, backgroundColor: color }}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
            />
        ))}
    </div>
);

const DashboardPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);
    const stats = [
        {
            label: 'Total Repositories',
            value: '12',
            icon: GitBranch,
            color: '#3b82f6',
            trend: '+2',
            trendUp: true,
            data: [30, 40, 35, 50, 45, 60, 70, 65, 80, 75]
        },
        {
            label: 'Active Webhooks',
            value: '5',
            icon: Activity,
            color: '#10b981',
            trend: 'Stable',
            trendUp: true,
            data: [50, 50, 50, 50, 60, 60, 60, 60, 60, 60]
        },
        {
            label: 'Total Stars',
            value: '128',
            icon: Star,
            color: '#f59e0b',
            trend: '+15%',
            trendUp: true,
            data: [20, 25, 30, 28, 35, 40, 45, 50, 55, 60]
        },
        {
            label: 'Avg. Build Time',
            value: '45s',
            icon: Clock,
            color: '#8b5cf6',
            trend: '-5s',
            trendUp: true, // Good thing
            data: [80, 75, 70, 65, 60, 55, 50, 48, 46, 45]
        },
    ];

    const deployments = [
        { name: 'frontend-main', status: 'running', id: 'dep-8x92m', time: '2m ago', branch: 'main' },
        { name: 'api-server', status: 'running', id: 'dep-7k39p', time: '15m ago', branch: 'prod' },
        { name: 'worker-service', status: 'failed', id: 'dep-2j91x', time: '1h ago', branch: 'feat/queue' },
        { name: 'redis-cache', status: 'stopped', id: 'dep-5m22q', time: '3h ago', branch: 'main' },
    ];

    return (
        <div className="dashboard-container">
            <div className="dashboard-bg-glow"></div>

            <header className="dashboard-header">
                <div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-gradient"
                    >
                        Dashboard
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        Overview of your repositories and deployments
                    </motion.p>
                </div>
                <Button variant="primary" className="new-repo-btn glow-effect">
                    <Plus size={18} />
                    <span>Add Repository</span>
                </Button>
            </header>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <Card key={index} delay={index * 0.1} className="stat-card ultra-card">
                        <div className="stat-header">
                            <div className="stat-icon-wrapper" style={{ '--icon-color': stat.color }}>
                                <stat.icon size={20} color={stat.color} />
                            </div>
                            <div className={`stat-trend ${stat.trendUp ? 'trend-up' : 'trend-down'}`}>
                                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.trend}
                            </div>
                        </div>
                        <div className="stat-body">
                            <h3>{stat.value}</h3>
                            <p>{stat.label}</p>
                        </div>
                        <Sparkline color={stat.color} data={stat.data} />
                    </Card>
                ))}
            </div>

            <div className="content-grid">
                <Card className="recent-activity-card ultra-card" delay={0.3}>
                    <div className="card-header-row">
                        <h2>Recent Activity</h2>
                        <Button variant="secondary" className="btn-xs">View All</Button>
                    </div>
                    <div className="activity-list">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="activity-item">
                                <div className="activity-timeline">
                                    <div className="timeline-line"></div>
                                    <div className="timeline-dot"></div>
                                </div>
                                <div className="activity-content">
                                    <div className="activity-header">
                                        <h4>Deployed frontend-app</h4>
                                        <span className="time">2m ago</span>
                                    </div>
                                    <p>Commit: <span className="mono">8f92a1</span> - Fix login bug</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="deployments-card ultra-card" delay={0.4}>
                    <div className="card-header-row">
                        <h2>Active Deployments</h2>
                        <Server size={18} className="text-muted" />
                    </div>
                    <div className="deployment-list">
                        {deployments.map((dep, i) => (
                            <motion.div
                                key={i}
                                className="deployment-item"
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            >
                                <div className="deployment-info">
                                    <div className="deployment-name">
                                        {dep.name}
                                        <span className="deployment-branch">{dep.branch}</span>
                                    </div>
                                    <div className="deployment-meta">
                                        <span className="mono">{dep.id}</span> • {dep.time}
                                    </div>
                                </div>
                                <div className={`deployment-status-pill ${dep.status}`}>
                                    {dep.status === 'running' && <CheckCircle size={12} />}
                                    {dep.status === 'failed' && <XCircle size={12} />}
                                    {dep.status === 'stopped' && <Pause size={12} />}
                                    <span>{dep.status}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;

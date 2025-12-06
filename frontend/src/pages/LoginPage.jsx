import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, ArrowRight } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import './LoginPage.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const LoginPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // If user is already logged in, redirect to dashboard
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleLogin = () => {
        window.location.href = `${API_BASE}/auth/github`;
    };

    return (
        <div className="login-container-split">
            <motion.div
                className="login-brand-section"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="brand-content">
                    <motion.div
                        className="brand-logo"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <div className="logo-circle"></div>
                    </motion.div>
                    <h1>Kurser</h1>
                    <p>Next-generation GitHub Repository Management</p>
                    <div className="brand-features">
                        <div className="feature-item">🚀 Automated Deployments</div>
                        <div className="feature-item">⚡ Real-time Logs</div>
                        <div className="feature-item">🛡️ Secure Webhooks</div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="login-form-section"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <Card className="login-card">
                    <div className="login-header">
                        <h2>Welcome Back</h2>
                        <p>Sign in to continue to your dashboard</p>
                    </div>

                    <div className="login-actions">
                        <Button
                            variant="primary"
                            onClick={handleLogin}
                            className="github-login-btn"
                        >
                            <Github size={20} />
                            <span>Continue with GitHub</span>
                            <ArrowRight size={16} className="arrow-icon" />
                        </Button>
                    </div>

                    <div className="login-footer">
                        <p>By clicking continue, you agree to our Terms of Service and Privacy Policy.</p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default LoginPage;

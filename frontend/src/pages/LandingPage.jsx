import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Github, Zap, Shield, GitBranch, Globe, Server, CheckCircle } from 'lucide-react';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    useEffect(() => {
        // Check if there's a token in the URL (OAuth callback)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        if (urlToken) {
            localStorage.setItem('token', urlToken);
            // Redirect to dashboard after successful login
            navigate('/dashboard', { replace: true });
            return;
        }

        // Check if user is already logged in
        const existingToken = localStorage.getItem('token');
        if (existingToken) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleGetStarted = () => {
        navigate('/login');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const steps = [
        {
            icon: Github,
            title: "Connect GitHub",
            desc: "Link your GitHub account with a single click. We automatically fetch your repositories."
        },
        {
            icon: GitBranch,
            title: "Select Repository",
            desc: "Choose the project you want to deploy. We detect the framework automatically."
        },
        {
            icon: Globe,
            title: "Auto Deploy",
            desc: "Push a commit and watch it go live instantly. Free unlimited hosting forever."
        }
    ];

    return (
        <div className="landing-page">
            <div className="landing-background">
                <div className="gradient-orb orb-1"></div>
                <div className="gradient-orb orb-2"></div>
                <div className="grid-overlay"></div>
            </div>

            <nav className="landing-nav">
                <div className="nav-logo">
                    <div className="logo-icon-small"></div>
                    <span>Kurser</span>
                </div>
                <div className="nav-links">
                    <a href="#how-it-works">How it Works</a>
                    <a href="#features">Features</a>
                    <Button variant="secondary" onClick={handleGetStarted} className="nav-btn">Sign In</Button>
                </div>
            </nav>

            <main className="landing-hero">
                <motion.div
                    className="hero-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants} className="hero-badge">
                        <span>🚀 Free Unlimited Web Hosting</span>
                    </motion.div>

                    <motion.h1 variants={itemVariants}>
                        Auto Deploy with <br />
                        <span className="text-gradient">Single Commit.</span>
                    </motion.h1>

                    <motion.p variants={itemVariants}>
                        Experience the easiest deployment workflow.
                        Simply push to GitHub and your site is live.
                        <strong>Unlimited bandwidth. Zero cost.</strong>
                    </motion.p>

                    <motion.div variants={itemVariants} className="hero-actions">
                        <Button variant="primary" onClick={handleGetStarted} className="cta-btn glow-effect">
                            Start Deploying Now <ArrowRight size={18} />
                        </Button>
                        <Button variant="secondary" className="github-btn">
                            <Github size={18} /> Star on GitHub
                        </Button>
                    </motion.div>

                    <motion.div variants={itemVariants} className="hero-stats">
                        <div className="stat-item">
                            <strong>Free</strong>
                            <span>Forever Plan</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <strong>1-Click</strong>
                            <span>Deployment</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <strong>∞</strong>
                            <span>Unlimited Host</span>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    className="hero-visual"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ y }}
                >
                    <div className="visual-card-stack">
                        <Card className="visual-card card-main">
                            <div className="card-header">
                                <div className="dots">
                                    <span></span><span></span><span></span>
                                </div>
                                <div className="bar"></div>
                            </div>
                            <div className="card-body">
                                <div className="code-block">
                                    <div className="code-line"><span className="c-blue">git</span> add .</div>
                                    <div className="code-line"><span className="c-blue">git</span> commit -m <span className="c-green">"feat: new landing page"</span></div>
                                    <div className="code-line"><span className="c-blue">git</span> push origin main</div>
                                    <div className="code-line loading">
                                        <span>Building...</span>
                                        <div className="spinner"></div>
                                    </div>
                                    <div className="code-line success">
                                        <CheckCircle size={14} /> <span>Deployed Successfully!</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <motion.div
                            className="floating-badge badge-1"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Zap size={20} color="#fbbf24" />
                            <span>Instant Live</span>
                        </motion.div>
                        <motion.div
                            className="floating-badge badge-2"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        >
                            <Server size={20} color="#3b82f6" />
                            <span>Auto Scaling</span>
                        </motion.div>
                    </div>
                </motion.div>
            </main>

            <section id="how-it-works" className="how-it-works-section">
                <motion.div
                    className="section-header"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>How It Works</h2>
                    <p>From localhost to production in seconds.</p>
                </motion.div>

                <div className="steps-grid">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="step-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                        >
                            <div className="step-number">{index + 1}</div>
                            <div className="step-icon">
                                <step.icon size={32} />
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.desc}</p>
                            {index < steps.length - 1 && <div className="step-connector"></div>}
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default LandingPage;

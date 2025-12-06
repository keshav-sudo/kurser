import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, Terminal, LogOut, Github } from 'lucide-react';
import { motion } from 'framer-motion';
import './Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Github, label: 'Repositories', path: '/repositories' },
        { icon: Terminal, label: 'Live Logs', path: '/logs' },
        { icon: Home, label: 'Old View', path: '/home' },
    ];

    return (
        <motion.div
            className="sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
        >
            <div className="sidebar-header">
                <Github size={32} className="logo-icon" />
                <span className="logo-text">Kurser</span>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </motion.div>
    );
};

export default Sidebar;

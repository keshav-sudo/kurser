import React from 'react';
import Sidebar from './Sidebar.jsx';
import NatureDecoration from './NatureDecoration.jsx';
import { motion } from 'framer-motion';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Sidebar />
            <NatureDecoration />
            <main className="main-content">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="page-container"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
};

export default Layout;

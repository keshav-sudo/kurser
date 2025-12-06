import React from 'react';
import { motion } from 'framer-motion';
import './StatsCard.css';

const StatsCard = ({ value, metric, icon: Icon, trend, color = '#3ED6C3', delay = 0 }) => {
    return (
        <motion.div
            className="stats-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
            <div className="stats-card-content">
                {Icon && (
                    <div className="stats-icon" style={{ color }}>
                        <Icon size={20} />
                    </div>
                )}
                <div className="stats-value" style={{ color }}>{value}</div>
                <div className="stats-metric">{metric}</div>
                {trend && (
                    <div className={`stats-trend ${trend.startsWith('+') || trend.startsWith('-') ? 'trend-up' : ''}`}>
                        {trend}
                    </div>
                )}
            </div>
            <div className="stats-glow" style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }}></div>
        </motion.div>
    );
};

export default StatsCard;

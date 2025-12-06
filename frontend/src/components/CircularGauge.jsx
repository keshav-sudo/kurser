import React from 'react';
import './CircularGauge.css';

const CircularGauge = ({ value, maxValue = 100, size = 120, strokeWidth = 12, color = '#FF8D32', label = '' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = (value / maxValue) * 100;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="circular-gauge-container">
            <svg width={size} height={size} className="circular-gauge">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth={strokeWidth}
                />
                
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        filter: `drop-shadow(0 0 8px ${color}40)`,
                        transition: 'stroke-dashoffset 1.5s ease-in-out'
                    }}
                />

                {/* Center text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy="0.3em"
                    className="gauge-value"
                    fill="#fff"
                    fontSize={size * 0.25}
                    fontWeight="700"
                >
                    {Math.round(percentage)}%
                </text>
            </svg>
            {label && <div className="gauge-label">{label}</div>}
        </div>
    );
};

export default CircularGauge;

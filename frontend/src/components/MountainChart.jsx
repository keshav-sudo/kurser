import React, { useMemo } from 'react';
import './MountainChart.css';

// Default sample data
const DEFAULT_DATA = [
    Array.from({ length: 50 }, (_, i) => Math.sin(i / 5) * 30 + 50 + (i % 7) * 5),
    Array.from({ length: 50 }, (_, i) => Math.cos(i / 6) * 25 + 55 + (i % 5) * 4),
    Array.from({ length: 50 }, (_, i) => Math.sin(i / 4) * 20 + 60 + (i % 3) * 3),
];

const MountainChart = ({ 
    data = [], 
    height = 200, 
    colors = ['#3ED6C3', '#4DD9E8', '#FF8D32'], 
    title = 'Analytics Overview' 
}) => {
    // Generate sample data if none provided
    const chartData = useMemo(() => 
        data.length > 0 ? data : DEFAULT_DATA,
        [data]
    );

    const generatePath = (points, smoothing = 0.2) => {
        if (points.length < 2) return '';
        
        const line = (pointA, pointB) => {
            const lengthX = pointB[0] - pointA[0];
            const lengthY = pointB[1] - pointA[1];
            return {
                length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
                angle: Math.atan2(lengthY, lengthX)
            };
        };

        const controlPoint = (current, previous, next, reverse) => {
            const p = previous || current;
            const n = next || current;
            const o = line(p, n);
            const angle = o.angle + (reverse ? Math.PI : 0);
            const length = o.length * smoothing;
            const x = current[0] + Math.cos(angle) * length;
            const y = current[1] + Math.sin(angle) * length;
            return [x, y];
        };

        const bezierCommand = (point, i, a) => {
            const cps = controlPoint(a[i - 1], a[i - 2], point);
            const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
            return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
        };

        return points.reduce((acc, point, i, a) => 
            i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${bezierCommand(point, i, a)}`, ''
        );
    };

    const viewBoxWidth = 1000;
    const viewBoxHeight = height;
    const padding = 20;

    return (
        <div className="mountain-chart-container">
            {title && <h3 className="chart-title">{title}</h3>}
            <svg 
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} 
                className="mountain-chart"
                preserveAspectRatio="none"
            >
                <defs>
                    {chartData.map((_, index) => (
                        <linearGradient 
                            key={`gradient-${index}`} 
                            id={`mountainGradient-${index}`} 
                            x1="0%" 
                            y1="0%" 
                            x2="0%" 
                            y2="100%"
                        >
                            <stop offset="0%" stopColor={colors[index]} stopOpacity="0.6" />
                            <stop offset="50%" stopColor={colors[index]} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={colors[index]} stopOpacity="0.05" />
                        </linearGradient>
                    ))}
                </defs>

                {chartData.map((dataSet, index) => {
                    const points = dataSet.map((value, i) => [
                        (i / (dataSet.length - 1)) * (viewBoxWidth - 2 * padding) + padding,
                        viewBoxHeight - (value / 100) * (viewBoxHeight - 2 * padding) - padding
                    ]);

                    const pathData = generatePath(points, 0.3);
                    const areaPath = `${pathData} L ${viewBoxWidth - padding},${viewBoxHeight} L ${padding},${viewBoxHeight} Z`;

                    return (
                        <g key={index} className={`mountain-layer mountain-layer-${index}`}>
                            {/* Area fill */}
                            <path
                                d={areaPath}
                                fill={`url(#mountainGradient-${index})`}
                                className="mountain-area"
                                style={{ animationDelay: `${index * 0.2}s` }}
                            />
                            {/* Line stroke */}
                            <path
                                d={pathData}
                                fill="none"
                                stroke={colors[index]}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mountain-line"
                                style={{
                                    filter: `drop-shadow(0 0 8px ${colors[index]}60)`,
                                    animationDelay: `${index * 0.2}s`
                                }}
                            />
                            {/* Glow peaks */}
                            {points.filter((_, i) => i % 10 === 0).map((point, i) => (
                                <circle
                                    key={`peak-${index}-${i}`}
                                    cx={point[0]}
                                    cy={point[1]}
                                    r="3"
                                    fill={colors[index]}
                                    className="mountain-peak"
                                    style={{
                                        filter: `drop-shadow(0 0 6px ${colors[index]})`,
                                        animationDelay: `${index * 0.2 + i * 0.1}s`
                                    }}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export default MountainChart;

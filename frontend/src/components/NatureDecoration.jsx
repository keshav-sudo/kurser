import React from 'react';
import './NatureDecoration.css';

const NatureDecoration = () => {
    return (
        <div className="nature-decoration">
            <svg className="forest-silhouette" viewBox="0 0 800 400" preserveAspectRatio="xMaxYMax slice">
                <defs>
                    <linearGradient id="treeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1C1F25" stopOpacity="0" />
                        <stop offset="50%" stopColor="#1C1F25" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#1C1F25" stopOpacity="0.6" />
                    </linearGradient>
                    
                    <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>

                {/* Mountain silhouette */}
                <path 
                    d="M0,350 L100,250 L200,280 L300,200 L450,240 L600,180 L800,250 L800,400 L0,400 Z"
                    fill="url(#treeGradient)"
                    opacity="0.15"
                />

                {/* Forest trees */}
                <g className="trees">
                    {/* Tree 1 */}
                    <path 
                        d="M650,320 L640,350 L660,350 Z M650,300 L638,335 L662,335 Z M650,280 L635,320 L665,320 Z"
                        fill="#2A3038"
                        opacity="0.4"
                    />
                    
                    {/* Tree 2 */}
                    <path 
                        d="M700,340 L690,370 L710,370 Z M700,320 L688,355 L712,355 Z M700,300 L685,340 L715,340 Z"
                        fill="#2A3038"
                        opacity="0.5"
                    />
                    
                    {/* Tree 3 */}
                    <path 
                        d="M750,330 L740,360 L760,360 Z M750,310 L738,345 L762,345 Z M750,290 L735,330 L765,330 Z"
                        fill="#2A3038"
                        opacity="0.3"
                    />
                </g>

                {/* Glowing light bars */}
                <g className="light-bars">
                    <rect x="680" y="280" width="4" height="60" fill="#FF8D32" opacity="0.3" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
                    </rect>
                    <rect x="720" y="300" width="4" height="50" fill="#FF8D32" opacity="0.25" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.15;0.4;0.15" dur="4s" repeatCount="indefinite" />
                    </rect>
                    <rect x="760" y="270" width="4" height="70" fill="#3ED6C3" opacity="0.3" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3.5s" repeatCount="indefinite" />
                    </rect>
                </g>

                {/* Floating particles */}
                <g className="particles">
                    <circle cx="670" cy="250" r="2" fill="#4DD9E8" opacity="0.6">
                        <animate attributeName="cy" values="250;230;250" dur="5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="730" cy="270" r="1.5" fill="#FF8D32" opacity="0.5">
                        <animate attributeName="cy" values="270;250;270" dur="6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0.7;0.2" dur="6s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="690" cy="230" r="1" fill="#3ED6C3" opacity="0.4">
                        <animate attributeName="cy" values="230;210;230" dur="4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="4s" repeatCount="indefinite" />
                    </circle>
                </g>
            </svg>
        </div>
    );
};

export default NatureDecoration;

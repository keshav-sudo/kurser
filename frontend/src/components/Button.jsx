import React from 'react';

import '../styles/variables.css';
import './Button.css';

/**
 * Reusable button component that uses CSS variables for theming.
 * Props:
 *  - variant: 'primary' | 'secondary' | 'danger' (default: 'primary')
 *  - onClick: click handler
 *  - children: button label/content
 *  - className: additional classes
 */
export default function Button({ variant = 'primary', onClick, children, className = '' }) {
    const variantClass = `btn-${variant}`;
    return (
        <button className={`btn ${variantClass} ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}

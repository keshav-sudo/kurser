import React, { useState } from 'react';
import './Input.css';

const Input = ({ label, type = 'text', value, onChange, placeholder = '', className = '' }) => {
    const [focused, setFocused] = useState(false);

    return (
        <div className={`input-container ${focused || value ? 'focused' : ''} ${className}`}>
            <label className="input-label">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="input-field"
                placeholder={focused ? placeholder : ''}
            />
            <div className="input-highlight"></div>
        </div>
    );
};

export default Input;


import React from 'react';
import '../styles/theme.css';

interface ThemeToggleProps {
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme }) => {
    return (
        <div className="theme-toggle">
            <label>
                <input type="checkbox" onChange={toggleTheme} />
                Toggle Theme
            </label>
        </div>
    );
};

export default ThemeToggle;
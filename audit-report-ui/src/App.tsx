import React, { useState, useEffect } from 'react';
import DragAndDrop from './components/DragAndDrop';
import TableDisplay from './components/TableDisplay';
import ExportButton from './components/ExportButton';
import ThemeToggle from './components/ThemeToggle';
import './styles/theme.css';

const App: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

    const handleDataChange = (newData: any[]) => {
        setData(newData);
    };

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
    };

    // Prevent default browser drag/drop for the whole window
    useEffect(() => {
        const prevent = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener('dragover', prevent);
        window.addEventListener('drop', prevent);
        return () => {
            window.removeEventListener('dragover', prevent);
            window.removeEventListener('drop', prevent);
        };
    }, []);

    return (
        <div className={isDarkTheme ? 'black-theme' : 'white-theme'}>
            <div className="container">
                <ThemeToggle toggleTheme={toggleTheme} />
                <DragAndDrop onFileDrop={handleDataChange} />
                <TableDisplay data={data} />
                <ExportButton data={data} />
            </div>
        </div>
    );
};

export default App;
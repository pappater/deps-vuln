import React, { useState } from 'react';
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

    return (
        <div className={isDarkTheme ? 'dark-theme' : 'light-theme'}>
            <ThemeToggle toggleTheme={toggleTheme} />
            <DragAndDrop onFileDrop={handleDataChange} />
            <TableDisplay data={data} />
            <ExportButton data={data} />
        </div>
    );
};

export default App;
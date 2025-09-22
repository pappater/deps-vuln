import React, { useState } from 'react';

const DragAndDrop: React.FC<{ onFileDrop: (data: any) => void }> = ({ onFileDrop }) => {
    const [dragging, setDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result;
                if (text) {
                    const parsedData = parseCSV(String(text));
                    onFileDrop(parsedData);
                }
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (text: string) => {
        const rows = text.split('\n').map(row => row.split(','));
        return rows;
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                border: dragging ? '2px dashed #000' : '2px solid #ccc',
                padding: '20px',
                textAlign: 'center',
                transition: 'border 0.3s',
            }}
        >
            {dragging ? 'Release to drop the file' : 'Drag and drop your audit report here'}
        </div>
    );
};

export default DragAndDrop;
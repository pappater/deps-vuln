import React from 'react';

interface ExportButtonProps {
    data: any[]; // Replace 'any' with the appropriate type for your data
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
    const handleExport = () => {
        const csvContent = data.map(row => Object.values(row).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "audit_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button onClick={handleExport}>
            Export as CSV
        </button>
    );
};

export default ExportButton;
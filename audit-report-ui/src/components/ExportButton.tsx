import React from 'react';

interface ExportButtonProps {
    data: any[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
    const handleExport = () => {
        if (!data || data.length === 0) {
            alert('No data available to export');
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(",")];
        
        for (const row of data) {
            csvRows.push(headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(","));
        }
        
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "audit_report.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
    };

    return (
        <button 
            className="button" 
            onClick={handleExport}
            disabled={!data || data.length === 0}
            style={{ 
                marginTop: 16,
                opacity: (!data || data.length === 0) ? 0.5 : 1,
                cursor: (!data || data.length === 0) ? 'not-allowed' : 'pointer'
            }}
        >
            Export as CSV
        </button>
    );
};

export default ExportButton;
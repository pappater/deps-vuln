import React from 'react';

interface ExportButtonProps {
    data: any[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
    const handleExport = () => {
        if (!data || data.length === 0) return;
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
    };

    return (
        <button className="button" onClick={handleExport}>
            Export as CSV
        </button>
    );
};

export default ExportButton;
import React from 'react';

interface ExportButtonProps {
    data: any[]; // Replace 'any' with the appropriate type for your data
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {

    const handleExport = () => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
<<<<<<< HEAD
        const escape = (val: string) => '"' + String(val).replace(/"/g, '""') + '"';
        const csvRows = [headers.map(escape).join(",")];
        data.forEach(row => {
            csvRows.push(headers.map(h => escape(row[h] ?? "")).join(","));
        });
=======
        const csvRows = [headers.join(",")];
        for (const row of data) {
            csvRows.push(headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(","));
        }
>>>>>>> e984a44 (UI: Improved table styling, added CSV export, and more columns for vulnerable packages report)
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
    };

    return (
        <button className="button" onClick={handleExport}>
            Export as CSV
        </button>
    );
};

export default ExportButton;
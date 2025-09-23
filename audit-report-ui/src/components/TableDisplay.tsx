import React from 'react';

interface TableDisplayProps {
    data: Array<Record<string, any>>;
}

const columnOrder = [
    'package',
    'version',
    'parentChain',
    'severity',
    'url',
];

const columnLabels: Record<string, string> = {
    package: 'Vulnerable Package',
    version: 'Current Version',
    parentChain: 'Parent Chain',
    severity: 'Severity',
    url: 'Advisory URL',
};

const TableDisplay: React.FC<TableDisplayProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div style={{marginTop: 20, color: '#888'}}>No data available</div>;
    }

    // Only show columns that exist in the data
    const headers = columnOrder.filter(col => data.some(row => row[col] !== undefined));

    return (
        <div style={{overflowX: 'auto', marginTop: 20}}>
            <table style={{borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001'}}>
                <thead>
                    <tr style={{background: '#222', color: '#fff'}}>
                        {headers.map((header) => (
                            <th key={header} style={{padding: '8px 12px', border: '1px solid #ddd'}}>{columnLabels[header] || header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} style={{background: rowIndex % 2 === 0 ? '#f9f9f9' : '#fff'}}>
                            {headers.map((header) => (
                                <td key={header} style={{padding: '8px 12px', border: '1px solid #eee', wordBreak: 'break-all'}}>
                                    {header === 'url' && row[header] ? (
                                        <a href={row[header]} target="_blank" rel="noopener noreferrer">Advisory</a>
                                    ) : row[header]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TableDisplay;

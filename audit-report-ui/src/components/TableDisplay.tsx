import React from 'react';

interface TableDisplayProps {
    data: Array<Record<string, any>>;
}

const TableDisplay: React.FC<TableDisplayProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return <div>No data available</div>;
    }

    const headers = Object.keys(data[0]);

    return (
        <div>
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => (
                            <th key={header}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map((header) => (
                                <td key={header}>{row[header]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableDisplay;

import React, { useState } from 'react';

const DragAndDrop: React.FC<{ onFileDrop: (data: any) => void }> = ({ onFileDrop }) => {
    const [dragging, setDragging] = useState(false);


    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
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
                if (!text) return;
                // If file is JSON, parse and extract vulnerabilities
                if (file.name.endsWith('.json')) {
                    try {
                        const json = JSON.parse(String(text));
                        const tableData = extractVulnTableFromAuditJson(json);
                        onFileDrop(tableData);
                        return;
                    } catch (err) {
                        // fallback to CSV parsing
                    }
                }
                // Otherwise, treat as CSV
                const parsedData = parseCSVToObjects(String(text));
                onFileDrop(parsedData);
            };
            reader.readAsText(file);
        }
    };

    // Extract vulnerabilities from npm-audit.json to table format
    const extractVulnTableFromAuditJson = (auditJson: any) => {
        // Try to use dependency tree if available (npm v7+)
        const getParentChain = (pkg: string, tree: any): string => {
            // Recursively search for the package in the tree and build the parent chain
            const search = (node: any, path: string[]): string | null => {
                if (!node || !node.dependencies) return null;
                for (const [depName, depInfo] of Object.entries(node.dependencies)) {
                    const newPath = [...path, depName];
                    if (depName === pkg) {
                        return newPath.join(' -> ');
                    }
                    const found = search(depInfo, newPath);
                    if (found) return found;
                }
                return null;
            };
            if (auditJson.dependencies) {
                return search({ dependencies: auditJson.dependencies }, ['root']) || '';
            }
            return '';
        };

        let rows: any[] = [];
        if (auditJson.advisories) {
            // npm v6 style
            rows = Object.values(auditJson.advisories).map((a: any) => ({
                'Vulnerable Package': a.module_name || '',
                'Version': a.findings && a.findings[0] ? a.findings[0].version : '',
                'Parent Chain': getParentChain(a.module_name, auditJson),
                'Severity': a.severity || '',
                'Advisory URL': a.url || (a.cves && a.cves.length ? a.cves[0] : '')
            }));
        } else if (auditJson.vulnerabilities) {
            // npm v7+ style
            rows = Object.entries(auditJson.vulnerabilities).map(([pkg, v]: [string, any]) => ({
                'Vulnerable Package': pkg,
                'Version': v.version || (auditJson.dependencies && auditJson.dependencies[pkg] && auditJson.dependencies[pkg].version) || '',
                'Parent Chain': getParentChain(pkg, auditJson),
                'Severity': v.severity || '',
                'Advisory URL': (Array.isArray(v.via) && v.via.length && v.via[0].url) ? v.via[0].url : ''
            }));
        }
        return rows;
    };

    // Parse CSV to array of objects with header keys
    const parseCSVToObjects = (csv: string) => {
        // Split by newlines, filter out empty lines
        const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) return [];
        // Use regex to split by comma, respecting quoted values
        const parseLine = (line: string) => {
            const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^",]+)|)(?:,|$)/g;
            const result = [];
            let match;
            while ((match = regex.exec(line)) !== null) {
                let value = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2] || '';
                result.push(value);
            }
            // Remove last empty element if line ends with comma
            if (result.length && result[result.length - 1] === "") result.pop();
            return result;
        };
        const headers = parseLine(lines[0]);
        const data = lines.slice(1).map(line => {
            const values = parseLine(line);
            const obj: Record<string, string> = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] || '';
            });
            return obj;
        });
        return data;
    };

    return (
        <div
            onDragEnter={handleDragEnter}
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
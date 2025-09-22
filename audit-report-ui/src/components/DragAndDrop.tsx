import React, { useState } from 'react';
import { fetchLatestVersion } from '../utils/npmApi';

const DragAndDrop: React.FC<{ onFileDrop: (data: any) => void }> = ({ onFileDrop }) => {
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<string>("");

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

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

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            let auditJson: any = null;
            let lsJson: any = null;
            let auditFileName = "";
            let lsFileName = "";
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const text = await file.text();
                try {
                    const json = JSON.parse(text);
                    if (json.vulnerabilities || json.advisories) {
                        auditJson = json;
                        auditFileName = file.name;
                    } else if (json.dependencies) {
                        lsJson = json;
                        lsFileName = file.name;
                    }
                } catch {}
            }
            // Debug logging
            console.log("Detected files:", { auditFileName, lsFileName });
            if (auditJson && lsJson) {
                setStatus("");
                const tableData = await processVulnData(auditJson, lsJson);
                console.log("Extracted vulnerable table data:", tableData);
                if (tableData.length === 0) {
                    setStatus("No vulnerable packages found in the provided files.");
                } else {
                    setStatus("");
                }
                onFileDrop(tableData);
            } else {
                let msg = "";
                if (!auditJson && !lsJson) {
                    msg = "Neither npm-audit.json nor npm-ls.json detected. Please drop both files.";
                } else if (!auditJson) {
                    msg = `Missing npm-audit.json. Detected: ${lsFileName || "none"}`;
                } else if (!lsJson) {
                    msg = `Missing npm-ls.json. Detected: ${auditFileName || "none"}`;
                }
                setStatus(msg);
                onFileDrop([]);
            }
        }
    };

    // Extract vulnerable packages from audit JSON
    function extractVulnerablePackages(auditJson: any): Set<string> {
        const names = new Set<string>();
        if (auditJson.advisories && typeof auditJson.advisories === 'object') {
            Object.values<any>(auditJson.advisories).forEach((a) => {
                if (a.module_name) names.add(a.module_name);
            });
        }
        if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
            Object.keys(auditJson.vulnerabilities).forEach((k) => names.add(k));
        }
        if (Array.isArray(auditJson) && auditJson.length > 0) {
            auditJson.forEach((it) => {
                if (it.module_name) names.add(it.module_name);
                if (it.package) names.add(it.package);
            });
        }
        return names;
    }

    // Build map of vuln details
    function buildVulnDetailsMap(auditJson: any) {
        const map: Record<string, { severity: string; url: string }> = {};
        if (auditJson.advisories && typeof auditJson.advisories === 'object') {
            Object.values<any>(auditJson.advisories).forEach((a) => {
                if (a.module_name) {
                    map[a.module_name] = {
                        severity: a.severity || '',
                        url: a.url || (a.cves && a.cves.length ? a.cves[0] : ''),
                    };
                }
            });
        }
        if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
            Object.entries<any>(auditJson.vulnerabilities).forEach(([pkg, v]) => {
                let url = '';
                if (v.via && Array.isArray(v.via) && v.via.length > 0) {
                    const first = v.via.find((x: any) => typeof x === 'object' && x.url);
                    if (first) url = first.url;
                }
                map[pkg] = {
                    severity: v.severity || '',
                    url: url,
                };
            });
        }
        return map;
    }

    // Find parent chains for vulnerable packages
    function findParentChains(tree: any, vulnerableSet: Set<string>, vulnDetailsMap: any) {
        const results: any[] = [];
        function recurse(node: any, path: string[]) {
            if (!node || !node.dependencies) return;
            for (const [depName, depInfo] of Object.entries<any>(node.dependencies)) {
                const newPath = [...path, depName];
                const parentChain = newPath.slice(1).join(' -> ');
                if (vulnerableSet.has(depName)) {
                    const details = vulnDetailsMap[depName] || {};
                    results.push({
                        package: depName,
                        version: depInfo.version || '',
                        parentChain: parentChain,
                        severity: details.severity || '',
                        url: details.url || '',
                    });
                }
                recurse(depInfo, newPath);
            }
        }
        recurse(tree, [tree.name || 'root']);
        return results;
    }

    // Main processing function
    async function processVulnData(auditJson: any, lsJson: any) {
        const vulnerable = Array.from(extractVulnerablePackages(auditJson));
        if (vulnerable.length === 0) return [];
        const vulnSet = new Set(vulnerable);
        const vulnDetailsMap = buildVulnDetailsMap(auditJson);
        const results = findParentChains(lsJson, vulnSet, vulnDetailsMap);
        // Remove duplicates: only one row per unique package@version
        const uniqKey = new Set();
        const uniqResults: any[] = [];
        for (const r of results) {
            const key = `${r.package}@${r.version}`;
            if (!uniqKey.has(key)) {
                uniqKey.add(key);
                uniqResults.push(r);
            }
        }
        // Fetch latest version for each vulnerable package
        for (const row of uniqResults) {
            row.latestVersion = await fetchLatestVersion(row.package);
        }
        return uniqResults;
    }

    return (
        <div>
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
                {dragging ? 'Release to drop the files' : 'Drag and drop your npm-audit.json and npm-ls.json files here'}
            </div>
            {status && <div style={{ color: 'red', marginTop: 10 }}>{status}</div>}
        </div>
    );
};

export default DragAndDrop;

import React, { useState } from 'react';
import { fetchLatestVersion } from '../utils/npmApi';

const DragAndDrop: React.FC<{ onFileDrop: (data: any) => void }> = ({ onFileDrop }) => {
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<string>("");


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

<<<<<<< HEAD


    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
=======
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
>>>>>>> e984a44 (UI: Improved table styling, added CSV export, and more columns for vulnerable packages report)
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
<<<<<<< HEAD
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
=======
            let auditJson: any = null;
            let lsJson: any = null;
            let auditFileName = "";
            let lsFileName = "";
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const text = await file.text();
                try {
                    const json = JSON.parse(text);
                    if (json.vulnerabilities || json.advisories) {
                        auditJson = json;
                        auditFileName = file.name;
                    } else if (json.dependencies) {
                        lsJson = json;
                        lsFileName = file.name;
                    }
                } catch {}
            }
            // Debug logging
            console.log("Detected files:", { auditFileName, lsFileName });
            if (auditJson && lsJson) {
                setStatus("");
                const tableData = await processVulnData(auditJson, lsJson);
                console.log("Extracted vulnerable table data:", tableData);
                if (tableData.length === 0) {
                    setStatus("No vulnerable packages found in the provided files.");
                } else {
                    setStatus("");
                }
                onFileDrop(tableData);
            } else {
                let msg = "";
                if (!auditJson && !lsJson) {
                    msg = "Neither npm-audit.json nor npm-ls.json detected. Please drop both files.";
                } else if (!auditJson) {
                    msg = `Missing npm-audit.json. Detected: ${lsFileName || "none"}`;
                } else if (!lsJson) {
                    msg = `Missing npm-ls.json. Detected: ${auditFileName || "none"}`;
                }
                setStatus(msg);
                onFileDrop([]);
            }
        }
    };

    // Extract vulnerable packages from audit JSON
    function extractVulnerablePackages(auditJson: any): Set<string> {
        const names = new Set<string>();
        if (auditJson.advisories && typeof auditJson.advisories === 'object') {
            Object.values<any>(auditJson.advisories).forEach((a) => {
                if (a.module_name) names.add(a.module_name);
            });
        }
        if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
            Object.keys(auditJson.vulnerabilities).forEach((k) => names.add(k));
        }
        if (Array.isArray(auditJson) && auditJson.length > 0) {
            auditJson.forEach((it) => {
                if (it.module_name) names.add(it.module_name);
                if (it.package) names.add(it.package);
            });
        }
        return names;
    }

    // Build map of vuln details
    function buildVulnDetailsMap(auditJson: any) {
        const map: Record<string, { severity: string; url: string }> = {};
        if (auditJson.advisories && typeof auditJson.advisories === 'object') {
            Object.values<any>(auditJson.advisories).forEach((a) => {
                if (a.module_name) {
                    map[a.module_name] = {
                        severity: a.severity || '',
                        url: a.url || (a.cves && a.cves.length ? a.cves[0] : ''),
                    };
                }
            });
        }
        if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === 'object') {
            Object.entries<any>(auditJson.vulnerabilities).forEach(([pkg, v]) => {
                let url = '';
                if (v.via && Array.isArray(v.via) && v.via.length > 0) {
                    const first = v.via.find((x: any) => typeof x === 'object' && x.url);
                    if (first) url = first.url;
                }
                map[pkg] = {
                    severity: v.severity || '',
                    url: url,
                };
            });
        }
        return map;
    }

    // Find parent chains for vulnerable packages
    function findParentChains(tree: any, vulnerableSet: Set<string>, vulnDetailsMap: any) {
        const results: any[] = [];
        function recurse(node: any, path: string[]) {
            if (!node || !node.dependencies) return;
            for (const [depName, depInfo] of Object.entries<any>(node.dependencies)) {
                const newPath = [...path, depName];
                const parentChain = newPath.slice(1).join(' -> ');
                if (vulnerableSet.has(depName)) {
                    const details = vulnDetailsMap[depName] || {};
                    results.push({
                        package: depName,
                        version: depInfo.version || '',
                        parentChain: parentChain,
                        severity: details.severity || '',
                        url: details.url || '',
                    });
                }
                recurse(depInfo, newPath);
            }
        }
        recurse(tree, [tree.name || 'root']);
        return results;
    }

    // Main processing function
    async function processVulnData(auditJson: any, lsJson: any) {
        const vulnerable = Array.from(extractVulnerablePackages(auditJson));
        if (vulnerable.length === 0) return [];
        const vulnSet = new Set(vulnerable);
        const vulnDetailsMap = buildVulnDetailsMap(auditJson);
        const results = findParentChains(lsJson, vulnSet, vulnDetailsMap);
        // Remove duplicates: only one row per unique package@version
        const uniqKey = new Set();
        const uniqResults: any[] = [];
        for (const r of results) {
            const key = `${r.package}@${r.version}`;
            if (!uniqKey.has(key)) {
                uniqKey.add(key);
                uniqResults.push(r);
            }
        }
        // Fetch latest version for each vulnerable package
        for (const row of uniqResults) {
            row.latestVersion = await fetchLatestVersion(row.package);
        }
        return uniqResults;
    }
>>>>>>> e984a44 (UI: Improved table styling, added CSV export, and more columns for vulnerable packages report)

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
<<<<<<< HEAD
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
=======
        <div>
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
                {dragging ? 'Release to drop the files' : 'Drag and drop your npm-audit.json and npm-ls.json files here'}
            </div>
            {status && <div style={{ color: 'red', marginTop: 10 }}>{status}</div>}
>>>>>>> e984a44 (UI: Improved table styling, added CSV export, and more columns for vulnerable packages report)
        </div>
    );
};

export default DragAndDrop;
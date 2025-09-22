import React, { useState } from 'react';
import { fetchLatestVersion } from '../utils/npmApi';

const DragAndDrop: React.FC<{ onFileDrop: (data: any) => void }> = ({ onFileDrop }) => {
    const [dragging, setDragging] = useState(false);
    const [status, setStatus] = useState<string>("");

        // Prevent default browser behavior for drag/drop events everywhere on the drop zone
        const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
            preventDefault(e);
            setDragging(true);
        };

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
            preventDefault(e);
            setDragging(true);
        };

        const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
            preventDefault(e);
            setDragging(false);
        };

        const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
            preventDefault(e);
            setDragging(false);

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                let auditJson: any = null;
                let lsJson: any = null;
                let auditFileName = "";
                let lsFileName = "";
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    let text = '';
                    try {
                        text = await file.text();
                    } catch (err) {
                        console.error(`Error reading file ${file.name}:`, err);
                        continue;
                    }
                    try {
                        const json = JSON.parse(text);
                        if (json.vulnerabilities || json.advisories) {
                            auditJson = json;
                            auditFileName = file.name;
                        } else if (json.dependencies) {
                            lsJson = json;
                            lsFileName = file.name;
                        }
                    } catch (err) {
                        console.error(`Error parsing JSON in file ${file.name}:`, err);
                    }
                }
                // Debug logging
                console.log("Detected files:", { auditFileName, lsFileName });
                console.log("auditJson:", auditJson);
                console.log("lsJson:", lsJson);
                if (auditJson && lsJson) {
                    setStatus("");
                    try {
                        const tableData = await processVulnData(auditJson, lsJson);
                        console.log("Extracted vulnerable table data:", tableData);
                        if (tableData.length === 0) {
                            setStatus("No vulnerable packages found in the provided files.");
                        } else {
                            setStatus("");
                        }
                        onFileDrop(tableData);
                    } catch (err) {
                        console.error("Error processing vulnerability data:", err);
                        setStatus("Error processing vulnerability data. See console for details.");
                        onFileDrop([]);
                    }
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
        const seen = new Set();
        function recurse(node: any, path: string[]) {
            if (!node || !node.dependencies) return;
            for (const [depName, depInfo] of Object.entries<any>(node.dependencies)) {
                if (!vulnerableSet.has(depName)) {
                    recurse(depInfo, [...path, depName]);
                    continue;
                }
                const newPath = [...path, depName];
                const parentChain = newPath.slice(1).join(' -> ');
                const key = `${depName}@${depInfo.version || ''}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    const details = vulnDetailsMap[depName] || {};
                    results.push({
                        package: depName,
                        version: depInfo.version || '',
                        parentChain: parentChain,
                        severity: details.severity || '',
                        url: details.url || '',
                    });
                }
                // Still recurse to find other vulnerable packages deeper in the tree
                recurse(depInfo, newPath);
            }
        }
        recurse(tree, [tree.name || 'root']);
        return results;
    }

    // Main processing function
    async function processVulnData(auditJson: any, lsJson: any) {
        const vulnerable = Array.from(extractVulnerablePackages(auditJson));
        console.log('Vulnerable packages extracted:', vulnerable);
        if (vulnerable.length === 0) {
            console.warn('No vulnerable packages found in auditJson.');
            return [];
        }
        const vulnSet = new Set(vulnerable);
        const vulnDetailsMap = buildVulnDetailsMap(auditJson);
        const results = findParentChains(lsJson, vulnSet, vulnDetailsMap);
        console.log('Parent chains found:', results);
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

// AI-powered analysis for actionable vulnerability recommendations
// This is a simple rule-based version; you can later swap in an LLM API if desired.

// Helper: get the top-level parent from a parentChain string
function getTopLevelParent(parentChain: string): string {
  return parentChain.split(' -> ')[1] || parentChain.split(' -> ')[0] || '';
}

// Returns a minimal set of top-level parents that, if upgraded, would fix the vulnerabilities
export function getUpgradeParents(rows: VulnRow[]): { parent: string, packages: string[] }[] {
  const parentToPackages: Record<string, Set<string>> = {};
  for (const row of rows) {
    const parent = getTopLevelParent(row.parentChain);
    if (!parent) continue;
    if (!parentToPackages[parent]) parentToPackages[parent] = new Set();
    parentToPackages[parent].add(row.package);
  }
  return Object.entries(parentToPackages).map(([parent, pkgs]) => ({ parent, packages: Array.from(pkgs) }));
}

// Simple summary for UI (non-LLM)
export function minimalUpgradeSummary(rows: VulnRow[]): string {
  const upgradeParents = getUpgradeParents(rows);
  if (upgradeParents.length === 0) return 'No actionable parent upgrades detected.';
  let summary = 'Upgrade the following parent libraries to fix vulnerabilities:';
  for (const { parent, packages } of upgradeParents) {
    summary += `\n- ${parent} (affects: ${packages.join(', ')})`;
  }
  return summary;
}

// LLM integration (OpenAI API example, requires API key and fetch polyfill in browser)
export async function llmUpgradeSummary(rows: VulnRow[], apiKey: string): Promise<string> {
  const upgradeParents = getUpgradeParents(rows);
  const prompt = `Given the following parent libraries and the vulnerable packages they affect, write a concise summary for a developer on which parent libraries to upgrade to fix the vulnerabilities.\n\n${upgradeParents.map(u => `Parent: ${u.parent}\nAffects: ${u.packages.join(', ')}`).join('\n\n')}`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for npm dependency vulnerability remediation.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 200,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No summary generated.';
}


export interface VulnRow {
  package: string;
  version: string;
  parentChain: string;
  severity?: string;
  url?: string;
}

export function analyzeVulnerabilities(rows: VulnRow[]): string {
  if (!rows || rows.length === 0) return 'No vulnerabilities detected.';

  // Group by vulnerable package
  const byPackage: Record<string, VulnRow[]> = {};
  for (const row of rows) {
    if (!byPackage[row.package]) byPackage[row.package] = [];
    byPackage[row.package].push(row);
  }

  let summary = '';
  for (const [pkg, entries] of Object.entries(byPackage)) {
    summary += `\n\nVulnerable package: ${pkg}`;
    // Find all unique parents
    const parents = entries.map(e => e.parentChain.split(' -> ')[0]).filter(Boolean);
    const uniqueParents = Array.from(new Set(parents));
    // Find oldest version among parents
    const parentVersions = entries.map(e => ({ parent: e.parentChain.split(' -> ')[0], version: e.version }));
    const oldest = parentVersions.reduce((a, b) => (a.version < b.version ? a : b));
    if (uniqueParents.length > 1) {
      summary += `\n- Found in multiple parents: ${uniqueParents.join(', ')}`;
    } else {
      summary += `\n- Parent: ${uniqueParents[0]}`;
    }
    summary += `\n- Oldest version among parents: ${oldest.parent} (${oldest.version})`;
    summary += `\n- Upgrade recommendation: Check npmjs.com for the latest safe version of ${pkg} and upgrade the parent(s) if possible.`;
  }
  return summary.trim();
}

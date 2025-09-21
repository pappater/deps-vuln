// scripts/find-vulnerable-parents.js
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

function readAuditJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error("Audit JSON not found at", filePath);
    process.exit(2);
  }
  const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return json;
}

function extractVulnerablePackages(auditJson) {
  const names = new Set();

  // npm v6 style: auditJson.advisories (object)
  if (auditJson.advisories && typeof auditJson.advisories === "object") {
    Object.values(auditJson.advisories).forEach((a) => {
      if (a.module_name) names.add(a.module_name);
    });
  }

  // npm v7+ style: auditJson.vulnerabilities (object mapping package -> details)
  if (
    auditJson.vulnerabilities &&
    typeof auditJson.vulnerabilities === "object"
  ) {
    Object.keys(auditJson.vulnerabilities).forEach((k) => names.add(k));
  }

  // Some outputs might include a 'advisory' or top-level array; try robustly:
  if (Array.isArray(auditJson) && auditJson.length > 0) {
    auditJson.forEach((it) => {
      if (it.module_name) names.add(it.module_name);
      if (it.package) names.add(it.package);
    });
  }

  return Array.from(names);
}

function buildDependencyTreeJson() {
  console.log(
    "Running npm ls --all --json (this may warn about unmet peer deps) ..."
  );
  const treeJson = execSync("npm ls --all --json", {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "ignore"],
  });
  return JSON.parse(treeJson);
}


function buildVulnDetailsMap(auditJson) {
  const map = {};
  // npm v6 style
  if (auditJson.advisories && typeof auditJson.advisories === "object") {
    Object.values(auditJson.advisories).forEach((a) => {
      if (a.module_name) {
        map[a.module_name] = {
          severity: a.severity || "",
          url: a.url || (a.cves && a.cves.length ? a.cves[0] : ""),
        };
      }
    });
  }
  // npm v7+ style
  if (auditJson.vulnerabilities && typeof auditJson.vulnerabilities === "object") {
    Object.entries(auditJson.vulnerabilities).forEach(([pkg, v]) => {
      let url = "";
      if (v.via && Array.isArray(v.via) && v.via.length > 0) {
        const first = v.via.find(x => typeof x === 'object' && x.url);
        if (first) url = first.url;
      }
      map[pkg] = {
        severity: v.severity || "",
        url: url,
      };
    });
  }
  return map;
}

function findParentChains(tree, vulnerableSet, vulnDetailsMap) {
  const results = [];
  // Helper to recursively find all vulnerable packages and their direct parent
  function recurse(node, parentName) {
    if (!node || !node.dependencies) return;
    for (const [depName, depInfo] of Object.entries(node.dependencies)) {
      if (vulnerableSet.has(depName)) {
        const details = vulnDetailsMap[depName] || {};
        results.push({
          package: depName,
          version: depInfo.version || "",
          parentChain: parentName || "root",
          severity: details.severity || "",
          url: details.url || ""
        });
      }
      recurse(depInfo, node.name || "root");
    }
  }
  recurse(tree, tree.name || "root");
  return results;
}


function saveCsv(results, outFile) {
  const header = "Vulnerable Package,Version,Parent Chain,Severity,Advisory URL\n";
  const lines = results.map((r) => {
    const pkg = r.package.replace(/"/g, '""');
    const ver = (r.version || "").replace(/"/g, '""');
    const chain = (r.parentChain || "").replace(/"/g, '""');
    const sev = (r.severity || "").replace(/"/g, '""');
    const url = (r.url || "").replace(/"/g, '""');
    return `"${pkg}","${ver}","${chain}","${sev}","${url}"`;
  });
  fs.writeFileSync(outFile, header + lines.join("\n"), "utf8");
  console.log("Saved CSV to", outFile);
}

async function main() {
  const auditFile = path.resolve(process.cwd(), "npm-audit.json"); // artifact from CI
  const outputCsv = path.resolve(process.cwd(), "vulnerable-report.csv");


  const auditJson = readAuditJson(auditFile);
  const vulnerable = extractVulnerablePackages(auditJson);
  if (vulnerable.length === 0) {
    console.log("No vulnerable packages found in audit JSON.");
    saveCsv([], outputCsv);
    return;
  }

  console.log("Vulnerable packages found:", vulnerable.join(", "));
  const vulnSet = new Set(vulnerable);
  const vulnDetailsMap = buildVulnDetailsMap(auditJson);
  const tree = buildDependencyTreeJson();
  const results = findParentChains(tree, vulnSet, vulnDetailsMap);
  // Remove duplicates (same package might be found multiple times)
  const uniqKey = new Set();
  const uniqResults = [];
  for (const r of results) {
    const key = `${r.package}@${r.version}|${r.parentChain}`;
    if (!uniqKey.has(key)) {
      uniqKey.add(key);
      uniqResults.push(r);
    }
  }
  saveCsv(uniqResults, outputCsv);
}

main();

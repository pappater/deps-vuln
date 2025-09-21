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

function findParentChains(tree, vulnerableSet) {
  const results = [];

  function recurse(node, parents) {
    if (!node || !node.dependencies) return;
    for (const [depName, depInfo] of Object.entries(node.dependencies)) {
      const currentChain = parents.concat(node.name || "root");
      if (vulnerableSet.has(depName)) {
        results.push({
          package: depName,
          version: depInfo.version || "",
          parentChain: currentChain.concat(depName).join(" -> "),
        });
      }
      // Continue downward
      recurse(depInfo, currentChain);
    }
  }

  recurse(tree, []);
  return results;
}

function saveCsv(results, outFile) {
  const header = "Vulnerable Package,Version,Parent Chain\n";
  const lines = results.map((r) => {
    const pkg = r.package.replace(/"/g, '""');
    const ver = (r.version || "").replace(/"/g, '""');
    const chain = (r.parentChain || "").replace(/"/g, '""');
    return `"${pkg}","${ver}","${chain}"`;
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
    // still attempt to create empty CSV
    saveCsv([], outputCsv);
    return;
  }

  console.log("Vulnerable packages found:", vulnerable.join(", "));
  const vulnSet = new Set(vulnerable);

  // Build dependency tree from npm ls
  const tree = buildDependencyTreeJson();

  const results = findParentChains(tree, vulnSet);
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

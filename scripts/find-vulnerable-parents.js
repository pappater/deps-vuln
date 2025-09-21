// scripts/find-vulnerable-parents.js
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");
const https = require("https");

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
  if (
    auditJson.vulnerabilities &&
    typeof auditJson.vulnerabilities === "object"
  ) {
    Object.entries(auditJson.vulnerabilities).forEach(([pkg, v]) => {
      let url = "";
      if (v.via && Array.isArray(v.via) && v.via.length > 0) {
        const first = v.via.find((x) => typeof x === "object" && x.url);
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
  // Helper to recursively find all vulnerable packages and their full ancestry
  function recurse(node, path) {
    if (!node || !node.dependencies) return;
    for (const [depName, depInfo] of Object.entries(node.dependencies)) {
      const newPath = [...path, depName];
      // Remove the root project name from the parent chain
      const parentChain = newPath.slice(1).join(" -> ");
      if (vulnerableSet.has(depName)) {
        const details = vulnDetailsMap[depName] || {};
        results.push({
          package: depName,
          version: depInfo.version || "",
          parentChain: parentChain,
          severity: details.severity || "",
          url: details.url || "",
        });
      }
      recurse(depInfo, newPath);
    }
  }
  recurse(tree, [tree.name || "root"]);
  return results;
}

async function fetchNpmPackageInfo(pkg) {
  return new Promise((resolve) => {
    https
      .get(`https://registry.npmjs.org/${pkg}`, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(null);
          }
        });
      })
      .on("error", () => resolve(null));
  });
}

function getLatestInSeries(versions, currentVersion) {
  const semver = require("semver");
  const major = semver.major(currentVersion);
  const filtered = Object.keys(versions)
    .filter((v) => semver.valid(v) && semver.major(v) === major)
    .sort(semver.rcompare);
  return filtered[0] || "";
}

function getLatestOverall(versions) {
  const semver = require("semver");
  const filtered = Object.keys(versions)
    .filter((v) => semver.valid(v))
    .sort(semver.rcompare);
  return filtered[0] || "";
}

async function saveCsv(results, outFile, parentLibs) {
  const header =
    "Vulnerable Package,Version,Parent Chain,Severity,Advisory URL\n";
  const lines = results.map((r) => {
    const pkg = r.package.replace(/"/g, '""');
    const ver = (r.version || "").replace(/"/g, '""');
    const chain = (r.parentChain || "").replace(/"/g, '""');
    const sev = (r.severity || "").replace(/"/g, '""');
    const url = (r.url || "").replace(/"/g, '""');
    return `"${pkg}","${ver}","${chain}","${sev}","${url}"`;
  });
  let csv = header + lines.join("\n");

  if (parentLibs && parentLibs.length > 0) {
    csv +=
      "\n\nParent Library,Current Version,Latest in Series,Latest Overall\n";
    for (const lib of parentLibs) {
      const { name, version, latestInSeries, latestOverall } = lib;
      csv += `"${name}","${version}","${latestInSeries}","${latestOverall}"\n`;
    }
  }
  fs.writeFileSync(outFile, csv, "utf8");
  console.log("Saved CSV to", outFile);
}

async function main() {
  const auditFile = path.resolve(process.cwd(), "npm-audit.json"); // artifact from CI
  const outputCsv = path.resolve(process.cwd(), "vulnerable-report.csv");
  const auditJson = readAuditJson(auditFile);
  const vulnerable = extractVulnerablePackages(auditJson);
  if (vulnerable.length === 0) {
    console.log("No vulnerable packages found in audit JSON.");
    await saveCsv([], outputCsv, []);
    return;
  }
  console.log("Vulnerable packages found:", vulnerable.join(", "));
  const vulnSet = new Set(vulnerable);
  const vulnDetailsMap = buildVulnDetailsMap(auditJson);
  const tree = buildDependencyTreeJson();
  const results = findParentChains(tree, vulnSet, vulnDetailsMap);
  // Remove duplicates: only one row per unique package@version
  const uniqKey = new Set();
  const uniqResults = [];
  for (const r of results) {
    const key = `${r.package}@${r.version}`;
    if (!uniqKey.has(key)) {
      uniqKey.add(key);
      uniqResults.push(r);
    }
  }

  // Collect all unique parent libraries and their versions
  const parentLibMap = new Map();
  for (const r of uniqResults) {
    // Only consider the first parent in the chain (immediate parent)
    const chainArr = r.parentChain.split(" -> ");
    if (chainArr.length > 1) {
      const parent = chainArr[0];
      const parentVersion =
        (tree.dependencies &&
          tree.dependencies[parent] &&
          tree.dependencies[parent].version) ||
        "";
      if (parent && parentVersion && !parentLibMap.has(parent)) {
        parentLibMap.set(parent, parentVersion);
      }
    }
  }

  // For each parent library, fetch latest versions
  const parentLibs = [];
  for (const [name, version] of parentLibMap.entries()) {
    const info = await fetchNpmPackageInfo(name);
    let latestInSeries = "";
    let latestOverall = "";
    if (info && info.versions && version) {
      try {
        latestInSeries = getLatestInSeries(info.versions, version);
        latestOverall = getLatestOverall(info.versions);
      } catch (e) {}
    }
    parentLibs.push({ name, version, latestInSeries, latestOverall });
  }

  await saveCsv(uniqResults, outputCsv, parentLibs);
}

main();

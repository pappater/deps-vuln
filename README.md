# vuln-demo

Demo repo to show automated dependency scanning + parent mapping.

Workflow:

1. GitHub Actions runs `npm audit --json` and uploads `npm-audit.json`.
2. A mapping job runs `npm ls --json`, reads `npm-audit.json`, finds vulnerable packages, and outputs `vulnerable-report.csv`.

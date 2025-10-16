# NPM Audit Actionable Insights 🔍

A comprehensive tool for analyzing NPM dependency vulnerabilities and providing clear, actionable upgrade recommendations. This project combines automated dependency scanning with an intuitive web interface to help developers quickly identify and remediate security issues.

[![Dependency Scan](https://github.com/pappater/deps-vuln/actions/workflows/dependency-scan.yml/badge.svg)](https://github.com/pappater/deps-vuln/actions/workflows/dependency-scan.yml)

## 🌟 Live Demo

**[View the Live Application](https://pappater.github.io/deps-vuln/)**

## 📋 Project Overview

This project provides two main components:

1. **Automated CI/CD Scanning**: GitHub Actions workflow that automatically scans dependencies and generates vulnerability reports
2. **Interactive Web UI**: React-based application for analyzing vulnerability reports with drag-and-drop functionality, providing:
   - Minimal upgrade recommendations (which parent packages to upgrade)
   - AI-powered summaries (via OpenAI API)
   - Full vulnerability tables with export functionality

## 🚀 Features

### Automated Scanning (GitHub Actions)
- Runs `npm audit` to detect vulnerabilities
- Generates dependency tree with `npm ls`
- Maps vulnerable packages to their parent dependencies
- Produces CSV reports with actionable insights
- Uploads artifacts for easy access

### Web Application
- **Drag & Drop Interface**: Simply drop your `npm-audit.json` and `npm-ls.json` files
- **Smart Analysis**: Identifies which parent packages need upgrading to fix vulnerabilities
- **AI Summaries**: Optional OpenAI integration for intelligent recommendations
- **Full Visibility**: Detailed vulnerability table with severity levels and advisory links
- **Export Functionality**: Download vulnerability data as CSV
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

### Web Application
- **React 17** with TypeScript
- **React Hooks** for state management
- **CSS3** with responsive design
- Modern ES6+ JavaScript

### Backend/Scripts
- **Node.js** for automation scripts
- **GitHub Actions** for CI/CD
- NPM ecosystem tools

## 📁 Project Structure

```
deps-vuln/
├── audit-report-ui/          # React web application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── DragAndDrop.tsx    # File upload component
│   │   │   ├── TableDisplay.tsx   # Vulnerability table
│   │   │   ├── ExportButton.tsx   # CSV export
│   │   │   └── ThemeToggle.tsx    # Theme switcher
│   │   ├── utils/            # Utility functions
│   │   │   ├── aiAnalysis.ts      # AI-powered analysis
│   │   │   └── npmApi.ts          # NPM registry API
│   │   ├── styles/           # CSS stylesheets
│   │   ├── App.tsx           # Main app component
│   │   └── index.tsx         # Entry point
│   ├── public/               # Static assets
│   └── package.json          # Dependencies & scripts
├── scripts/
│   └── find-vulnerable-parents.js  # CI script for analysis
├── .github/workflows/
│   └── dependency-scan.yml   # GitHub Actions workflow
├── package.json              # Root package config
└── README.md                 # This file
```

## 💻 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/pappater/deps-vuln.git
   cd deps-vuln
   ```

2. **Install dependencies**
   ```bash
   cd audit-report-ui
   npm install
   ```

3. **Run the development server**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

4. **Build for production**
   ```bash
   npm run build
   ```

## 📊 Usage

### Using the Web Application

1. **Generate audit files** in your project:
   ```bash
   npm audit --json > npm-audit.json
   npm ls --json > npm-ls.json
   ```

2. **Open the web application** at https://pappater.github.io/deps-vuln/

3. **Drag and drop** both JSON files into the upload area

4. **Review the analysis**:
   - **Minimal Upgrade Summary**: Shows which parent packages to upgrade
   - **LLM Summary** (optional): Get AI-powered recommendations using your OpenAI API key
   - **Vulnerability Table**: Full details of all vulnerabilities

5. **Export results** as CSV if needed

### Using the GitHub Actions Workflow

The workflow runs automatically on push/PR to main branch:

1. Scans dependencies with `npm audit`
2. Generates dependency tree
3. Maps vulnerabilities to parent packages
4. Uploads artifacts (CSV and JSON reports)

Access artifacts from the Actions tab in GitHub.

## 🚀 Deployment

This project is deployed to GitHub Pages automatically.

### Manual Deployment

```bash
cd audit-report-ui
npm run deploy
```

This will:
1. Build the production app
2. Deploy to the `gh-pages` branch
3. Make it available at the configured homepage URL

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Inspired by the need for better npm vulnerability analysis tools
- Uses the NPM registry API for package information
- Optional OpenAI integration for intelligent summaries

## 📧 Contact

Project Link: [https://github.com/pappater/deps-vuln](https://github.com/pappater/deps-vuln)

---

**Note**: This is a demo project showcasing automated dependency scanning and vulnerability analysis. Always verify security recommendations before applying them to production systems.

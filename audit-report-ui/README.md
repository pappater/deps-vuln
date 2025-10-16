# NPM Audit Report UI 🎨

A modern, interactive web application for analyzing NPM vulnerability reports. Upload your audit files and get actionable insights on how to fix security vulnerabilities in your dependencies.

## 🌟 Live Application

**[https://pappater.github.io/deps-vuln/](https://pappater.github.io/deps-vuln/)**

## ✨ Features

- **Drag and Drop Interface**: Easily upload `npm-audit.json` and `npm-ls.json` files
- **Smart Analysis**: Automatically identifies which parent packages need upgrading
- **Minimal Upgrade Recommendations**: Clear, actionable advice on the minimum changes needed
- **AI-Powered Summaries**: Optional OpenAI integration for intelligent recommendations
- **Detailed Vulnerability Table**: Complete view of all vulnerabilities with severity levels
- **CSV Export**: Download vulnerability data for external analysis
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Clean, Modern UI**: Professional design with excellent user experience

## 🛠️ Technology Stack

- **React 17** with TypeScript
- **React Hooks** for state management
- **Create React App** build tooling
- **CSS3** with responsive media queries
- Modern ES6+ JavaScript features

## 📁 Project Structure

```
audit-report-ui/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── components/
│   │   ├── DragAndDrop.tsx    # File upload component
│   │   ├── TableDisplay.tsx   # Vulnerability table display
│   │   ├── ExportButton.tsx   # CSV export functionality
│   │   └── ThemeToggle.tsx    # Theme switcher (optional)
│   ├── utils/
│   │   ├── aiAnalysis.ts      # AI-powered analysis logic
│   │   └── npmApi.ts          # NPM registry API integration
│   ├── styles/
│   │   └── theme.css          # Application styles
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   ├── index.tsx              # Application entry point
│   └── react-app-env.d.ts     # React type definitions
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd audit-report-ui
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Development

**Run the development server**:
```bash
npm start
```

The application will open at `http://localhost:3000` with hot-reloading enabled.

### Building for Production

**Create an optimized production build**:
```bash
npm run build
```

The build output will be in the `build/` directory.

### Running Tests

```bash
npm test
```

## 📖 Usage Guide

### Step 1: Generate Audit Files

In your Node.js project, run:

```bash
# Generate npm audit report
npm audit --json > npm-audit.json

# Generate dependency tree
npm ls --json > npm-ls.json
```

### Step 2: Upload Files

1. Open the web application
2. Drag and drop both JSON files into the upload area
3. The application will automatically parse and analyze the data

### Step 3: Review Analysis

The application provides three accordion sections:

1. **Minimal Upgrade Summary**
   - Shows which parent packages to upgrade
   - Groups affected vulnerable packages
   - Provides specific upgrade recommendations

2. **LLM-powered Summary** (Optional)
   - Enter your OpenAI API key
   - Get AI-generated upgrade recommendations
   - Natural language explanations

3. **Vulnerability Table**
   - Complete list of vulnerabilities
   - Severity levels and advisory links
   - Parent chain information
   - Export to CSV functionality

## 🎨 Component Overview

### DragAndDrop Component
Handles file uploads with drag-and-drop functionality. Parses JSON files and extracts vulnerability data with parent chain mapping.

### TableDisplay Component
Renders vulnerability data in a formatted table with responsive design. Shows package names, versions, parent chains, severity levels, and advisory URLs.

### ExportButton Component
Exports vulnerability data to CSV format for external analysis and record-keeping.

### AI Analysis Utilities
- **getUpgradeParents()**: Identifies minimal set of parent packages to upgrade
- **llmUpgradeSummary()**: Generates AI-powered recommendations via OpenAI API
- **analyzeVulnerabilities()**: Rule-based vulnerability analysis

## 🚀 Deployment

This application is configured for GitHub Pages deployment.

### Deploy to GitHub Pages

```bash
npm run deploy
```

This command:
1. Builds the production app
2. Deploys to the `gh-pages` branch
3. Makes it available at the configured homepage URL

### Configuration

The `homepage` field in `package.json` is set to:
```json
"homepage": "https://pappater.github.io/deps-vuln/"
```

Modify this if deploying to a different location.

## ⚙️ Configuration

### Environment Variables

Create a `.env` file for environment-specific settings:

```env
REACT_APP_OPENAI_API_KEY=your_api_key_here
```

**Note**: Never commit API keys to version control!

### TypeScript Configuration

The project uses TypeScript with strict type checking. See `tsconfig.json` for compiler options.

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - See the root LICENSE file for details.

## 🐛 Troubleshooting

### Build Fails with OpenSSL Error

If you encounter OpenSSL errors during build, the package.json includes a workaround:

```json
"build": "NODE_OPTIONS=--openssl-legacy-provider react-scripts build"
```

### Drag and Drop Not Working

Ensure both `npm-audit.json` and `npm-ls.json` files are valid JSON and generated from the same project.

### No Vulnerabilities Detected

Check that:
- Your audit file contains vulnerability data
- The JSON structure matches expected format (npm v6 or v7+)
- Files are from the same project

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [NPM Audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Create React App Documentation](https://create-react-app.dev/)

---

Built with ❤️ using React and TypeScript
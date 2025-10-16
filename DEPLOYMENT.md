# Deployment Guide

This document provides instructions for deploying the NPM Audit Actionable Insights application to GitHub Pages.

## Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys the application to GitHub Pages when changes are pushed to the `main` branch.

### Prerequisites

1. **Enable GitHub Pages** in your repository:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Build and deployment", select "GitHub Actions" as the source

2. **Workflow Configuration**: The workflow file is located at `.github/workflows/deploy-gh-pages.yml`

### How It Works

When you push to the `main` branch or manually trigger the workflow:

1. The workflow checks out the code
2. Sets up Node.js environment
3. Installs dependencies
4. Builds the React application
5. Deploys the build folder to GitHub Pages

### Manual Trigger

You can manually trigger the deployment:

1. Go to the "Actions" tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Manual Deployment (Alternative)

If you prefer to deploy manually from your local machine:

### Prerequisites

- Node.js 18+ installed
- Git repository with push access
- gh-pages package installed (already in devDependencies)

### Steps

1. **Navigate to the React app directory**:
   ```bash
   cd audit-report-ui
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Deploy to GitHub Pages**:
   ```bash
   npm run deploy
   ```

   This command will:
   - Build the production app (`npm run build`)
   - Deploy to the `gh-pages` branch
   - Push to GitHub

4. **Verify deployment**:
   - Visit https://pappater.github.io/deps-vuln/
   - It may take a few minutes for changes to appear

## Configuration

### Homepage URL

The homepage is configured in `audit-report-ui/package.json`:

```json
"homepage": "https://pappater.github.io/deps-vuln/"
```

If you fork this repository, update this URL to match your GitHub username/organization:

```json
"homepage": "https://YOUR-USERNAME.github.io/deps-vuln/"
```

### Build Configuration

The build scripts use a Node.js option for OpenSSL compatibility:

```json
"scripts": {
  "build": "NODE_OPTIONS=--openssl-legacy-provider react-scripts build"
}
```

This ensures compatibility with older Node.js versions and certain dependency configurations.

## Troubleshooting

### Deployment Fails with "gh-pages" Error

If manual deployment fails, ensure you have permissions to push to the repository:

```bash
git remote -v  # Check remote URL
git config user.name  # Check Git username
git config user.email  # Check Git email
```

### Pages Not Updating

1. **Check GitHub Actions**: Go to the Actions tab and verify the workflow ran successfully
2. **Clear Cache**: Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check Pages Settings**: Ensure GitHub Pages is enabled and set to use GitHub Actions

### Build Errors

If the build fails:

1. **Clear node_modules and reinstall**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node version**:
   ```bash
   node -v  # Should be 18+
   ```

3. **Review build logs** for specific errors

### 404 Errors on Deployed Site

Ensure the `homepage` field in package.json matches your GitHub Pages URL exactly.

## Monitoring

### Check Deployment Status

- **GitHub Actions**: View workflow runs in the Actions tab
- **Pages Status**: Check Settings > Pages for deployment status
- **Live URL**: Visit the deployed site to verify it's working

### Artifacts

The GitHub Actions workflow creates build artifacts that you can download:

1. Go to the Actions tab
2. Click on a workflow run
3. Scroll down to "Artifacts" section
4. Download the artifacts for inspection

## Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. Add a `CNAME` file to `audit-report-ui/public/` with your domain
2. Update the `homepage` in package.json
3. Configure DNS settings with your domain provider
4. Enable HTTPS in GitHub Pages settings

See [GitHub's custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.

## Security Considerations

- The deployed application is entirely client-side
- No API keys or secrets should be committed to the repository
- OpenAI API keys are entered by users at runtime and never stored
- All vulnerability analysis happens in the browser

## Updates and Maintenance

To update the deployed application:

1. Make changes to the code
2. Commit and push to the `main` branch
3. The GitHub Actions workflow will automatically rebuild and redeploy
4. Changes appear live within a few minutes

For immediate updates, manually trigger the workflow from the Actions tab.

---

For more information about GitHub Pages, see the [official documentation](https://docs.github.com/en/pages).

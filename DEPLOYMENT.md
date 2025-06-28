# GitHub Pages Deployment Guide

This guide will help you deploy your Item Tracker application to GitHub Pages.

## Prerequisites

1. Make sure your code is pushed to a GitHub repository
2. The repository should be named `Item-Tracker` (or update the base URL in `frontend/vite.config.ts`)

## Setup Steps

### 1. Enable GitHub Pages

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Scroll down to "Pages" section in the left sidebar
4. Under "Source", select "GitHub Actions"
5. This will allow the workflow to deploy automatically

### 2. Push Your Code

The GitHub Actions workflow will automatically trigger when you push to the main branch:

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to your repository on GitHub
2. Click on the "Actions" tab
3. You should see the "Deploy to GitHub Pages" workflow running
4. Wait for it to complete successfully

### 4. Access Your Site

Once deployment is complete, your site will be available at:
`https://[your-username].github.io/Item-Tracker/`

## Manual Deployment

If you want to deploy manually:

```bash
# Install dependencies
npm run install:all

# Build the frontend
npm run build

# The built files will be in frontend/dist/
```

## Troubleshooting

- If the site doesn't load, check that the repository name matches the base URL in `vite.config.ts`
- Make sure GitHub Pages is enabled in your repository settings
- Check the Actions tab for any build errors
- Verify that the main branch is being used for deployment

## Notes

- The backend API will need to be hosted separately (e.g., on Heroku, Railway, or similar)
- Update the API endpoints in your frontend code to point to your hosted backend
- GitHub Pages only serves static files, so the backend cannot be hosted there 
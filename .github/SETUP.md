# GitHub Actions CI/CD Setup

This repository uses GitHub Actions for automatic deployment to Railway when code is pushed to the `main` branch.

## Required GitHub Secrets

Add these secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

### 1. Docker Hub Credentials

```
DOCKERHUB_USERNAME = your-dockerhub-username
DOCKERHUB_TOKEN = your-dockerhub-access-token
```

Get your Docker Hub access token: https://hub.docker.com/settings/security

### 2. Railway Credentials

```
RAILWAY_TOKEN = your-railway-token
RAILWAY_PROJECT_ID = your-railway-project-id
```

**Get Railway Token:**
1. Go to https://railway.app/account/tokens
2. Create a new token
3. Copy and add as secret

**Get Railway Project ID:**
1. Go to your Railway project
2. Click Settings
3. Copy the Project ID

## How It Works

When you push to `main` branch:

1. **Build & Test** - Installs dependencies and runs tests
2. **Docker Build** - Creates Docker image and pushes to Docker Hub
3. **Database Migration** - Runs database migrations on Railway
4. **Deploy** - Deploys to Railway using Railway CLI
5. **Health Check** - Verifies deployment is healthy

## Manual Deployment

You can manually trigger deployment:

1. Go to **Actions** tab in GitHub
2. Select **CI/CD Pipeline**
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

## Monitoring

- **Pipeline Status**: GitHub Actions tab
- **Railway Logs**: https://railway.app → Your Project → Deployments
- **Docker Images**: https://hub.docker.com/r/natjoub/backend

## Production Approval (Optional)

To require manual approval before production deployment:

1. Go to **Settings → Environments**
2. Create environment named `production`
3. Enable **Required reviewers**
4. Add reviewers (admins, tech leads)

This adds a manual approval step before deploying to production.

## Troubleshooting

**Docker push fails:**
- Check DOCKERHUB_USERNAME and DOCKERHUB_TOKEN
- Verify Docker Hub repository `natjoub/backend` exists

**Database migration fails:**
- Verify RAILWAY_TOKEN and RAILWAY_PROJECT_ID
- Check Railway database is running
- Review Railway service logs

**Deployment fails:**
- Check Railway token permissions
- Verify Railway project is not paused
- Check Dockerfile builds correctly

**Health check fails:**
- Application may still be starting (normal)
- Check Railway logs for errors
- Verify app has root route `/` endpoint

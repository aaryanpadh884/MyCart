# Deployment Guide - Render (Free)

## Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **MongoDB Atlas** - Free cloud database

## Step 1: Set up MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free account
3. Create a new cluster (free tier)
4. Get your connection string
5. Add your IP to whitelist (or use 0.0.0.0/0 for all IPs)

## Step 2: Push Code to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 3: Deploy to Render

### Option A: Using render.yaml (Recommended)

1. Go to [render.com](https://render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply"

### Option B: Manual Setup

#### Backend Service:
1. Click "New +" → "Web Service"
2. Connect GitHub repo
3. Configure:
   - **Name**: `item-tracker-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Frontend Service:
1. Click "New +" → "Static Site"
2. Connect GitHub repo
3. Configure:
   - **Name**: `item-tracker-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

## Step 4: Environment Variables

Add these to your backend service in Render:

- `NODE_ENV`: `production`
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `GMAIL_USER`: Your Gmail address
- `GMAIL_APP_PASSWORD`: Your Gmail app password
- `NOTIFICATION_EMAIL`: Email for notifications

Add this to your frontend service:
- `VITE_API_BASE_URL`: `https://your-backend-name.onrender.com/api`

## Step 5: Custom Domain (Optional)

1. Buy a domain (e.g., from Namecheap, ~$10/year)
2. In Render, go to your service → Settings → Custom Domains
3. Add your domain
4. Update DNS records as instructed

## URLs

After deployment, your app will be available at:
- **Frontend**: `https://item-tracker-frontend.onrender.com`
- **Backend**: `https://item-tracker-backend.onrender.com`

## Free Tier Limits

- **Build time**: 500 minutes/month
- **Runtime**: Services sleep after 15 minutes of inactivity
- **Bandwidth**: 100GB/month
- **Perfect for low-traffic apps!**

## Troubleshooting

1. **Build fails**: Check build logs in Render dashboard
2. **CORS errors**: Ensure backend CORS is configured correctly
3. **Database connection**: Verify MongoDB Atlas connection string
4. **Cold starts**: First request after inactivity may take 30-60 seconds 
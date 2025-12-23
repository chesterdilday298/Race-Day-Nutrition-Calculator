# Deployment Instructions

## Quick Deploy to Vercel

### Method 1: GitHub + Vercel (Recommended)

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/race-nutrition-calculator.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts
# Your site will be live at: https://your-project.vercel.app
```

## Required Files

✅ pages/index.jsx - Main calculator component  
✅ pages/_app.js - Analytics integration  
✅ package.json - Dependencies  
✅ next.config.js - Next.js configuration  

## Analytics

Vercel Analytics and Speed Insights are automatically enabled via `_app.js`.

View analytics at: https://vercel.com/dashboard → Your Project → Analytics

## Domain Setup (Optional)

1. Go to Vercel dashboard
2. Select your project
3. Click "Settings" → "Domains"
4. Add your custom domain

## Environment (Default)

- Framework: Next.js 14
- Node: 18.x
- Build Command: `next build`
- Output Directory: `.next`

## Troubleshooting

**Build fails:**
- Ensure all dependencies are in package.json
- Check for syntax errors in index.jsx

**Analytics not showing:**
- Wait 24-48 hours for initial data
- Ensure `@vercel/analytics` is installed

## Support

For issues, contact: coach@keystoneendurance.com

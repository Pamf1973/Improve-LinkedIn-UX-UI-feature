# MatchPoint Deployment Guide

This guide covers deploying both the React frontend and FastAPI backend to production.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Testing Locally](#testing-locally)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- npm or yarn

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173

# Backend (in another terminal)
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
# Runs on http://localhost:8001
```

---

## 🔐 Environment Variables

### Frontend (.env)

Create `frontend/.env.local` for local development:

```bash
# API Base URL (backend server)
VITE_API_BASE_URL=http://localhost:8001
```

For production, set:
```bash
VITE_API_BASE_URL=https://your-backend-url.com
```

### Backend (.env)

Create `backend/.env` based on `.env.example`:

```bash
# Environment
ENVIRONMENT=production

# LinkedIn OAuth (optional)
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=https://your-backend-url.com/api/auth/linkedin/callback

# Frontend URL for OAuth redirects
FRONTEND_URL=https://your-frontend-url.com

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-frontend-url.com,https://www.your-frontend-url.com
```

---

## 🎨 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `VITE_API_BASE_URL` = Your backend URL

4. **Configuration:**
   - Uses `vercel.json` (already configured)
   - Builds automatically on git push

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy:**
   ```bash
   cd frontend
   netlify deploy --prod
   ```

3. **Set Environment Variables in Netlify Dashboard:**
   - `VITE_API_BASE_URL` = Your backend URL

4. **Configuration:**
   - Uses `netlify.toml` (already configured)

### Option 3: Manual Build

```bash
cd frontend
npm run build
# Upload the 'dist' folder to any static hosting service
```

---

## ⚙️ Backend Deployment

### Option 1: Railway (Recommended for Python)

1. **Push to GitHub**
2. **Connect Railway to your repo:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub
   - Select your repository
   - Select the `backend` folder

3. **Set Environment Variables in Railway Dashboard:**
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://your-frontend-url.com
   ALLOWED_ORIGINS=https://your-frontend-url.com
   LINKEDIN_CLIENT_ID=...
   LINKEDIN_CLIENT_SECRET=...
   LINKEDIN_REDIRECT_URI=https://your-backend-url.com/api/auth/linkedin/callback
   ```

4. **Configuration:**
   - Uses `railway.json` (already configured)
   - Deploys automatically on git push

### Option 2: Render

1. **Push to GitHub**
2. **Create Web Service on Render:**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect your repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Set Environment Variables** (same as Railway)

4. **Configuration:**
   - Uses `render.yaml` (already configured)

### Option 3: Heroku

1. **Install Heroku CLI:**
   ```bash
   npm i -g heroku
   ```

2. **Deploy:**
   ```bash
   cd backend
   heroku login
   heroku create your-app-name
   git push heroku main
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set ENVIRONMENT=production
   heroku config:set FRONTEND_URL=https://your-frontend-url.com
   heroku config:set ALLOWED_ORIGINS=https://your-frontend-url.com
   ```

4. **Configuration:**
   - Uses `Procfile` (already configured)
   - Uses `runtime.txt` for Python version

---

## 🧪 Testing Locally

### Test Production Build Locally

1. **Build Frontend:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   # Opens on http://localhost:4173
   ```

2. **Run Backend:**
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn main:app --port 8001
   ```

3. **Test:**
   - Frontend: http://localhost:4173
   - Backend API: http://localhost:8001/docs
   - Health Check: http://localhost:8001/api/health

### Verify API Connection

Open browser console on http://localhost:4173 and check:
- No CORS errors
- API calls succeed
- Data loads correctly

---

## 📝 Post-Deployment Checklist

- [ ] Frontend loads without errors
- [ ] Backend health endpoint responds: `/api/health`
- [ ] API calls work from frontend
- [ ] No CORS errors in browser console
- [ ] Environment variables are set correctly
- [ ] LinkedIn OAuth works (if configured)
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Analytics configured (optional)

---

## 🐛 Troubleshooting

### CORS Errors
- Ensure `ALLOWED_ORIGINS` includes your frontend URL
- Check that URLs match exactly (http vs https, www vs non-www)

### API Connection Failed
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is running and accessible
- Test backend health endpoint directly

### Build Failures
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v` (should be 18+)
- Check Python version: `python --version` (should be 3.11+)

---

## 🎉 Success!

Your MatchPoint application is now deployed and ready to use!

**Production URLs:**
- Frontend: `https://your-frontend-url.com`
- Backend: `https://your-backend-url.com`
- API Docs: `https://your-backend-url.com/docs` (only in development mode)

---

## 📞 Need Help?

- Check the main [README.md](./README.md)
- Review environment variables in `.env.example` files
- Open an issue on GitHub

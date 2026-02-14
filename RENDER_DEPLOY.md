# Quick Render Deployment Guide

## 🚨 Fix for "Couldn't find package.json" Error

Your error occurred because Render was looking in the wrong directory. Here's how to fix it:

---

## Option 1: Deploy Frontend Only (Recommended First)

### On Render Dashboard:

1. **Delete the current service** that's failing
2. **Create New Static Site**:
   - Name: `matchpoint-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Auto-Deploy: Yes

3. **Add Environment Variable**:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com` (add after deploying backend)

4. **Deploy!**

---

## Option 2: Deploy Backend Only

### On Render Dashboard:

1. **Create New Web Service**:
   - Name: `matchpoint-backend`
   - Root Directory: `backend`
   - Environment: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Add Environment Variables**:
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://your-frontend-url.onrender.com
   ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
   ```

3. **Deploy!**

---

## Option 3: Deploy Both Using Blueprint (Advanced)

1. **Push `render.yaml` to your repo** (already created in root)

2. **On Render Dashboard**:
   - New → Blueprint
   - Connect your repository
   - It will auto-detect `render.yaml` and deploy both services

3. **Set Environment Variables** for both services in the dashboard

---

## 🔧 Settings for Current Deploy

If you want to fix your current deployment without starting over:

### In Render Dashboard → Your Service → Settings:

1. **Root Directory**: Change from empty to `frontend`
2. **Build Command**: `npm install && npm run build`
3. **Publish Directory**: `dist`
4. **Save Changes** and **Manual Deploy**

---

## ✅ Deployment Order

**Recommended sequence:**

1. Deploy **Backend first** → Get backend URL
2. Deploy **Frontend** → Set `VITE_API_BASE_URL` to backend URL
3. Update Backend's `ALLOWED_ORIGINS` to include frontend URL
4. Redeploy backend to apply CORS changes

---

## 🌐 After Deployment

Once both are deployed:

1. **Test Backend**:
   - Visit `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"ok"}`

2. **Test Frontend**:
   - Visit `https://your-frontend.onrender.com`
   - Open browser console - check for CORS errors
   - Try swiping cards

3. **Update Environment Variables**:

   **Frontend:**
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```

   **Backend:**
   ```
   FRONTEND_URL=https://your-frontend.onrender.com
   ALLOWED_ORIGINS=https://your-frontend.onrender.com
   ```

4. **Redeploy both** to apply env variable changes

---

## 🐛 Troubleshooting

### Build fails with "package.json not found"
- ✅ Set Root Directory to `frontend`

### CORS errors in browser
- ✅ Add frontend URL to `ALLOWED_ORIGINS` in backend
- ✅ Include protocol (https://) and no trailing slash

### API calls fail
- ✅ Check `VITE_API_BASE_URL` is set correctly
- ✅ Test backend health endpoint directly
- ✅ Check browser Network tab for 404s

### Backend won't start
- ✅ Ensure Python version is 3.11 or higher
- ✅ Check `requirements.txt` is valid
- ✅ View logs in Render dashboard

---

## 📝 Quick Reference

**Frontend URL**: `https://matchpoint-frontend.onrender.com`
**Backend URL**: `https://matchpoint-backend.onrender.com`

**Free Tier Notes**:
- Services spin down after 15 min of inactivity
- First request after sleep takes ~30 seconds
- Upgrade to paid plan for always-on services

---

Good luck! 🚀

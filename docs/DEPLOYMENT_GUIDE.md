# 🚀 LegalMind AI - Deployment Guide

Complete guide for deploying LegalMind AI to Render.com (Free Tier)

---

## 📋 Prerequisites

1. **GitHub Account** - Repository already at: `https://github.com/pgaur1/LegalMind-AI.git`
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **HuggingFace Token** - Get from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)

---

## 🔐 Get HuggingFace API Token

1. Go to [huggingface.co](https://huggingface.co)
2. Create account / Sign in
3. Go to **Settings → Access Tokens**
4. Click **New token**
5. Name: `LegalMind-Render`
6. Type: **Read**
7. Click **Generate**
8. Copy token (starts with `hf_...`)

**Example token format:**
```
hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📦 Step 1: Push to GitHub

```bash
cd LegalMind-AI

# Check status
git status

# Add all files
git add .

# Commit
git commit -m "feat: Deploy-ready LegalMind AI with multi-provider LLM support

- Add HuggingFace provider for free tier deployment
- Add AWS Bedrock provider for production (optional)
- Organize into deployment-ready structure
- Include FAISS vector store (11 MB, 4,986 documents)
- Include NetworkX knowledge graph (143 entities)
- Add Render deployment configuration
- Add comprehensive documentation

Tech Stack:
- Frontend: React 18 + Vite + Tailwind
- Backend: FastAPI + Python 3.11
- LLM: HuggingFace Inference API (Qwen/Qwen2.5-7B-Instruct)
- RAG: FAISS + Sentence Transformers
- Graph: NetworkX
- Deployment: Render.com (Free Tier)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to development branch
git push origin development
```

---

## 🌐 Step 2: Deploy Backend on Render

### 2.1 Create Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository: `pgaur1/LegalMind-AI`
4. Select branch: **development**

### 2.2 Configure Backend Service

**Basic Settings:**
- **Name:** `legalmind-backend`
- **Region:** Singapore (or closest to you)
- **Branch:** `development`
- **Root Directory:** Leave empty
- **Environment:** Python 3
- **Build Command:**
  ```bash
  pip install -r backend/requirements.txt
  ```
- **Start Command:**
  ```bash
  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 120
  ```

### 2.3 Environment Variables

Click **Add Environment Variable** for each:

| Key | Value | Secret? |
|-----|-------|---------|
| `LLM_PROVIDER` | `huggingface` | No |
| `HF_TOKEN` | `your_huggingface_token_here` | **Yes** ✓ |
| `HF_MODEL` | `Qwen/Qwen2.5-7B-Instruct` | No |
| `PORT` | `8000` | No |
| `DEBUG` | `false` | No |
| `LOG_LEVEL` | `INFO` | No |
| `PYTHONUNBUFFERED` | `1` | No |

### 2.4 Advanced Settings

- **Plan:** Free
- **Auto-Deploy:** Yes
- **Health Check Path:** `/health`

### 2.5 Deploy

1. Click **Create Web Service**
2. Wait 10-15 minutes for first deployment
3. Watch build logs
4. Once deployed, copy backend URL: `https://legalmind-backend.onrender.com`

---

## 🎨 Step 3: Deploy Frontend on Render

### 3.1 Create Static Site

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Static Site**
3. Select repository: `pgaur1/LegalMind-AI`
4. Branch: **development**

### 3.2 Configure Frontend Service

**Basic Settings:**
- **Name:** `legalmind-frontend`
- **Branch:** `development`
- **Root Directory:** Leave empty
- **Build Command:**
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory:** `frontend/dist`

### 3.3 Environment Variables

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://legalmind-backend.onrender.com` |

**⚠️ Important:** Use YOUR actual backend URL from Step 2.5

### 3.4 Rewrite Rules

Render automatically adds for React Router:
```
/* -> /index.html
```

### 3.5 Deploy

1. Click **Create Static Site**
2. Wait 5-10 minutes
3. Once deployed, copy frontend URL: `https://legalmind-frontend.onrender.com`

---

## ✅ Step 4: Verify Deployment

### 4.1 Backend Health Check

Visit: `https://legalmind-backend.onrender.com/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "app": "LegalMind AI",
  "version": "1.0.0",
  "timestamp": 1696262400.123
}
```

### 4.2 Backend API Docs

Visit: `https://legalmind-backend.onrender.com/docs`

Should show FastAPI Swagger UI with all endpoints.

### 4.3 Backend Status

Visit: `https://legalmind-backend.onrender.com/api/v1/status`

**Expected Response:**
```json
{
  "api_version": "v1",
  "app_name": "LegalMind AI",
  "features": {
    "research": "active",
    "draft_generation": "active",
    ...
  },
  "llm": {
    "model": "HuggingFace - Qwen/Qwen2.5-7B-Instruct"
  }
}
```

### 4.4 Frontend

Visit: `https://legalmind-frontend.onrender.com`

Should show the LegalMind AI dashboard.

### 4.5 End-to-End Test

1. Open frontend URL
2. Navigate to **Research** page
3. Enter test query: `"RERA delayed possession compensation"`
4. Submit
5. Wait 15-20 seconds
6. Should see AI response with sources (RAG + Graph + Web)

---

## 🎯 Post-Deployment

### Update Frontend API URL

If you need to update the backend URL in frontend:

1. Go to Render Dashboard → `legalmind-frontend`
2. Click **Environment**
3. Edit `VITE_API_BASE_URL`
4. Save
5. Render will auto-redeploy

### Monitor Logs

**Backend Logs:**
```
Render Dashboard → legalmind-backend → Logs
```

**Frontend Logs:**
```
Render Dashboard → legalmind-frontend → Logs
```

### Custom Domain (Optional)

1. Go to service settings
2. Click **Add Custom Domain**
3. Enter your domain
4. Update DNS records as shown
5. Wait for SSL certificate

---

## 🔧 Troubleshooting

### Backend Issues

**Issue:** "Application failed to respond"
- Check environment variables are set
- Check `HF_TOKEN` is correct
- Review logs for errors

**Issue:** "Module not found"
- Verify build command installs requirements
- Check all imports use correct paths

**Issue:** "LLM generation failed"
- Verify HF token has read permissions
- Check HuggingFace model is accessible
- Try different model (e.g., `mistralai/Mistral-7B-Instruct-v0.2`)

### Frontend Issues

**Issue:** "Failed to fetch"
- Verify `VITE_API_BASE_URL` points to backend
- Check CORS is configured in backend
- Verify backend is running

**Issue:** "Blank page"
- Check build logs for errors
- Verify publish directory is `frontend/dist`
- Check browser console for errors

### Performance

**Free Tier Limitations:**
- Backend sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds
- Limited CPU and memory

**Solutions:**
- Use Render's paid tier for always-on
- Add uptime monitoring (e.g., UptimeRobot)
- Optimize large data files

---

## 💰 Cost Breakdown

### Free Tier (Current)
- **Backend Web Service:** Free (sleeps after 15 min)
- **Frontend Static Site:** Free (100 GB bandwidth/month)
- **Total:** $0/month

### Limitations
- Backend sleeps when inactive
- 750 hours/month runtime
- Limited resources

### Upgrade Options

**Starter Plan ($7/month):**
- Always-on backend
- 400 build minutes
- Better performance

**Team Plan ($19/month):**
- Priority support
- More build minutes
- Shared resources

---

## 📊 Monitoring

### Health Checks

Backend health endpoint runs every 30 seconds:
```
GET /health
```

### Logs

All logs available in Render Dashboard:
- Application logs
- Build logs
- System logs

### Metrics (Paid Plans)

- CPU usage
- Memory usage
- Request count
- Response times

---

## 🔄 CI/CD

### Auto-Deploy on Git Push

Render automatically deploys when you push to `development`:

```bash
git add .
git commit -m "Update feature X"
git push origin development
```

Render will:
1. Detect push
2. Run build commands
3. Deploy new version
4. Health check
5. Serve new version

### Manual Deploy

In Render Dashboard:
1. Go to service
2. Click **Manual Deploy**
3. Select branch
4. Click **Deploy**

---

## 🎉 Success!

Your LegalMind AI is now live at:
- **Frontend:** `https://legalmind-frontend.onrender.com`
- **Backend:** `https://legalmind-backend.onrender.com`
- **API Docs:** `https://legalmind-backend.onrender.com/docs`

Share the frontend URL with your team! 🚀

---

## 📞 Support

**Issues:**
- GitHub Issues: [Create Issue](https://github.com/pgaur1/LegalMind-AI/issues)
- Email: prgaur@capgemini.com

**Documentation:**
- Main README: [README.md](../README.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Deployment completed successfully! 🎊**

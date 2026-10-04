# Deploy LegalMind AI to Render

This repository includes a Render Blueprint at the repository root. It creates
the FastAPI backend and Vite static frontend and configures both to auto-deploy
from the `development-test` branch.

## Prerequisites

- The `development-test` branch has been pushed to `pgaur1/LegalMind-AI` on GitHub.
- The GitHub account is connected to Render and can access that repository.
- A Groq API key with access to the selected model.

## Create the Render services

1. In Render, choose **New + → Blueprint** and connect `pgaur1/LegalMind-AI`.
2. Select the `development-test` branch and the root `render.yaml` Blueprint.
3. Review the two services and apply the Blueprint.
4. When prompted, set `GROQ_API_KEY` on `legalmind-backend` to the Groq API
   key. Keep it as a secret; do not add it to GitHub or a frontend variable.
5. Wait for the backend and frontend deploys to finish.

The Blueprint sets `VITE_API_BASE_URL` to
`https://legalmind-backend.onrender.com` and allows the frontend origin
`https://legalmind-frontend.onrender.com`. If you change either Render service
name or add a custom domain, update the corresponding values in `render.yaml`
and redeploy both services.

## Verify the deployment

- Backend health: `https://legalmind-backend.onrender.com/health`
- Backend readiness: `https://legalmind-backend.onrender.com/readiness`
- API status: `https://legalmind-backend.onrender.com/api/v1/status`
- API documentation: `https://legalmind-backend.onrender.com/docs`
- Frontend: `https://legalmind-frontend.onrender.com`

Open the frontend and try the Research page. The first backend request may take
longer because Render's free web service can spin down while idle.

To run the repository smoke checks against the live backend, run this from the
repository root:

```bash
API_BASE_URL=https://legalmind-backend.onrender.com python test_all_endpoints.py
```

For local Groq generation, set `GROQ_API_KEY` in the backend environment.
Groq generation also requires available account usage and access to the
configured model. To use Hugging Face instead, set `LLM_PROVIDER=huggingface`
and configure `HF_TOKEN` and `HF_MODEL`.

## GitHub auto-deploy

After the Blueprint is connected, pushes to `development-test` trigger Render
deploys for the affected services:

```bash
git add .
git commit -m "Describe the change"
git push origin development-test
```

Confirm the push appears on GitHub before checking the deploy events and build
logs for each service in the Render dashboard. This repository configuration
cannot connect GitHub to a Render account or create the services on its own;
complete the one-time Blueprint setup in Render.

## Troubleshooting

- **Backend does not become healthy:** inspect the backend build/runtime logs and
  confirm `GROQ_API_KEY` is set. The health endpoint does not require a token, but
  LLM-backed features do.
- **Frontend reports a fetch/CORS error:** confirm `VITE_API_BASE_URL` points to
  the live backend and `CORS_ORIGINS` includes the exact frontend origin. Vite
  environment variables are applied at build time, so redeploy the frontend
  after changing them.
- **Research has no document results:** verify the committed vector-store files
  are present in the branch and inspect backend logs for embedding-model loading
  errors.

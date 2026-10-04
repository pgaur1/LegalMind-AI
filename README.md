# 🏛️ LegalMind AI

**Agentic AI Platform for Legal Operations**

AI-powered legal research, document generation, and compliance tracking system leveraging RAG (Retrieval-Augmented Generation), Knowledge Graphs, and Web Scraping.

---

## 🌟 Features

### Core Capabilities

- **🔍 AI Research Co-Pilot**
  - Hybrid retrieval: RAG (FAISS) + Knowledge Graph (NetworkX) + Web Scraping
  - 4,986 legal documents indexed
  - 143 legal entities (acts, sections, cases)
  - Natural language query processing

- **📝 Legal Document Generation**
  - Auto-generate legal notices, complaints, affidavits
  - Context-aware drafting with legal citations
  - 10-15 second generation time
  - Multiple document templates

- **📚 Precedent Search**
  - Search across case law database
  - Entity extraction and linking
  - Relevant precedent recommendations

- **📅 Compliance Tracking**
  - Deadline management calendar
  - Order tracking with status updates
  - Automated reminders

- **📊 Dashboard & Analytics**
  - Activity overview
  - Performance metrics
  - Case statistics

---

## 🏗️ Architecture

```
LegalMind-AI/
│
├── frontend/              # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── pages/        # 12 page components
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API communication
│   │   ├── store/        # Zustand state management
│   │   └── data/         # Mock data
│   ├── package.json
│   └── vite.config.js
│
├── backend/              # FastAPI + Python 3.12
│   ├── api/             # API endpoints (5 routers)
│   ├── services/        # Core services (LLM, RAG, Graph, Web)
│   ├── agents/          # AI agents (Research, Planner)
│   ├── llm/             # 🆕 Multi-provider LLM support
│   │   ├── huggingface_provider.py   # HuggingFace Inference API
│   │   ├── bedrock_provider.py        # AWS Bedrock Claude
│   │   └── provider_factory.py        # Provider selection
│   ├── models/          # Database models
│   ├── utils/           # Utilities
│   ├── config/          # Configuration
│   ├── main.py          # FastAPI app entry point
│   └── requirements.txt
│
├── vector_store/         # FAISS vector database (11 MB)
│   ├── faiss_index.bin
│   ├── metadata.json
│   └── chunks/
│
├── knowledge_graph/      # NetworkX graph data (117 KB)
│   ├── acts.json         # 12 legal acts
│   ├── sections.json     # 67 sections
│   ├── cases.json        # 64 case precedents
│   └── relationships.json
│
├── deployment/           # Container deployment files
│   ├── Dockerfile        # Docker container
│   └── startup.sh        # Startup script
├── render.yaml           # Render Blueprint (development-test branch)
│
├── docs/                 # Documentation
│
├── README.md
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

**Backend:**
- Python 3.12+
- pip

**Frontend:**
- Node.js 18+
- npm

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/pgaur1/LegalMind-AI.git
cd LegalMind-AI
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GROQ_API_KEY
```

**Environment Variables:**

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
PORT=8000
```

**Start Backend:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --timeout-keep-alive 120
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

With the backend running, verify endpoint health and route registration from the
repository root:

```bash
python test_all_endpoints.py
```

This smoke test checks the root, health, readiness (including the FAISS index
and metadata count), configured LLM provider, OpenAPI route registration,
and ten health-request timings. To test a different server URL, set
`API_BASE_URL`. Groq text generation requires a valid `GROQ_API_KEY` and model
access. Hugging Face remains available by setting `LLM_PROVIDER=huggingface`
and configuring `HF_TOKEN` and `HF_MODEL`.

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed
```

**Start Frontend:**

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## 🤖 LLM Provider Configuration

### Groq (Default)

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

Keep the Groq key in the backend environment. Never put it in a frontend
environment variable or commit it to the repository.

Hugging Face is also supported:

```env
LLM_PROVIDER=huggingface
HF_TOKEN=your_huggingface_token_here
HF_MODEL=zai-org/GLM-5.2
```

---

## 📦 Deployment

### Deploy to Render.com (Free Tier)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin development
   ```

2. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up / Log in
   - Connect your GitHub repository

3. **Configure Services:**

   **Backend (Web Service):**
   - Type: Web Service
   - Environment: Python
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --timeout-keep-alive 120`
   - Environment Variables:
     - `LLM_PROVIDER`: `groq`
     - `GROQ_API_KEY`: set as a secret
     - `GROQ_MODEL`: `openai/gpt-oss-20b`

   **Frontend (Static Site):**
   - Type: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`
   - Environment Variables:
     - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`

4. **Deploy:**
   - Render will auto-deploy on every push to `development` branch
   - First deploy takes ~10-15 minutes

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Language:** Python 3.12
- **LLM:**
  - Groq chat completions (`openai/gpt-oss-20b`, default)
  - Hugging Face Inference API (optional)
- **RAG:** FAISS + Sentence Transformers
- **Knowledge Graph:** NetworkX
- **Web Scraping:** Scrapling
- **Database:** SQLite (with async support)
- **Validation:** Pydantic

### Data & AI
- **Vector Store:** FAISS (11 MB, 4,986 documents)
- **Graph Database:** NetworkX JSON (143 entities)
- **Embeddings:** BGE (sentence-transformers)
- **LLM Models:**
  - openai/gpt-oss-20b (Groq, default)
  - zai-org/GLM-5.2 (Hugging Face, optional)

---

## 📊 Data Files

### Vector Store (11 MB)
- `faiss_index.bin` - FAISS vector index
- `metadata.json` - Document metadata
- 4,986 legal documents embedded

### Knowledge Graph (117 KB)
- `acts.json` - 12 legal acts (RERA, Consumer Protection, etc.)
- `sections.json` - 67 sections
- `cases.json` - 64 case precedents
- `relationships.json` - Entity relationships

**Total Data Size:** ~34 MB (Git repo)

---

## 🔧 API Endpoints

### Research
- `POST /api/v1/research/query` - AI research query

### Drafts
- `POST /api/v1/drafts/generate` - Generate legal draft
- `GET /api/v1/drafts` - List drafts

### Precedents
- `GET /api/v1/precedents/search` - Search precedents

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order details

### Dashboard
- `GET /api/v1/dashboard/stats` - Dashboard statistics

### System
- `GET /health` - Health check
- `GET /api/v1/status` - Detailed status

---

## 🔒 Security

- **API Keys:** Store in environment variables, never commit
- **CORS:** Configured for specific origins
- **Secrets:** Use Render environment variables for GROQ_API_KEY
- **HTTPS:** Automatically enabled on Render

---

## 📝 License

This project is proprietary software developed for Capgemini PMI CA.

---

## 🤝 Contributing

This is an internal project. For questions or contributions, contact the development team.

---

## 📞 Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/pgaur1/LegalMind-AI/issues)
- Email: prgaur@capgemini.com

---

## 🎯 Roadmap

- [ ] Additional LLM providers (OpenAI, Azure OpenAI)
- [ ] Enhanced knowledge graph with more entities
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app support
- [ ] Multi-language support (Hindi, other Indian languages)

---

**Built with ❤️ by Capgemini PMI CA Team**

**Version:** 1.0.0  
**Last Updated:** October 2026

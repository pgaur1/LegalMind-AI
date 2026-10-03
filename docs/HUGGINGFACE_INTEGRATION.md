# 🤖 HuggingFace LLM Integration Guide

**Date:** October 4, 2026  
**LLM Provider:** HuggingFace Inference API  
**Model:** GLM-5.2 (`zai-org/GLM-5.2`)

---

## 📋 Overview

LegalMind AI now uses **HuggingFace Inference API** for all LLM operations. AWS Bedrock has been completely removed from the `development` branch.

### **Key Features:**

- ✅ **Chat Completions API** (OpenAI-compatible)
- ✅ **Robust Error Handling** (authentication, rate limits, retries)
- ✅ **Exponential Backoff** for retryable errors
- ✅ **Configurable via Environment** (no code changes needed)
- ✅ **GLM-5.2 Model** with reasoning capability
- ✅ **Free Tier Support** (low-volume usage)

---

## 🔧 Configuration

### **Environment Variables**

All configuration is done via environment variables in `.env`:

```env
# ============================================================================
# LLM Provider (HuggingFace Only)
# ============================================================================
LLM_PROVIDER=huggingface

# HuggingFace API Configuration
HF_TOKEN=your_huggingface_token_here
HF_MODEL=zai-org/GLM-5.2
HF_API_URL=https://router.huggingface.co/v1/chat/completions

# Request Configuration
HF_REQUEST_TIMEOUT_SECONDS=120
HF_MAX_RETRIES=3

# Generation Parameters (Defaults)
HF_MAX_TOKENS=1000
HF_TEMPERATURE=0.1
```

### **Get HuggingFace Token:**

1. Go to: https://huggingface.co/settings/tokens
2. Click **New token**
3. Name: `LegalMind-AI`
4. Type: **Read**
5. Click **Generate**
6. Copy token (starts with `hf_...`)

---

## 🏗️ Architecture

### **Provider Pattern**

```
backend/llm/
├── base_provider.py          # Abstract interface
├── huggingface_provider.py   # HuggingFace implementation
├── provider_factory.py       # Provider selection
└── exceptions.py             # Custom exceptions
```

### **Error Handling**

**Retryable Errors** (with exponential backoff):
- `HTTP 429` - Rate limit exceeded
- `HTTP 500, 502, 503, 504` - Server errors
- Connection errors
- Timeouts

**Non-Retryable Errors** (immediate failure):
- `HTTP 401` - Authentication failed
- `HTTP 402` - Insufficient credits
- `HTTP 403` - Access denied
- `HTTP 404` - Model not found
- Invalid responses

### **Retry Strategy**

```python
# Exponential backoff: 2, 4, 8 seconds
for attempt in range(1, max_retries + 1):
    try:
        return make_request()
    except RetryableError:
        wait_time = 2 ** attempt
        time.sleep(wait_time)
```

**Respects `Retry-After` header** when provided.

---

## 📝 Usage

### **In Your Code:**

```python
from llm import get_llm_provider

# Initialize provider
provider = get_llm_provider()

# Generate text
response = provider.generate(
    prompt="Explain Section 18 of RERA",
    system_prompt="You are a legal assistant",
    max_tokens=500,
    temperature=0.1
)

print(response)
```

### **With System Prompt:**

```python
response = provider.generate(
    prompt="Draft a legal notice for delayed possession",
    system_prompt="You are a legal drafter specializing in real estate law",
    max_tokens=800,
    temperature=0.0
)
```

### **Quick Generation:**

```python
# Uses defaults from environment
response = provider.generate(prompt="What is RERA?")
```

---

## 🧪 Testing

### **After Deployment:**

Run the test script to verify integration:

```bash
cd backend
export HF_TOKEN=your_token_here  # or set in .env
python test_hf_llm.py
```

**Expected Output:**
```
======================================================================
HUGGINGFACE LLM INTEGRATION TEST
======================================================================

Environment Check:
HF_TOKEN: Set ✅
HF_MODEL: zai-org/GLM-5.2
HF_API_URL: https://router.huggingface.co/v1/chat/completions

======================================================================
TEST 1: Provider Initialization
======================================================================
✅ Provider initialized: zai-org/GLM-5.2
✅ Token configured: Yes

======================================================================
TEST 2: Simple Text Generation
======================================================================
Prompt: What is the capital of France? Answer in one sentence.

Generating response...

Response:
The capital of France is Paris.

✅ Generation successful (31 chars)

======================================================================
TEST 3: Legal Content Generation
======================================================================
System: You are a legal assistant specializing in Indian law.
Prompt: Explain Section 18 of RERA 2016 in 3 bullet points.

Generating response...

Response:
• Section 18 of RERA 2016 deals with interest for delayed possession
• If promoter fails to deliver possession, must pay interest to allottee
• Interest rate: SBPLR + 2% or as prescribed by State Government

✅ Legal generation successful (215 chars)

======================================================================
TEST SUMMARY
======================================================================
✅ PASS - Provider Initialization
✅ PASS - Simple Generation
✅ PASS - Legal Generation

Total: 3/3 tests passed

🎉 All tests passed! HuggingFace integration is working!
======================================================================
```

---

## ⚠️ Error Messages & Solutions

### **"ERROR: HuggingFace provider not configured"**

**Cause:** HF_TOKEN environment variable not set

**Solution:**
```bash
export HF_TOKEN=your_token_here
# or add to .env file
```

---

### **"ERROR: Invalid or missing HF_TOKEN"**

**Cause:** Token is incorrect or expired

**Solution:**
1. Check token at: https://huggingface.co/settings/tokens
2. Generate new token if needed
3. Update HF_TOKEN in environment

---

### **"ERROR: Insufficient credits or billing required"**

**Cause:** Free tier credit exhausted

**Solution:**
- Wait for monthly reset
- Or upgrade to HuggingFace PRO
- Or reduce usage (lower max_tokens, fewer requests)

---

### **"ERROR: Rate limit exceeded"**

**Cause:** Too many requests in short time

**Solution:**
- Provider will auto-retry with backoff
- If persists, reduce request frequency
- Check quota at: https://huggingface.co/settings/billing

---

### **"ERROR: Model not found"**

**Cause:** Model name incorrect or not accessible

**Solution:**
1. Verify model exists: https://huggingface.co/zai-org/GLM-5.2
2. Check HF_MODEL environment variable
3. Try alternative: `mistralai/Mistral-7B-Instruct-v0.2`

---

### **"ERROR: Request timed out"**

**Cause:** Model loading or high server load

**Solution:**
- Provider will auto-retry
- Increase timeout: `HF_REQUEST_TIMEOUT_SECONDS=180`
- Try during off-peak hours

---

## 🔄 Model Selection

### **Current Model: GLM-5.2**

```env
HF_MODEL=zai-org/GLM-5.2
```

**Benefits:**
- Reasoning capability
- Good for legal analysis
- Supports chat format

### **Alternative Models:**

**For faster responses:**
```env
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

**For better quality:**
```env
HF_MODEL=meta-llama/Llama-3.2-8B-Instruct
```

**For coding tasks:**
```env
HF_MODEL=Qwen/Qwen2.5-Coder-7B-Instruct
```

**Note:** Model availability depends on your HuggingFace account and free tier limits.

---

## 📊 Usage Parameters

### **For Legal Research** (comprehensive answers):
```python
provider.generate(
    prompt=query,
    system_prompt="You are a legal research assistant",
    max_tokens=3000,
    temperature=0.3
)
```

### **For Draft Generation** (brief documents):
```python
provider.generate(
    prompt=draft_instructions,
    system_prompt="You are a legal drafter. Write SHORT documents.",
    max_tokens=500,
    temperature=0.0
)
```

### **For Quick Queries** (fast responses):
```python
provider.generate(
    prompt=question,
    max_tokens=200,
    temperature=0.1
)
```

---

## 🚀 Performance

### **Expected Response Times:**

| Task | max_tokens | Time | Notes |
|------|-----------|------|-------|
| Quick query | 200 | 2-5s | Short answers |
| Legal research | 1000 | 5-10s | Comprehensive |
| Draft generation | 500 | 3-8s | Brief documents |
| Long analysis | 3000 | 15-30s | Detailed reports |

**First request** may be slower (model loading): 30-60s

---

## 🔒 Security

### **Token Safety:**

✅ **DO:**
- Store HF_TOKEN in environment variables
- Use `.env` file (NOT committed to git)
- Set as **secret** in Render/GitHub

❌ **DON'T:**
- Hard-code token in code
- Commit token to git
- Expose token in frontend
- Log token in error messages

### **Backend-Only Access:**

```
Frontend (React)
    ↓
    HTTP Request
    ↓
Backend API (FastAPI)
    ↓
    HuggingFace API (with HF_TOKEN)
```

Token is **never exposed** to the browser.

---

## 📚 Resources

**HuggingFace:**
- Inference API Docs: https://huggingface.co/docs/api-inference/
- Models: https://huggingface.co/models
- Token Settings: https://huggingface.co/settings/tokens
- Pricing: https://huggingface.co/pricing

**LegalMind AI:**
- Main README: [../README.md](../README.md)
- Deployment Guide: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Migration Summary: [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

---

## 🎯 Next Steps

1. ✅ Set HF_TOKEN environment variable
2. ✅ Run test script to verify
3. ✅ Deploy to Render
4. ✅ Test on live deployment
5. ✅ Monitor usage and errors

---

**Integration Status:** ✅ Complete  
**AWS Bedrock:** ❌ Removed  
**Ready for Deployment:** ✅ Yes

---

**Questions?** Check the error messages section or refer to HuggingFace documentation.

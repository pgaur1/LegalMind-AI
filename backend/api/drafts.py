"""
Draft Generation API
Legal document drafting with AI assistance
Enhanced with RAG + Graph + Web retrieval for context
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from loguru import logger
import asyncio
from concurrent.futures import ThreadPoolExecutor

from services.llm_service import LLMService
from services.rag_service import get_rag_service
from services.graph_service import get_graph_service
from services.web_service import get_web_service
from llm.exceptions import LLMProviderError

# Create router
router = APIRouter(
    prefix="/drafts",
    tags=["Drafts"],
    responses={404: {"description": "Not found"}},
)

# Initialize services
llm_service = LLMService()
rag_service = get_rag_service()
graph_service = get_graph_service()
web_service = get_web_service()

# Pydantic models
class DraftRequest(BaseModel):
    draft_type: str  # legal_notice, complaint, affidavit, petition
    client_name: str
    opponent_name: str
    case_description: str
    legal_context: Optional[str] = None

class DraftResponse(BaseModel):
    draft_id: str
    draft_type: str
    content: str
    created_at: str
    word_count: int
    sources: Optional[List[Dict]] = []  # RAG + Graph + Web sources used

# In-memory storage (production should use database)
drafts_db = {}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def _fetch_rag_sources(case_description: str) -> tuple[List[str], List[Dict]]:
    """Fetch RAG sources in parallel"""
    research_context = []
    sources = []

    if not rag_service.initialized:
        return research_context, sources

    try:
        logger.info("⚡ RAG search starting...")
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            rag_results = await loop.run_in_executor(
                executor,
                lambda: rag_service.search(case_description, top_k=2)
            )

        for idx, result in enumerate(rag_results[:2]):
            text = result.get('text', result.get('content', ''))[:500]
            research_context.append(f"[RAG Source {idx+1}]: {text}")

            sources.append({
                "source_type": "rag",
                "content": text,
                "similarity": result.get('similarity_score', 0),
                "document_id": result.get('doc_id', f'doc_{idx+1}')
            })

        logger.success(f"✓ RAG: {len(rag_results)} sources")
    except Exception as e:
        logger.error(f"RAG search failed: {e}")

    return research_context, sources


async def _fetch_graph_sources(case_description: str) -> tuple[List[str], List[Dict]]:
    """Fetch Graph sources in parallel"""
    research_context = []
    sources = []

    if not graph_service.initialized:
        return research_context, sources

    try:
        logger.info("⚡ Graph search starting...")
        keywords = _extract_keywords(case_description)

        for keyword in keywords[:2]:
            for entity_type in ['act', 'section', 'case']:
                loop = asyncio.get_event_loop()
                with ThreadPoolExecutor() as executor:
                    entities = await loop.run_in_executor(
                        executor,
                        lambda et=entity_type, kw=keyword: graph_service.search_entities(kw, entity_type=et, limit=1)
                    )

                for entity in entities:
                    entity_name = entity.get('name') or entity.get('case_name') or entity.get('section_number')

                    # Get content based on entity type
                    content = (
                        entity.get('content') or
                        entity.get('summary') or
                        entity.get('description') or
                        entity.get('full_name') or
                        entity.get('title') or
                        ''
                    )

                    if content and entity_name:
                        research_context.append(
                            f"[Graph {entity_type.upper()}]: {entity_name} - {content[:300]}"
                        )

                        sources.append({
                            "source_type": "graph",
                            "entity_type": entity_type,
                            "name": entity_name,
                            "content": content[:300],
                            "entity_id": entity.get('entity_id')
                        })

                    if len([s for s in sources if s['source_type'] == 'graph']) >= 2:
                        break

            if len([s for s in sources if s['source_type'] == 'graph']) >= 2:
                break

        graph_count = len([s for s in sources if s['source_type'] == 'graph'])
        logger.success(f"✓ Graph: {graph_count} sources")
    except Exception as e:
        logger.error(f"Graph search failed: {e}")

    return research_context, sources


async def _fetch_web_sources(case_description: str) -> tuple[List[str], List[Dict]]:
    """Fetch Web sources in parallel"""
    research_context = []
    sources = []

    try:
        logger.info("⚡ Web search starting...")
        loop = asyncio.get_event_loop()
        with ThreadPoolExecutor() as executor:
            web_results = await loop.run_in_executor(
                executor,
                lambda: web_service.search_web(case_description, max_results=2, use_live_scraping=False)
            )

        for idx, result in enumerate(web_results[:2]):
            case_name = result.get('case_name', 'Case')
            snippet = result.get('snippet', result.get('text', ''))[:300]

            research_context.append(
                f"[Web Case Law]: {case_name} - {snippet}"
            )

            sources.append({
                "source_type": "web",
                "case_name": case_name,
                "snippet": snippet,
                "website": result.get('website', 'Web'),
                "url": result.get('url')
            })

        logger.success(f"✓ Web: {len(web_results)} sources")
    except Exception as e:
        logger.error(f"Web search failed: {e}")

    return research_context, sources


async def fetch_draft_context(case_description: str, draft_type: str) -> tuple[List[str], List[Dict]]:
    """
    Fetch context from RAG, Graph, and Web sources IN PARALLEL for maximum speed.

    Args:
        case_description: Description of the case
        draft_type: Type of draft being generated

    Returns:
        Tuple of (research_context_strings, source_metadata)
    """
    logger.info(f"🚀 Fetching context PARALLEL for draft: {draft_type}")

    # Run all three searches IN PARALLEL!
    results = await asyncio.gather(
        _fetch_rag_sources(case_description),
        _fetch_graph_sources(case_description),
        _fetch_web_sources(case_description),
        return_exceptions=True
    )

    # Combine results
    research_context = []
    sources = []

    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Parallel search failed: {result}")
            continue

        ctx, srcs = result
        research_context.extend(ctx)
        sources.extend(srcs)

    logger.success(f"⚡ PARALLEL fetch complete: {len(sources)} total sources")
    logger.info(f"  RAG: {len([s for s in sources if s['source_type'] == 'rag'])}")
    logger.info(f"  Graph: {len([s for s in sources if s['source_type'] == 'graph'])}")
    logger.info(f"  Web: {len([s for s in sources if s['source_type'] == 'web'])}")

    return research_context, sources


def _extract_keywords(text: str) -> List[str]:
    """Extract legal keywords from text"""
    import re
    keywords = []
    text_lower = text.lower()

    # Extract section references
    section_patterns = [
        r'section\s+(\d+[a-z]?)',
        r'sec\.?\s+(\d+[a-z]?)',
    ]
    for pattern in section_patterns:
        matches = re.findall(pattern, text_lower)
        for match in matches:
            keywords.append(f"Section {match}")

    # Extract act names
    act_keywords = [
        'RERA', 'Real Estate', 'IRDAI', 'Insurance',
        'Consumer Protection', 'Arbitration', 'Contract',
        'delayed possession', 'compensation', 'mental agony'
    ]
    for act_keyword in act_keywords:
        if act_keyword.lower() in text_lower:
            keywords.append(act_keyword)

    return keywords if keywords else [text[:50]]

@router.post("/generate", response_model=DraftResponse)
async def generate_draft(request: DraftRequest):
    """
    Generate legal draft document using AI with RAG + Graph + Web context

    Supported draft types:
    - legal_notice: Legal notice for disputes
    - complaint: Consumer complaint
    - affidavit: Sworn statement
    - petition: Court petition

    The system automatically:
    1. Searches 4,986 legal documents (RAG) - fetches 2 most relevant
    2. Queries Knowledge Graph (143 entities) - fetches 2 relevant Acts/Sections/Cases
    3. Retrieves recent case law (Web) - fetches 2 relevant cases
    4. Uses all context to generate comprehensive, well-cited drafts
    """
    import time

    request_start = time.time()
    logger.info(f"Draft generation request: {request.draft_type} for {request.client_name}")

    # Initialize LLM if not loaded
    if not llm_service.model_loaded:
        init_start = time.time()
        logger.info("Loading AWS Bedrock LLM...")
        llm_service.load_model()
        init_time = time.time() - init_start
        logger.info(f"⏱️ TIME: LLM init took {init_time:.2f}s")

    # Initialize services if not already done
    services_start = time.time()
    if not rag_service.initialized:
        logger.info("Initializing RAG service...")
        rag_service.initialize()
    if not graph_service.initialized:
        logger.info("Initializing Graph service...")
        graph_service.initialize()
    if not web_service.initialized:
        logger.info("Initializing Web service...")
        web_service.initialize()
    services_time = time.time() - services_start
    if services_time > 0.1:
        logger.info(f"⏱️ TIME: Services init took {services_time:.2f}s")

    # Fetch context from RAG + Graph + Web (IN PARALLEL!)
    context_start = time.time()
    logger.info("🚀 Fetching context from RAG + Graph + Web IN PARALLEL...")
    research_context, sources = await fetch_draft_context(
        case_description=request.case_description,
        draft_type=request.draft_type
    )
    context_time = time.time() - context_start
    logger.info(f"⚡ TIME: PARALLEL context fetch took {context_time:.2f}s")

    # Add user-provided context if any
    if request.legal_context:
        research_context.insert(0, f"[User Context]: {request.legal_context}")

    logger.info(f"Context gathered: {len(research_context)} sources")
    logger.info(f"  RAG: {len([s for s in sources if s['source_type'] == 'rag'])}")
    logger.info(f"  Graph: {len([s for s in sources if s['source_type'] == 'graph'])}")
    logger.info(f"  Web: {len([s for s in sources if s['source_type'] == 'web'])}")

    # Prepare case details
    case_details = {
        "client_name": request.client_name,
        "opponent_name": request.opponent_name,
        "type": request.draft_type,
        "description": request.case_description
    }

    # Generate draft using LLM with enhanced context
    try:
        llm_start = time.time()
        logger.info("Generating draft with AWS Bedrock Claude...")
        draft_content = llm_service.generate_legal_draft(
            draft_type=request.draft_type,
            case_details=case_details,
            research_context=research_context
        )
        llm_time = time.time() - llm_start
        logger.success(f"Draft generated: {len(draft_content.split())} words")
        logger.info(f"⏱️ TIME: LLM generation took {llm_time:.2f}s")
    except LLMProviderError as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=502, detail="Draft generation failed") from e
    except Exception as e:
        logger.error(f"Draft generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Draft generation failed: {str(e)}")

    # Create draft ID
    draft_id = f"draft_{datetime.now().strftime('%Y%m%d%H%M%S')}"

    # Store draft with sources
    draft = {
        "draft_id": draft_id,
        "draft_type": request.draft_type,
        "content": draft_content,
        "created_at": datetime.now().isoformat(),
        "word_count": len(draft_content.split()),
        "client_name": request.client_name,
        "opponent_name": request.opponent_name,
        "sources": sources  # Include sources used
    }
    drafts_db[draft_id] = draft

    total_time = time.time() - request_start
    logger.info(f"Draft stored: {draft_id} ({draft['word_count']} words, {len(sources)} sources)")
    logger.success(f"⏱️ TOTAL TIME: {total_time:.2f}s")

    return DraftResponse(**draft)


@router.get("/{draft_id}")
async def get_draft(draft_id: str):
    """Get draft by ID"""
    if draft_id not in drafts_db:
        raise HTTPException(status_code=404, detail="Draft not found")

    return drafts_db[draft_id]

@router.get("/")
async def list_drafts(limit: int = 10):
    """List all drafts"""
    drafts = list(drafts_db.values())[-limit:]
    return {
        "total": len(drafts_db),
        "drafts": drafts
    }

@router.delete("/{draft_id}")
async def delete_draft(draft_id: str):
    """Delete draft"""
    if draft_id not in drafts_db:
        raise HTTPException(status_code=404, detail="Draft not found")

    del drafts_db[draft_id]
    return {"message": "Draft deleted successfully"}

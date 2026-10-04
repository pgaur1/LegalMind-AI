"""
LegalMind AI - Research API Endpoints
Handles legal research queries and chat interactions
"""

import json
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from loguru import logger
from fastapi.responses import StreamingResponse

import sys
sys.path.insert(0, '.')

from agents.research_agent import get_research_agent, ResearchResult
from config.config import settings
from utils.streaming import stream_sync_call


# ============================================================================
# ROUTER SETUP
# ============================================================================

router = APIRouter(
    prefix="/research",
    tags=["Research"],
    responses={404: {"description": "Not found"}},
)


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatMessage(BaseModel):
    """Chat message"""
    role: str = Field(..., description="Message role (user or assistant)")
    content: str = Field(..., description="Message content")
    sources: Optional[List[Dict]] = Field(None, description="Sources used (for assistant messages)")
    timestamp: Optional[str] = Field(None, description="Message timestamp")


class ResearchRequest(BaseModel):
    """Research query request"""
    query: str = Field(..., description="User's legal question", min_length=1)
    session_id: Optional[str] = Field(None, description="Chat session ID")
    chat_history: Optional[List[ChatMessage]] = Field([], description="Previous conversation messages")
    context: Optional[Dict] = Field(None, description="Additional context (case details, etc.)")
    user_id: Optional[str] = Field(settings.DEMO_USER_ID, description="User identifier")
    max_sources: Optional[int] = Field(5, description="Maximum sources to return")


class ResearchResponse(BaseModel):
    """Research query response"""
    response: str = Field(..., description="Generated response")
    sources: List[Dict] = Field(..., description="Sources used")
    decision: Dict = Field(..., description="Planner decision metadata")
    confidence: float = Field(..., description="Response confidence score")
    metadata: Dict = Field(..., description="Additional metadata")
    query_id: str = Field(..., description="Unique query identifier")
    timestamp: str = Field(..., description="Response timestamp")


class SessionResponse(BaseModel):
    """Chat session response"""
    session_id: str
    created_at: str
    last_active: str
    total_queries: int
    status: str


# ============================================================================
# API ENDPOINTS
# ============================================================================

@router.post("/chat", response_model=ResearchResponse)
async def research_chat(
    request: ResearchRequest,
    background_tasks: BackgroundTasks
) -> ResearchResponse:
    """
    Main research chat endpoint
    Handles legal research queries with context awareness

    Args:
        request: Research request with query and context

    Returns:
        Research response with answer and sources
    """
    try:
        logger.info(f"Research query: '{request.query[:60]}...'")

        # Get research agent
        agent = get_research_agent()

        # Initialize if needed
        if not agent.initialized:
            logger.info("Initializing research agent...")
            agent.initialize()

        # Convert chat history to dict format
        chat_history = None
        if request.chat_history:
            chat_history = [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "sources": msg.sources if hasattr(msg, 'sources') else None
                }
                for msg in request.chat_history
            ]

        # Execute research
        result: ResearchResult = agent.research(
            query=request.query,
            chat_history=chat_history,
            current_context=request.context,
            user_id=request.user_id
        )
        if result.metadata.get("error"):
            raise HTTPException(status_code=502, detail="Research generation failed")

        # Generate unique query ID
        query_id = f"q_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        # Build response
        response = ResearchResponse(
            response=result.response,
            sources=result.sources[:request.max_sources],
            decision=result.decision.to_dict(),
            confidence=result.confidence,
            metadata=result.metadata,
            query_id=query_id,
            timestamp=datetime.now().isoformat()
        )

        # TODO: Save to database in background
        # background_tasks.add_task(save_query_to_db, request, response)

        logger.success(f"Research completed: {len(result.sources)} sources, confidence: {result.confidence:.2f}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Research failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Research failed: {str(e)}"
        )


@router.post("/chat/stream")
async def research_chat_stream(request: ResearchRequest):
    """Stream generated research text as SSE, followed by sources and metadata."""
    logger.info(f"Streaming research query: '{request.query[:60]}...'")
    agent = get_research_agent()
    if not agent.initialized:
        agent.initialize()

    chat_history = [
        {
            "role": msg.role,
            "content": msg.content,
            "sources": msg.sources,
        }
        for msg in request.chat_history or []
    ] or None

    async def event_stream():
        try:
            yield f"data: {json.dumps({'type': 'status', 'message': 'Researching your question...'})}\n\n"
            result = None
            async for event, value in stream_sync_call(
                lambda on_token: agent.research(
                    query=request.query,
                    chat_history=chat_history,
                    current_context=request.context,
                    user_id=request.user_id,
                    on_token=on_token,
                )
            ):
                if event == "token":
                    yield f"data: {json.dumps({'type': 'delta', 'content': value})}\n\n"
                elif event == "error":
                    raise value
                else:
                    result = value

            if result.metadata.get("error"):
                raise HTTPException(status_code=502, detail="Research generation failed")

            response = ResearchResponse(
                response=result.response,
                sources=result.sources[:request.max_sources],
                decision=result.decision.to_dict(),
                confidence=result.confidence,
                metadata=result.metadata,
                query_id=f"q_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
                timestamp=datetime.now().isoformat(),
            )
            yield f"data: {json.dumps({'type': 'complete', 'data': response.model_dump()})}\n\n"
        except Exception as error:
            logger.error(f"Streaming research failed: {error}")
            detail = error.detail if isinstance(error, HTTPException) else "Research generation failed"
            yield f"data: {json.dumps({'type': 'error', 'message': detail})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    user_id: Optional[str] = settings.DEMO_USER_ID,
    limit: int = 10
):
    """
    List user's research sessions

    Args:
        user_id: User identifier
        limit: Maximum sessions to return

    Returns:
        List of session summaries
    """
    try:
        # TODO: Fetch from database
        # For now, return mock data
        sessions = [
            SessionResponse(
                session_id="session_001",
                created_at=datetime.now().isoformat(),
                last_active=datetime.now().isoformat(),
                total_queries=5,
                status="active"
            )
        ]

        return sessions

    except Exception as e:
        logger.error(f"Failed to list sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get session details with full chat history

    Args:
        session_id: Session identifier

    Returns:
        Session details
    """
    try:
        # TODO: Fetch from database
        return {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "messages": [],
            "total_queries": 0,
            "status": "active"
        }

    except Exception as e:
        logger.error(f"Failed to get session: {e}")
        raise HTTPException(status_code=404, detail="Session not found")


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete/archive a research session

    Args:
        session_id: Session identifier

    Returns:
        Success confirmation
    """
    try:
        # TODO: Mark as deleted in database
        return {"success": True, "message": f"Session {session_id} deleted"}

    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_research_stats():
    """
    Get research agent statistics and capabilities

    Returns:
        Agent stats and service status
    """
    try:
        agent = get_research_agent()
        stats = agent.get_stats()

        return {
            "agent_initialized": stats['initialized'],
            "services": stats['services'],
            "capabilities": stats['capabilities'],
            "demo_mode": settings.DEMO_MODE,
            "rag_index_path": str(settings.FAISS_INDEX_PATH),
            "rag_index_exists": settings.FAISS_INDEX_PATH.exists(),
        }

    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class FeedbackRequest(BaseModel):
    """Feedback submission request"""
    query_id: str = Field(..., description="Query identifier")
    rating: int = Field(..., ge=1, le=5, description="Rating (1-5)")
    feedback: Optional[str] = Field(None, description="Optional feedback text")


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    """
    Submit feedback for a research response

    Args:
        request: Feedback request

    Returns:
        Success confirmation
    """
    try:
        # TODO: Save to database
        logger.info(f"Feedback received for {request.query_id}: rating={request.rating}")

        return {
            "success": True,
            "message": "Feedback recorded",
            "query_id": request.query_id
        }

    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.post("/rebuild-index")
async def rebuild_index(background_tasks: BackgroundTasks):
    """
    Trigger FAISS index rebuild from processed documents
    (Admin/development endpoint)

    Returns:
        Task confirmation
    """
    try:
        if not settings.DEBUG:
            raise HTTPException(status_code=403, detail="Only available in debug mode")

        # Run rebuild in background
        def rebuild():
            agent = get_research_agent()
            if agent.rag_service.initialized:
                logger.info("Starting index rebuild...")
                success = agent.rag_service.rebuild_index_from_processed_data()
                if success:
                    logger.success("Index rebuild complete!")
                else:
                    logger.error("Index rebuild failed")

        background_tasks.add_task(rebuild)

        return {
            "success": True,
            "message": "Index rebuild started in background"
        }

    except Exception as e:
        logger.error(f"Failed to trigger rebuild: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HEALTH CHECK
# ============================================================================

@router.get("/health")
async def research_health():
    """
    Health check for research service

    Returns:
        Service health status
    """
    try:
        agent = get_research_agent()

        return {
            "status": "healthy" if agent.initialized else "initializing",
            "services": {
                "rag": agent.rag_service.initialized,
                "graph": agent.graph_service.initialized,
                "llm": agent.llm_service.model_loaded
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

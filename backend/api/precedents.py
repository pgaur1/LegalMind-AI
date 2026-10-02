"""
Precedent Search API
Search legal precedents and judgments using RAG
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import re

from services.rag_service import get_rag_service

# Create router
router = APIRouter(
    prefix="/precedents",
    tags=["Precedents"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models
class PrecedentSearchRequest(BaseModel):
    query: str
    court: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    limit: int = 10

class PrecedentResult(BaseModel):
    precedent_id: str
    title: str
    court: str
    year: str
    summary: str
    relevance_score: float

class PrecedentSearchResponse(BaseModel):
    query: str
    total_results: int
    precedents: List[PrecedentResult]

@router.post("/search", response_model=PrecedentSearchResponse)
async def search_precedents(request: PrecedentSearchRequest):
    """
    Search for legal precedents using RAG

    Searches across:
    - Supreme Court judgments
    - High Court judgments
    - Consumer forums decisions
    - RERA authority orders
    """

    # Get RAG service
    rag_service = get_rag_service()

    if not rag_service.initialized:
        rag_service.initialize()

    # Search using RAG
    try:
        results = rag_service.search(
            query=request.query,
            top_k=request.limit * 2  # Get more to allow filtering
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    # Filter and format results
    filtered_results = []
    for result in results:
        text = result.get('text', '')

        # Filter by court if specified
        if request.court:
            if request.court.lower() not in text.lower():
                continue

        # Extract year (look for 4-digit numbers 1900-2030)
        years = re.findall(r'\b(19\d{2}|20[0-2]\d|203[0])\b', text)
        year = years[0] if years else "Unknown"

        # Filter by year range if specified
        if request.year_from and year != "Unknown":
            if int(year) < request.year_from:
                continue
        if request.year_to and year != "Unknown":
            if int(year) > request.year_to:
                continue

        # Create precedent result
        precedent = PrecedentResult(
            precedent_id=result.get('chunk_id', 'unknown'),
            title=result.get('document_title', 'Untitled Judgment'),
            court=request.court or "Various Courts",
            year=year,
            summary=text[:400] + "..." if len(text) > 400 else text,
            relevance_score=result.get('similarity_score', 0.0)
        )
        filtered_results.append(precedent)

        # Stop if we have enough results
        if len(filtered_results) >= request.limit:
            break

    return PrecedentSearchResponse(
        query=request.query,
        total_results=len(filtered_results),
        precedents=filtered_results
    )

@router.get("/latest")
async def get_latest_precedents(limit: int = 5):
    """
    Get latest precedents

    Returns recent judgments and legal decisions
    """

    # Get RAG service
    rag_service = get_rag_service()
    if not rag_service.initialized:
        rag_service.initialize()

    # Search for recent judgments
    try:
        results = rag_service.search(
            query="recent judgment latest decision",
            top_k=limit
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    precedents = []
    for result in results:
        precedents.append({
            "precedent_id": result.get('chunk_id'),
            "title": result.get('document_title', 'Recent Judgment'),
            "court": "Various Courts",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "summary": result.get('text', '')[:300] + "..."
        })

    return {
        "total": len(precedents),
        "precedents": precedents
    }

@router.get("/{precedent_id}")
async def get_precedent(precedent_id: str):
    """
    Get full precedent details by ID

    Returns complete judgment text and metadata
    """

    # In production, fetch from database
    return {
        "precedent_id": precedent_id,
        "title": f"Legal Precedent {precedent_id}",
        "court": "Supreme Court of India",
        "year": "2024",
        "full_text": "Full judgment text would be retrieved from database...",
        "citations": [],
        "related_cases": []
    }

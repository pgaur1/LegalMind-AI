import asyncio
from unittest.mock import Mock

from api import precedents


def test_precedent_search_formats_results(monkeypatch):
    rag_service = Mock(initialized=True)
    rag_service.search.return_value = [
        {
            "text": "The Supreme Court considered RERA in 2020.",
            "chunk_id": "chunk-1",
            "document_title": "Test judgment",
            "similarity_score": 0.9,
        }
    ]
    monkeypatch.setattr(precedents, "get_rag_service", lambda: rag_service)

    response = asyncio.run(
        precedents.search_precedents(
            precedents.PrecedentSearchRequest(query="RERA", limit=1)
        )
    )

    assert response.total_results == 1
    assert response.precedents[0].precedent_id == "chunk-1"
    assert response.precedents[0].year == "2020"


def test_latest_precedents_formats_results(monkeypatch):
    rag_service = Mock(initialized=True)
    rag_service.search.return_value = [
        {
            "text": "A recent legal decision.",
            "chunk_id": "chunk-2",
            "document_title": "Latest judgment",
        }
    ]
    monkeypatch.setattr(precedents, "get_rag_service", lambda: rag_service)

    response = asyncio.run(precedents.get_latest_precedents(limit=1))

    assert response["total"] == 1
    assert response["precedents"][0]["precedent_id"] == "chunk-2"

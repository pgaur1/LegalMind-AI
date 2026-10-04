import asyncio
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import BackgroundTasks, HTTPException

from api import drafts, research
from llm.exceptions import LLMProviderError
from services.llm_service import LLMService


def test_generate_raises_when_provider_returns_error_text():
    service = LLMService()
    service.model_loaded = True
    service.provider = Mock()
    service.provider.get_model_name.return_value = "test-model"
    service.provider.generate.return_value = "ERROR: Insufficient credits"

    with pytest.raises(LLMProviderError, match="Insufficient credits"):
        service.generate("Test prompt")


def test_generate_returns_successful_provider_response():
    service = LLMService()
    service.model_loaded = True
    service.provider = Mock()
    service.provider.get_model_name.return_value = "test-model"
    service.provider.generate.return_value = "Generated answer"

    assert service.generate("Test prompt") == "Generated answer"


def test_legal_draft_uses_moderate_length_and_relevant_context():
    service = LLMService()
    service.generate = Mock(return_value="Generated legal draft")

    result = service.generate_legal_draft(
        draft_type="legal_notice",
        case_details={
            "client_name": "Client",
            "opponent_name": "Builder",
            "description": "The builder missed the agreed possession date.",
        },
        research_context=["RERA Section 18 provides a remedy for delayed possession."],
    )

    assert result == "Generated legal draft"
    prompt = service.generate.call_args.kwargs["prompt"]
    assert "300–400 words" in prompt
    assert "RERA Section 18" in prompt
    assert "do not make up section numbers or case citations" in prompt
    assert service.generate.call_args.kwargs["max_tokens"] == 1000


def test_legal_response_requests_renderable_markdown():
    service = LLMService()
    service.generate = Mock(return_value="## Legal analysis\n\n- First point")

    response = service.generate_legal_response(
        query="What are my options?",
        context=["Relevant legal context"],
    )

    assert response.startswith("## Legal analysis")
    prompt = service.generate.call_args.kwargs["prompt"]
    assert "Markdown headings" in prompt
    assert "Do not wrap the answer in a Markdown code fence." in prompt


def test_research_chat_returns_upstream_failure(monkeypatch):
    agent = Mock()
    agent.initialized = True
    agent.research.return_value = SimpleNamespace(metadata={"error": "HF credits exhausted"})
    monkeypatch.setattr(research, "get_research_agent", lambda: agent)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            research.research_chat(
                research.ResearchRequest(query="Test query"),
                BackgroundTasks(),
            )
        )

    assert error.value.status_code == 502


def test_rebuild_index_enqueues_task_without_running_it():
    background_tasks = BackgroundTasks()

    response = asyncio.run(research.rebuild_index(background_tasks))

    assert response["success"] is True
    assert len(background_tasks.tasks) == 1


def test_draft_generation_returns_upstream_failure(monkeypatch):
    llm_service = Mock(model_loaded=True)
    llm_service.generate_legal_draft.side_effect = LLMProviderError("HF credits exhausted")
    monkeypatch.setattr(drafts, "llm_service", llm_service)
    monkeypatch.setattr(drafts, "rag_service", SimpleNamespace(initialized=True))
    monkeypatch.setattr(drafts, "graph_service", SimpleNamespace(initialized=True))
    monkeypatch.setattr(drafts, "web_service", SimpleNamespace(initialized=True))

    async def no_context(*args, **kwargs):
        return [], []

    monkeypatch.setattr(drafts, "fetch_draft_context", no_context)

    with pytest.raises(HTTPException) as error:
        asyncio.run(
            drafts.generate_draft(
                drafts.DraftRequest(
                    draft_type="legal_notice",
                    client_name="Client",
                    opponent_name="Respondent",
                    case_description="Test case",
                )
            )
        )

    assert error.value.status_code == 502

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


def test_generate_stream_forwards_tokens_and_returns_combined_text():
    service = LLMService()
    service.model_loaded = True
    service.provider = Mock()
    service.provider.get_model_name.return_value = "test-model"
    service.provider.generate_stream.return_value = iter(["Hello", " world"])
    received = []

    result = service.generate("Test prompt", on_token=received.append)

    assert result == "Hello world"
    assert received == ["Hello", " world"]
    service.provider.generate.assert_not_called()


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
        research_context=[
            "[RAG Source]: RERA Section 18 provides a remedy for delayed possession.",
            "[Graph SECTION]: Section 18 covers delayed possession.",
            "[Web Case Law]: A court considered delayed possession relief.",
        ],
    )

    assert result == "Generated legal draft"
    prompt = service.generate.call_args.kwargs["prompt"]
    assert "400–500 words" in prompt
    assert "RERA Section 18" in prompt
    assert "Graph SECTION" in prompt
    assert "Web Case Law" in prompt
    assert "do not make up section numbers or case citations" in prompt
    assert service.generate.call_args.kwargs["max_tokens"] == 1400


def test_legal_response_requests_renderable_markdown():
    service = LLMService()
    service.generate = Mock(return_value="## Legal analysis\n\n- First point")

    response = service.generate_legal_response(
        query="What are my options?",
        context=["Relevant legal context"],
    )

    assert response.startswith("## Legal analysis")
    generation_call = service.generate.call_args.kwargs
    prompt = generation_call["prompt"]
    full_prompt = " ".join(
        f"{generation_call['system_prompt']}\n{prompt}".split()
    )
    assert "Markdown headings" in prompt
    assert "Do not wrap the answer in a Markdown code fence." in prompt
    assert "clear, conversational way" in full_prompt
    assert "Never create a table unless the user explicitly asks for one." in full_prompt
    assert "Prioritize the most relevant provisions" in full_prompt
    assert "do not impose a short word limit" in full_prompt
    assert "Do not invent section numbers, penalties, citations, or case names." in full_prompt


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


def test_research_chat_stream_forwards_tokens_and_final_sources(monkeypatch):
    decision = SimpleNamespace(to_dict=lambda: {"action": "full_research"})

    def research_call(**kwargs):
        kwargs["on_token"]("Streamed ")
        kwargs["on_token"]("answer")
        return SimpleNamespace(
            response="Streamed answer",
            sources=[{"source_type": "graph", "name": "RERA"}],
            decision=decision,
            confidence=0.9,
            metadata={},
        )

    agent = Mock(initialized=True, research=Mock(side_effect=research_call))
    monkeypatch.setattr(research, "get_research_agent", lambda: agent)

    async def read_stream():
        response = await research.research_chat_stream(
            research.ResearchRequest(query="Explain RERA"),
        )
        return "".join([chunk async for chunk in response.body_iterator])

    body = asyncio.run(read_stream())

    assert '"type": "delta", "content": "Streamed "' in body
    assert '"type": "delta", "content": "answer"' in body
    assert '"type": "complete"' in body
    assert '"source_type": "graph"' in body


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


def test_draft_generation_stream_sends_tokens_and_completed_draft(monkeypatch):
    llm_service = Mock(model_loaded=True)

    def generate_draft(**kwargs):
        kwargs["on_token"]("Draft ")
        kwargs["on_token"]("text")
        return "Draft text"

    llm_service.generate_legal_draft.side_effect = generate_draft
    monkeypatch.setattr(drafts, "llm_service", llm_service)
    monkeypatch.setattr(drafts, "rag_service", SimpleNamespace(initialized=True))
    monkeypatch.setattr(drafts, "graph_service", SimpleNamespace(initialized=True))
    monkeypatch.setattr(drafts, "web_service", SimpleNamespace(initialized=True))

    async def no_context(*args, **kwargs):
        return [], []

    monkeypatch.setattr(drafts, "fetch_draft_context", no_context)

    async def read_stream():
        response = await drafts.generate_draft_stream(
            drafts.DraftRequest(
                draft_type="legal_notice",
                client_name="Client",
                opponent_name="Builder",
                case_description="Delayed possession",
            )
        )
        return "".join([chunk async for chunk in response.body_iterator])

    body = asyncio.run(read_stream())

    assert '"type": "delta", "content": "Draft "' in body
    assert '"type": "delta", "content": "text"' in body
    assert '"type": "complete"' in body
    assert '"content": "Draft text"' in body

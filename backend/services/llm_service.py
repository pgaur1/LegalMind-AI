"""
LegalMind AI - LLM Service
Multi-Provider Support: HuggingFace, AWS Bedrock, etc.
"""

import re
from typing import Optional, Dict, List
from loguru import logger

# Import provider factory
from llm import get_llm_provider
from llm.exceptions import LLMProviderError

from config.config import settings


class LLMService:
    """
    LLM Service for legal document generation and analysis
    Supports multiple LLM providers via provider pattern
    """

    def __init__(self):
        self.provider = None
        self.model_loaded = False
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE

    def load_model(self) -> bool:
        """Initialize LLM provider"""
        if self.model_loaded:
            logger.info("LLM provider already initialized")
            return True

        try:
            logger.info("Initializing LLM provider...")

            # Get provider from factory (based on env config)
            self.provider = get_llm_provider()
            self.model_loaded = True

            logger.success(f"LLM provider initialized: {self.provider.get_model_name()}")

            return True

        except Exception as e:
            logger.error(f"Failed to initialize LLM provider: {e}")
            self.model_loaded = False
            self.provider = None
            return False

    def generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate text using configured LLM provider

        Args:
            prompt: User prompt
            max_tokens: Maximum tokens to generate (default from config)
            temperature: Sampling temperature (default from config)
            system_prompt: System prompt for context

        Returns:
            Generated text

        Raises:
            LLMProviderError: If the provider cannot generate a response
        """
        if not self.model_loaded or not self.provider:
            logger.warning("Provider not loaded, attempting to load...")
            if not self.load_model():
                raise LLMProviderError("LLM provider not available")

        try:
            # Use config defaults if not specified
            max_tokens = max_tokens or self.max_tokens
            temperature = temperature or self.temperature

            logger.info(f"Generating with {self.provider.get_model_name()} (max_tokens={max_tokens}, temp={temperature})")

            response = self.provider.generate(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                system_prompt=system_prompt
            )
            if response.startswith("ERROR:"):
                raise LLMProviderError(response.removeprefix("ERROR:").strip())

            logger.info(f"Generated {len(response.split())} words")
            return response

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def generate_legal_response(
        self,
        query: str,
        context: List[str],
        chat_history: Optional[List[Dict]] = None,
    ) -> str:
        """
        Generate legal research response with AWS Claude

        Args:
            query: User's legal question
            context: List of relevant document chunks
            chat_history: Previous conversation messages

        Returns:
            Legal research response

        Raises:
            LLMProviderError: If the provider cannot generate a response
        """
        logger.info(f"Generating legal response with AWS Claude for: {query[:50]}...")

        # Build system prompt for legal assistant
        system_prompt = """You are a legal research assistant specializing in Indian law.
Your role is to provide accurate, well-researched answers based on legal documents,
statutes, and court judgments. Always cite your sources and be precise."""

        # Build context section from retrieved documents
        context_text = "\n\n".join([
            f"[Source {i+1}]: {chunk[:1000]}"  # Limit each chunk to 1000 chars
            for i, chunk in enumerate(context[:5])  # Top 5 sources
        ])

        # Build chat history if exists
        history_text = ""
        if chat_history:
            history_text = "\n".join([
                f"{msg['role']}: {msg['content'][:200]}"
                for msg in chat_history[-3:]  # Last 3 messages
            ])

        # Build full prompt
        prompt = f"""Context from legal documents:
{context_text}

{f"Previous conversation:\n{history_text}\n" if history_text else ""}
Question: {query}

Answer the user's question directly in a clear, conversational way, as if explaining
the law to a person who is not a lawyer. Start with a concise, topic-specific
Markdown heading that describes the subject of the answer; do not use a generic
heading such as "Short answer". Follow it with a concise introductory paragraph,
then organize the explanation with a few meaningful Markdown headings, readable
paragraphs, and only occasional bullets when they genuinely help.

Be comprehensive about the issues the user actually asked about, with enough
explanation and practical context; do not impose a short word limit or sacrifice
useful detail. Prioritize the most relevant provisions instead of producing an
exhaustive section-by-section catalogue. Never create a table unless the user
explicitly asks for one. In particular, do not repeat a heading or description
across many unrelated sections or infer that a provision has the same effect as
another section.

Use only provisions, penalties, cases, and factual claims supported by the supplied
legal context. Do not invent section numbers, penalties, citations, or case names.
If the sources do not substantiate a detail or disagree, say so clearly and qualify
the answer. Cite the relevant source naturally in the prose or with concise
Markdown bullets. Do not wrap the answer in a Markdown code fence."""

        # Use provider with legal-optimized parameters
        try:
            response = self.generate(
                prompt=prompt,
                max_tokens=3000,  # Extended for comprehensive legal explanations
                temperature=0.3,  # Low temperature for factual accuracy
                system_prompt=system_prompt,
            )

            response = re.sub(
                r"^\s*(?:#{1,6}\s*)?(?:\*\*)?(?i:short answer)(?:\*\*)?"
                r"(?:\s*[:：—-]\s*|\s*\r?\n+\s*|\s+(?=[A-Z])|(?=[A-Z])|$)",
                "",
                response,
                count=1,
            ).lstrip()
            if not re.match(r"^#{1,6}\s+", response):
                subject = re.sub(r"\s+", " ", query).strip().rstrip("?.!")
                if subject:
                    heading = subject[0].upper() + subject[1:]
                    response = f"## {heading}\n\n{response}"
            return response

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def generate_legal_draft(
        self,
        draft_type: str,
        case_details: Dict,
        research_context: List[str],
        template: Optional[str] = None,
    ) -> str:
        """
        Generate legal draft document using SAME approach as Research (which works perfectly!)

        Args:
            draft_type: Type of draft (legal_notice, complaint, affidavit)
            case_details: Dictionary with case information
            research_context: Relevant legal context from research
            template: Optional template to follow

        Returns:
            Generated legal draft
        """
        system_prompt = (
            "You are a legal drafter specializing in Indian law. Write a concise, "
            "complete, professional draft using only the supplied facts and legal "
            "context. Do not invent facts, authorities, or case citations."
        )

        # Extract case details
        client = case_details.get("client_name", "Client")
        opponent = case_details.get("opponent_name", "Respondent")
        facts = case_details.get("description", "")[:1000]

        legal_context = "\n".join(
            f"- {context[:500]}" for context in research_context[:7]
        ) or "No additional legal research context was available."

        prompt = f"""Prepare a concise but complete {draft_type.replace('_', ' ')} from {client} to {opponent}.

Aim for approximately 400–500 words. Include enough detail for the document to be useful, but do not pad it or exceed the supplied facts.

Case: {facts}
Relevant legal context:
{legal_context}

Use a professional format appropriate for this document type. Include:
- A clear title and the parties' names.
- A short, factual background with the important dates, amounts, and events supplied.
- Relevant legal grounds, relying only on the legal context above; do not make up section numbers or case citations.
- Clear, specific relief or action requested, with a reasonable response deadline where appropriate.
- A suitable closing and the client's name.

Write a complete draft, not an outline. Use Markdown headings, paragraphs, and
numbered or bulleted lists only where they improve readability. Do not wrap the
draft in a Markdown code fence."""

        return self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=1400,
            temperature=0.1,
        )

    def summarize_judgment(self, judgment_text: str, max_length: int = 500) -> Dict:
        """
        Summarize court judgment

        Args:
            judgment_text: Full judgment text
            max_length: Maximum tokens for summary

        Returns:
            Dictionary with summary, key points, and held
        """
        system_prompt = """You are a legal analyst. Summarize court judgments clearly and accurately,
highlighting the key facts, legal questions, and final holdings."""

        prompt = f"""Analyze this court judgment and provide:
1. Brief summary (2-3 sentences)
2. Key legal points (3-5 bullet points)
3. What the court held (final decision)

Judgment:
{judgment_text[:4000]}  # Truncate if too long

Provide structured analysis:"""

        response = self.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=max_length,
            temperature=0.5
        )

        # Parse response (simplified)
        return {
            "summary": response,
            "key_points": [],
            "held": ""
        }

    def extract_entities(self, text: str) -> Dict:
        """
        Extract legal entities from text

        Args:
            text: Legal text

        Returns:
            Dictionary with acts, sections, cases
        """
        prompt = f"""Extract legal entities from this text:
- Acts/Statutes (e.g., "RERA Act 2016")
- Sections (e.g., "Section 18")
- Case names (e.g., "Kumar vs ABC Builders")

Text:
{text[:2000]}

List the entities in JSON format:"""

        response = self.generate(
            prompt=prompt,
            max_tokens=300,
            temperature=0.3
        )

        # Basic parsing (would need proper JSON extraction)
        return {
            "acts": [],
            "sections": [],
            "cases": []
        }

    def unload_model(self):
        """Unload model to free memory"""
        if phi3_helper and self.model_loaded:
            logger.info("Unloading model...")
            # phi3_helper doesn't have explicit unload, handled by garbage collection
            self.model_loaded = False
            logger.info("Model unloaded")


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

# Global LLM service instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create LLM service singleton"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def generate_text(prompt: str, max_tokens: int = 500) -> str:
    """Quick text generation"""
    service = get_llm_service()
    return service.generate(prompt, max_tokens=max_tokens)


def generate_legal_answer(query: str, context: List[str]) -> str:
    """Quick legal Q&A"""
    service = get_llm_service()
    return service.generate_legal_response(query, context)


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test LLM service"""
    print("=" * 70)
    print("TESTING LLM SERVICE")
    print("=" * 70)

    # Create service
    service = LLMService()

    # Load model
    print("\n1. Loading model...")
    if service.load_model():
        print("SUCCESS: Model loaded!")

        # Test generation
        print("\n2. Testing generation...")
        response = service.generate(
            "What is Section 18 of RERA Act?",
            max_tokens=200
        )
        print(f"\nResponse:\n{response}")

        print("\n" + "=" * 70)
        print("SUCCESS: LLM service working!")
        print("=" * 70)
    else:
        print("FAILED: Could not load model")

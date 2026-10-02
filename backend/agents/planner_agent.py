"""
LegalMind AI - Planner Agent
Analyzes queries and decides on the appropriate action and routing
"""

from typing import Dict, List, Optional
from enum import Enum
from loguru import logger
from config.config import settings


class QueryType(str, Enum):
    """Type of user query"""
    FRESH = "fresh"  # New query without context
    FOLLOW_UP = "follow_up"  # Follow-up to previous conversation
    CLARIFICATION = "clarification"  # Asking for clarification
    DRAFT_REQUEST = "draft_request"  # Explicit draft generation request


class ActionType(str, Enum):
    """Action to take for the query"""
    FULL_RESEARCH = "full_research"  # Complete research across all sources
    FOCUSED_RESEARCH = "focused_research"  # Targeted research in context
    FORMAT_ONLY = "format_only"  # Use existing context, no new research
    PRECEDENT_SEARCH = "precedent_search"  # Search for case law
    CLARIFY = "clarify"  # Ask user for clarification


class PlannerDecision:
    """Planner agent decision"""

    def __init__(
        self,
        query_type: QueryType,
        action: ActionType,
        reasoning: str,
        sources_to_use: List[str],
        context_needed: bool = True,
        confidence: float = 1.0
    ):
        self.query_type = query_type
        self.action = action
        self.reasoning = reasoning
        self.sources_to_use = sources_to_use
        self.context_needed = context_needed
        self.confidence = confidence

    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "query_type": self.query_type.value,
            "action": self.action.value,
            "reasoning": self.reasoning,
            "sources_to_use": self.sources_to_use,
            "context_needed": self.context_needed,
            "confidence": self.confidence
        }


class PlannerAgent:
    """
    Planner Agent - Decision maker for query routing
    Analyzes user intent and chat history to decide optimal approach
    """

    def __init__(self):
        self.context_threshold = 3  # Minimum messages for context analysis

        # Keywords for intent detection
        self.draft_keywords = [
            'draft', 'generate', 'prepare', 'write', 'create',
            'notice', 'complaint', 'affidavit', 'petition', 'letter'
        ]

        self.precedent_keywords = [
            'case', 'judgment', 'precedent', 'ruling', 'decision',
            'court held', 'supreme court', 'high court'
        ]

        self.clarification_indicators = [
            'what do you mean', 'clarify', 'explain more',
            'don\'t understand', 'confused', 'elaborate'
        ]

    def _get_available_sources(self, include_templates: bool = False) -> List[str]:
        """Get list of available sources based on config"""
        sources = []
        if settings.RESEARCH_USE_RAG:
            sources.append('rag')
        if settings.RESEARCH_USE_GRAPH:
            sources.append('graph')
        if settings.RESEARCH_USE_WEB:
            sources.append('web')
        if include_templates:
            sources.append('templates')
        return sources if sources else ['rag']  # Fallback to RAG

    def analyze_query(
        self,
        query: str,
        chat_history: Optional[List[Dict]] = None,
        current_context: Optional[Dict] = None
    ) -> PlannerDecision:
        """
        Analyze query and make decision

        Args:
            query: User's query
            chat_history: Previous conversation messages
            current_context: Any existing context (research, case details)

        Returns:
            PlannerDecision with routing information
        """
        query_lower = query.lower()
        logger.info(f"Analyzing query: '{query[:50]}...'")

        # 1. Determine query type
        query_type = self._classify_query_type(query, chat_history)

        # 2. Detect intent
        intent = self._detect_intent(query)

        # 3. Check if we have sufficient context
        has_context = self._has_sufficient_context(chat_history, current_context)

        # 4. Make decision based on analysis
        decision = self._make_decision(
            query_type=query_type,
            intent=intent,
            has_context=has_context,
            query=query
        )

        logger.info(f"Decision: {decision.action.value} (type: {decision.query_type.value})")
        logger.info(f"Reasoning: {decision.reasoning}")

        return decision

    def _classify_query_type(
        self,
        query: str,
        chat_history: Optional[List[Dict]]
    ) -> QueryType:
        """Classify the type of query"""

        # Check for clarification
        if any(indicator in query.lower() for indicator in self.clarification_indicators):
            return QueryType.CLARIFICATION

        # Check for explicit draft request
        if any(keyword in query.lower() for keyword in self.draft_keywords):
            return QueryType.DRAFT_REQUEST

        # Check if it's a follow-up
        if chat_history and len(chat_history) > 0:
            # Look for follow-up indicators
            follow_up_indicators = [
                'more details', 'also', 'additionally', 'furthermore',
                'what about', 'and', 'can you', 'please explain'
            ]

            if any(indicator in query.lower() for indicator in follow_up_indicators):
                return QueryType.FOLLOW_UP

        # Default to fresh query
        return QueryType.FRESH

    def _detect_intent(self, query: str) -> str:
        """Detect user's intent from query"""
        query_lower = query.lower()

        # Draft generation intent
        if any(keyword in query_lower for keyword in self.draft_keywords):
            return "draft_generation"

        # Precedent search intent
        if any(keyword in query_lower for keyword in self.precedent_keywords):
            return "precedent_search"

        # Legal research intent (default)
        return "legal_research"

    def _has_sufficient_context(
        self,
        chat_history: Optional[List[Dict]],
        current_context: Optional[Dict]
    ) -> bool:
        """Check if we have sufficient context to proceed"""

        # Check chat history
        if chat_history and len(chat_history) >= self.context_threshold:
            return True

        # Check if we have research context
        if current_context:
            if current_context.get('research_data') or current_context.get('case_details'):
                return True

        return False

    def _make_decision(
        self,
        query_type: QueryType,
        intent: str,
        has_context: bool,
        query: str
    ) -> PlannerDecision:
        """Make final decision based on analysis"""

        # Handle clarification requests
        if query_type == QueryType.CLARIFICATION:
            return PlannerDecision(
                query_type=query_type,
                action=ActionType.CLARIFY,
                reasoning="User needs clarification on previous response",
                sources_to_use=['chat_history'],
                context_needed=True,
                confidence=0.95
            )

        # Handle draft requests
        if query_type == QueryType.DRAFT_REQUEST:
            if has_context:
                # We have context, can generate draft
                return PlannerDecision(
                    query_type=query_type,
                    action=ActionType.FORMAT_ONLY,
                    reasoning="Draft requested with sufficient context available",
                    sources_to_use=['existing_context'],
                    context_needed=False,
                    confidence=0.9
                )
            else:
                # Need research first
                return PlannerDecision(
                    query_type=query_type,
                    action=ActionType.FULL_RESEARCH,
                    reasoning="Draft requested but need research context first",
                    sources_to_use=self._get_available_sources(include_templates=True),
                    context_needed=True,
                    confidence=0.85
                )

        # Handle precedent search
        if intent == "precedent_search":
            return PlannerDecision(
                query_type=query_type,
                action=ActionType.PRECEDENT_SEARCH,
                reasoning="User specifically looking for case law/precedents",
                sources_to_use=self._get_available_sources(),
                context_needed=True,
                confidence=0.9
            )

        # Handle follow-up queries
        if query_type == QueryType.FOLLOW_UP:
            if has_context:
                # Focused research in existing context
                return PlannerDecision(
                    query_type=query_type,
                    action=ActionType.FOCUSED_RESEARCH,
                    reasoning="Follow-up query with existing context, focused search needed",
                    sources_to_use=['rag', 'chat_history'],
                    context_needed=True,
                    confidence=0.85
                )
            else:
                # Full research needed
                return PlannerDecision(
                    query_type=query_type,
                    action=ActionType.FULL_RESEARCH,
                    reasoning="Follow-up but insufficient context, full research needed",
                    sources_to_use=self._get_available_sources(),
                    context_needed=True,
                    confidence=0.8
                )

        # Default: Fresh query needing full research
        return PlannerDecision(
            query_type=QueryType.FRESH,
            action=ActionType.FULL_RESEARCH,
            reasoning="Fresh query requiring comprehensive research",
            sources_to_use=self._get_available_sources(),
            context_needed=True,
            confidence=0.9
        )

    def should_use_rag(self, decision: PlannerDecision) -> bool:
        """Check if RAG should be used"""
        return 'rag' in decision.sources_to_use

    def should_use_graph(self, decision: PlannerDecision) -> bool:
        """Check if Graph should be used"""
        return 'graph' in decision.sources_to_use

    def should_use_web(self, decision: PlannerDecision) -> bool:
        """Check if web scraping should be used"""
        return 'web' in decision.sources_to_use


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_planner_agent: Optional[PlannerAgent] = None


def get_planner_agent() -> PlannerAgent:
    """Get or create planner agent singleton"""
    global _planner_agent
    if _planner_agent is None:
        _planner_agent = PlannerAgent()
    return _planner_agent


# ============================================================================
# CONVENIENCE FUNCTION
# ============================================================================

def plan_query(
    query: str,
    chat_history: Optional[List[Dict]] = None,
    context: Optional[Dict] = None
) -> PlannerDecision:
    """Quick query planning"""
    agent = get_planner_agent()
    return agent.analyze_query(query, chat_history, context)


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test planner agent"""
    print("=" * 70)
    print("TESTING PLANNER AGENT")
    print("=" * 70)

    agent = PlannerAgent()

    # Test cases
    test_queries = [
        # Fresh query
        {
            "query": "What is the penalty under RERA Section 18?",
            "history": None,
            "context": None
        },
        # Follow-up
        {
            "query": "Can you explain more about the interest calculation?",
            "history": [
                {"role": "user", "content": "What is Section 18?"},
                {"role": "assistant", "content": "Section 18 deals with..."}
            ],
            "context": {"research_data": "existing"}
        },
        # Draft request with context
        {
            "query": "Generate a legal notice for this case",
            "history": [
                {"role": "user", "content": "RERA case details..."},
            ],
            "context": {"case_details": {"type": "RERA"}}
        },
        # Precedent search
        {
            "query": "Find Supreme Court judgments on RERA delayed possession",
            "history": None,
            "context": None
        },
    ]

    for i, test in enumerate(test_queries, 1):
        print(f"\nTest {i}: {test['query'][:60]}...")
        decision = agent.analyze_query(
            test['query'],
            test.get('history'),
            test.get('context')
        )

        print(f"  Query Type: {decision.query_type.value}")
        print(f"  Action: {decision.action.value}")
        print(f"  Sources: {', '.join(decision.sources_to_use)}")
        print(f"  Reasoning: {decision.reasoning}")
        print(f"  Confidence: {decision.confidence:.2f}")

    print("\n" + "=" * 70)
    print("SUCCESS: Planner agent working!")
    print("=" * 70)

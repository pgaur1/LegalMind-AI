"""
LegalMind AI - Research Agent
Orchestrates research by combining RAG, Graph, and LLM services
"""

from typing import Dict, List, Optional, Tuple
from loguru import logger

from agents.planner_agent import (
    PlannerAgent, PlannerDecision, QueryType, ActionType,
    get_planner_agent
)
from services.rag_service import RAGService, get_rag_service
from services.graph_service import GraphService, get_graph_service
from services.llm_service import LLMService, get_llm_service
from services.web_service import WebService, get_web_service


class ResearchResult:
    """Research result with sources and metadata"""

    def __init__(
        self,
        response: str,
        sources: List[Dict],
        decision: PlannerDecision,
        confidence: float = 1.0,
        metadata: Optional[Dict] = None
    ):
        self.response = response
        self.sources = sources
        self.decision = decision
        self.confidence = confidence
        self.metadata = metadata or {}

    def to_dict(self) -> Dict:
        """Convert to dictionary for API response"""
        return {
            "response": self.response,
            "sources": self.sources,
            "decision": self.decision.to_dict(),
            "confidence": self.confidence,
            "metadata": self.metadata
        }


class ResearchAgent:
    """
    Research Agent - Main orchestrator for legal research
    Combines Planner, RAG, Graph, and LLM services
    """

    def __init__(self):
        self.planner = get_planner_agent()
        self.rag_service = get_rag_service()
        self.graph_service = get_graph_service()
        self.web_service = get_web_service()
        self.llm_service = get_llm_service()

        self.initialized = False

    def initialize(self) -> bool:
        """Initialize all services"""
        if self.initialized:
            logger.info("Research agent already initialized")
            return True

        try:
            logger.info("Initializing Research Agent...")

            # Initialize services
            services_status = {
                "RAG": self.rag_service.initialize(),
                "Graph": self.graph_service.initialize(),
                "Web": self.web_service.initialize(),
                "LLM": self.llm_service.load_model()
            }

            # Log status
            for service, status in services_status.items():
                if status:
                    logger.success(f"{service} service ready")
                else:
                    logger.warning(f"{service} service not ready (will use fallback)")

            # We can work even if some services aren't ready
            self.initialized = True
            logger.success("Research Agent initialized!")

            return True

        except Exception as e:
            logger.error(f"Failed to initialize Research Agent: {e}")
            self.initialized = False
            return False

    def research(
        self,
        query: str,
        chat_history: Optional[List[Dict]] = None,
        current_context: Optional[Dict] = None,
        user_id: Optional[str] = None
    ) -> ResearchResult:
        """
        Main research method - orchestrates entire research flow

        Args:
            query: User's legal question
            chat_history: Previous conversation messages
            current_context: Any existing context (case details, etc.)
            user_id: User identifier for personalization

        Returns:
            ResearchResult with response and sources
        """
        if not self.initialized:
            logger.warning("Agent not initialized, attempting to initialize...")
            self.initialize()

        logger.info(f"Starting research for query: '{query[:60]}...'")

        try:
            # Step 1: Use Planner to decide approach
            decision = self.planner.analyze_query(query, chat_history, current_context)
            logger.info(f"Planner decision: {decision.action.value}")

            # Step 2: Execute based on decision
            if decision.action == ActionType.FULL_RESEARCH:
                return self._execute_full_research(query, decision, chat_history)

            elif decision.action == ActionType.FOCUSED_RESEARCH:
                return self._execute_focused_research(query, decision, chat_history, current_context)

            elif decision.action == ActionType.FORMAT_ONLY:
                return self._execute_format_only(query, decision, current_context)

            elif decision.action == ActionType.PRECEDENT_SEARCH:
                return self._execute_precedent_search(query, decision)

            elif decision.action == ActionType.CLARIFY:
                return self._execute_clarification(query, decision, chat_history)

            else:
                # Fallback to full research
                return self._execute_full_research(query, decision, chat_history)

        except Exception as e:
            logger.error(f"Research failed: {e}")
            return ResearchResult(
                response=f"I encountered an error while researching: {str(e)}",
                sources=[],
                decision=decision if 'decision' in locals() else None,
                confidence=0.0,
                metadata={"error": str(e)}
            )

    def _execute_full_research(
        self,
        query: str,
        decision: PlannerDecision,
        chat_history: Optional[List[Dict]]
    ) -> ResearchResult:
        """Execute comprehensive research across all sources"""
        logger.info("Executing full research...")

        sources = []

        # Query RAG if enabled (limit to 2 sources)
        if self.planner.should_use_rag(decision) and self.rag_service.initialized:
            logger.info("Querying RAG service...")
            rag_results = self.rag_service.search(query, top_k=2)
            sources.extend(self._format_rag_sources(rag_results))
            logger.info(f"Found {len(rag_results)} RAG results")

        # Query Graph if enabled (limit to 2 sources)
        if self.planner.should_use_graph(decision) and self.graph_service.initialized:
            logger.info("Querying Graph service...")
            graph_results = self._search_graph_entities(query)
            graph_sources = self._format_graph_sources(graph_results)[:2]  # Limit to 2
            sources.extend(graph_sources)
            logger.info(f"Found {len(graph_sources)} graph entities (limited to 2)")

        # Query Web if enabled (limit to 2 sources, use mock data for demo)
        if self.planner.should_use_web(decision):
            logger.info("Querying Web service (using mock data)...")
            web_results = self.web_service.search_web(query, max_results=2, use_live_scraping=False)
            sources.extend(web_results)  # Already formatted
            logger.info(f"Found {len(web_results)} web results")

        # Generate response
        if sources:
            context_texts = [s.get('text', s.get('snippet', s.get('content', ''))) for s in sources if s.get('text') or s.get('snippet') or s.get('content')]
            response = self.llm_service.generate_legal_response(
                query=query,
                context=context_texts[:8],  # Top 8 sources (RAG + Graph + Web)
                chat_history=chat_history
            )
        else:
            # No sources found, use LLM general knowledge
            logger.warning("No sources found, using LLM general knowledge")
            response = self.llm_service.generate(
                f"Please answer this legal question based on general legal principles: {query}",
                max_tokens=800
            )
            response = "Note: This answer is based on general legal knowledge as specific documents were not found.\n\n" + response

        return ResearchResult(
            response=response,
            sources=sources,
            decision=decision,
            confidence=0.9 if sources else 0.5,
            metadata={
                "search_type": "full_research",
                "rag_results": len([s for s in sources if s.get('source_type') == 'rag']),
                "graph_results": len([s for s in sources if s.get('source_type') == 'graph']),
                "web_results": len([s for s in sources if s.get('source_type') == 'web'])
            }
        )

    def _execute_focused_research(
        self,
        query: str,
        decision: PlannerDecision,
        chat_history: Optional[List[Dict]],
        current_context: Optional[Dict]
    ) -> ResearchResult:
        """Execute focused research in existing context"""
        logger.info("Executing focused research...")

        sources = []

        # Extract context from chat history
        if chat_history:
            # Get previous sources from history
            for msg in reversed(chat_history[-3:]):  # Last 3 messages
                if msg.get('role') == 'assistant' and msg.get('sources'):
                    sources.extend(msg['sources'][:2])  # Top 2 from each

        # Add new targeted search
        if self.rag_service.initialized:
            rag_results = self.rag_service.search(query, top_k=3)
            sources.extend(self._format_rag_sources(rag_results))

        # Generate response with context
        context_texts = [s.get('text', s.get('content', '')) for s in sources]
        response = self.llm_service.generate_legal_response(
            query=query,
            context=context_texts,
            chat_history=chat_history
        )

        return ResearchResult(
            response=response,
            sources=sources,
            decision=decision,
            confidence=0.85,
            metadata={"search_type": "focused_research"}
        )

    def _execute_format_only(
        self,
        query: str,
        decision: PlannerDecision,
        current_context: Optional[Dict]
    ) -> ResearchResult:
        """Use existing context without new research"""
        logger.info("Executing format-only (using existing context)...")

        sources = []
        context_texts = []

        # Extract existing context
        if current_context:
            if current_context.get('research_data'):
                sources = current_context['research_data'].get('sources', [])
                context_texts = [s.get('text', '') for s in sources]

        # Generate response
        if context_texts:
            response = self.llm_service.generate_legal_response(
                query=query,
                context=context_texts,
                chat_history=None
            )
        else:
            response = self.llm_service.generate(
                f"Based on our previous discussion: {query}",
                max_tokens=600
            )

        return ResearchResult(
            response=response,
            sources=sources,
            decision=decision,
            confidence=0.8,
            metadata={"search_type": "format_only"}
        )

    def _execute_precedent_search(
        self,
        query: str,
        decision: PlannerDecision
    ) -> ResearchResult:
        """Execute precedent/case law search"""
        logger.info("Executing precedent search...")

        sources = []

        # Search graph for cases
        if self.graph_service.initialized:
            case_results = self.graph_service.search_entities(query, entity_type='case', limit=10)
            sources.extend(self._format_case_sources(case_results))
            logger.info(f"Found {len(case_results)} cases")

        # Also search RAG for judgment text
        if self.rag_service.initialized:
            rag_results = self.rag_service.search(query, top_k=5)
            # Filter for judgment documents
            judgment_results = [r for r in rag_results if 'judgment' in r.get('document_title', '').lower() or 'case' in r.get('document_title', '').lower()]
            sources.extend(self._format_rag_sources(judgment_results))

        # Generate summary of precedents
        if sources:
            context_texts = [self._format_case_summary(s) for s in sources[:5]]
            response = self.llm_service.generate(
                f"Summarize these legal precedents relevant to: {query}\n\n" + "\n\n".join(context_texts),
                max_tokens=1000
            )
        else:
            response = f"No specific precedents found for '{query}'. Please provide more details or try rephrasing your query."

        return ResearchResult(
            response=response,
            sources=sources,
            decision=decision,
            confidence=0.9 if sources else 0.3,
            metadata={"search_type": "precedent_search", "cases_found": len(sources)}
        )

    def _execute_clarification(
        self,
        query: str,
        decision: PlannerDecision,
        chat_history: Optional[List[Dict]]
    ) -> ResearchResult:
        """Handle clarification requests"""
        logger.info("Executing clarification...")

        # Get last assistant response
        last_response = ""
        if chat_history:
            for msg in reversed(chat_history):
                if msg.get('role') == 'assistant':
                    last_response = msg.get('content', '')
                    break

        # Generate clarification
        prompt = f"""Previous response: {last_response}

User's clarification request: {query}

Please provide a clearer explanation addressing their specific confusion."""

        response = self.llm_service.generate(prompt, max_tokens=600)

        return ResearchResult(
            response=response,
            sources=[],
            decision=decision,
            confidence=0.85,
            metadata={"search_type": "clarification"}
        )

    def _search_graph_entities(self, query: str) -> List[Dict]:
        """Search for relevant entities in graph"""
        if not self.graph_service.initialized:
            return []

        results = []
        seen_ids = set()  # Avoid duplicates

        # Extract keywords from query for better graph search
        keywords = self._extract_legal_keywords(query)

        # Search with each keyword (limit to first 2 keywords for efficiency)
        for keyword in keywords[:2]:
            for entity_type in ['act', 'section', 'case']:
                entities = self.graph_service.search_entities(keyword, entity_type=entity_type, limit=2)
                # Add only new entities
                for entity in entities:
                    entity_id = entity.get('entity_id')
                    if entity_id and entity_id not in seen_ids:
                        results.append(entity)
                        seen_ids.add(entity_id)
                        # Stop if we have enough results
                        if len(results) >= 5:
                            break
            if len(results) >= 5:
                break

        logger.info(f"Graph search found {len(results)} unique entities from keywords: {keywords[:2]}")
        return results[:5]  # Return top 5 (will be limited to 2 by caller)

    def _extract_legal_keywords(self, query: str) -> List[str]:
        """Extract legal keywords from natural language query"""
        import re

        keywords = []
        query_lower = query.lower()

        # Extract section references (Section 18, Sec 18, § 18)
        section_patterns = [
            r'section\s+(\d+[a-z]?)',
            r'sec\.?\s+(\d+[a-z]?)',
            r'§\s*(\d+[a-z]?)'
        ]
        for pattern in section_patterns:
            matches = re.findall(pattern, query_lower)
            for match in matches:
                keywords.append(f"Section {match}")

        # Extract act names (common Indian acts)
        act_keywords = [
            'RERA', 'Real Estate', 'IRDAI', 'Insurance', 'Consumer Protection',
            'Arbitration', 'Indian Contract', 'Companies Act', 'Negotiable Instruments',
            'Labour', 'Industrial Disputes', 'Payment of Wages', 'Commercial Courts',
            'GST', 'Income Tax', 'Motor Vehicles', 'Information Technology'
        ]
        for act_keyword in act_keywords:
            if act_keyword.lower() in query_lower:
                keywords.append(act_keyword)

        # Extract case names (X vs Y pattern)
        case_pattern = r'(\w+(?:\s+\w+)?)\s+(?:vs?\.?|versus)\s+(\w+(?:\s+\w+)?)'
        case_matches = re.findall(case_pattern, query_lower, re.IGNORECASE)
        for match in case_matches:
            keywords.append(f"{match[0]} vs {match[1]}")

        # If no keywords found, use the first few significant words
        if not keywords:
            words = query.split()
            significant_words = [w for w in words if len(w) > 3 and w.lower() not in
                ['what', 'when', 'where', 'which', 'who', 'how', 'does', 'can', 'will']]
            keywords.extend(significant_words[:3])

        return keywords if keywords else [query]  # Fallback to full query

    def _format_rag_sources(self, rag_results: List[Dict]) -> List[Dict]:
        """Format RAG results as sources"""
        sources = []
        for result in rag_results:
            sources.append({
                "source_type": "rag",
                "document_id": result.get('document_id'),
                "document_title": result.get('document_title', 'Unknown Document'),
                "chunk_id": result.get('chunk_id'),
                "text": result.get('text', ''),
                "similarity_score": result.get('similarity_score', 0.0),
                "rank": result.get('rank', 0)
            })
        return sources

    def _format_graph_sources(self, graph_results: List[Dict]) -> List[Dict]:
        """Format graph entity results as sources"""
        sources = []
        for result in graph_results:
            entity_type = result.get('type', 'entity')
            sources.append({
                "source_type": "graph",
                "entity_type": entity_type,
                "entity_id": result.get('entity_id'),
                "name": result.get('name', result.get('case_name', result.get('section_number', 'Unknown'))),
                "content": self._extract_entity_content(result),
                "metadata": result
            })
        return sources

    def _format_case_sources(self, case_results: List[Dict]) -> List[Dict]:
        """Format case results as sources"""
        sources = []
        for case in case_results:
            sources.append({
                "source_type": "case",
                "entity_id": case.get('entity_id'),
                "case_name": case.get('case_name', 'Unknown Case'),
                "citation": case.get('citation', ''),
                "court": case.get('court', ''),
                "year": case.get('year', ''),
                "summary": case.get('summary', ''),
                "content": f"{case.get('case_name', '')} - {case.get('court', '')} ({case.get('year', '')})"
            })
        return sources

    def _extract_entity_content(self, entity: Dict) -> str:
        """Extract readable content from entity"""
        entity_type = entity.get('type')

        if entity_type == 'act':
            return f"{entity.get('name', '')} ({entity.get('year', '')}): {entity.get('full_name', '')}"
        elif entity_type == 'section':
            return f"{entity.get('section_number', '')} of {entity.get('act', '')}: {entity.get('title', '')}"
        elif entity_type == 'case':
            return f"{entity.get('case_name', '')} - {entity.get('court', '')} - {entity.get('citation', '')}"
        else:
            return str(entity)

    def _format_case_summary(self, source: Dict) -> str:
        """Format case source as summary text"""
        if source.get('source_type') == 'case':
            return f"""Case: {source.get('case_name')}
Court: {source.get('court')}
Citation: {source.get('citation')}
Summary: {source.get('summary', 'N/A')}"""
        else:
            return source.get('text', source.get('content', ''))

    def get_stats(self) -> Dict:
        """Get research agent statistics"""
        return {
            "initialized": self.initialized,
            "services": {
                "planner": True,
                "rag": self.rag_service.initialized,
                "graph": self.graph_service.initialized,
                "llm": self.llm_service.model_loaded
            },
            "capabilities": {
                "full_research": self.rag_service.initialized or self.graph_service.initialized,
                "precedent_search": self.graph_service.initialized,
                "draft_generation": self.llm_service.model_loaded
            }
        }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_research_agent: Optional[ResearchAgent] = None


def get_research_agent() -> ResearchAgent:
    """Get or create research agent singleton"""
    global _research_agent
    if _research_agent is None:
        _research_agent = ResearchAgent()
    return _research_agent


# ============================================================================
# CONVENIENCE FUNCTION
# ============================================================================

def research_query(
    query: str,
    chat_history: Optional[List[Dict]] = None,
    context: Optional[Dict] = None
) -> ResearchResult:
    """Quick research query"""
    agent = get_research_agent()
    if not agent.initialized:
        agent.initialize()
    return agent.research(query, chat_history, context)


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test research agent"""
    print("=" * 70)
    print("TESTING RESEARCH AGENT")
    print("=" * 70)

    # Create agent
    agent = ResearchAgent()

    # Initialize
    print("\n1. Initializing agent...")
    if agent.initialize():
        print("SUCCESS: Agent initialized!")

        # Check stats
        print("\n2. Agent capabilities:")
        stats = agent.get_stats()
        print(f"  Services ready:")
        for service, status in stats['services'].items():
            print(f"    - {service}: {'✓' if status else '✗'}")

        # Test research (will work even if some services not ready)
        print("\n3. Testing research...")
        test_query = "What is the penalty under RERA Section 18?"
        print(f"Query: {test_query}")

        result = agent.research(test_query)

        print(f"\nDecision:")
        print(f"  Action: {result.decision.action.value}")
        print(f"  Reasoning: {result.decision.reasoning}")

        print(f"\nResponse (preview):")
        print(f"  {result.response[:200]}...")

        print(f"\nSources: {len(result.sources)} found")
        print(f"Confidence: {result.confidence:.2f}")

        print("\n" + "=" * 70)
        print("SUCCESS: Research agent working!")
        print("=" * 70)
    else:
        print("Note: Some services may not be ready yet")
        print("Agent can still operate with available services")

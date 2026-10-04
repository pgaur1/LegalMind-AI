"""
LegalMind AI - Graph Service
Handles legal entity relationships and citation networks
Uses NetworkX for graph operations
"""

import json
from pathlib import Path
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict
from loguru import logger

try:
    import networkx as nx
    NETWORKX_AVAILABLE = True
except ImportError:
    logger.warning("NetworkX not installed yet")
    NETWORKX_AVAILABLE = False

from config.config import settings


class GraphService:
    """
    Graph Service for legal entity relationships
    Manages Acts, Sections, Cases, and their interconnections
    """

    def __init__(self):
        self.graph = None
        self.entities = {
            'acts': {},
            'sections': {},
            'cases': {},
            'documents': {}
        }
        self.initialized = False

    def initialize(self) -> bool:
        """Initialize graph service"""
        if self.initialized:
            logger.info("Graph service already initialized")
            return True

        if not NETWORKX_AVAILABLE:
            logger.error("NetworkX not installed")
            return False

        try:
            logger.info("Initializing graph service...")

            # Create directed graph
            self.graph = nx.DiGraph()

            # Try to load existing graph data
            entities_dir = settings.GRAPH_DB_DIR
            if entities_dir.exists():
                self.load_entities_from_files(entities_dir)
            else:
                logger.info("No existing entity data found")

            self.initialized = True
            logger.success("Graph service initialized!")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize graph service: {e}")
            self.initialized = False
            return False

    def load_entities_from_files(self, entities_dir: Path) -> bool:
        """
        Load entities from processed JSON files

        Args:
            entities_dir: Directory containing entity JSON files

        Returns:
            Success boolean
        """
        try:
            logger.info(f"Loading entities from: {entities_dir}")

            # Load acts
            acts_file = entities_dir / "acts.json"
            if acts_file.exists():
                with open(acts_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    acts = data.get('acts', [])
                    for act in acts:
                        self.add_act(act)
                    logger.info(f"Loaded {len(acts)} acts")

            # Load sections
            sections_file = entities_dir / "sections.json"
            if sections_file.exists():
                with open(sections_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    sections = data.get('sections', [])
                    for section in sections:
                        self.add_section(section)
                    logger.info(f"Loaded {len(sections)} sections")

            # Load cases
            cases_file = entities_dir / "cases.json"
            if cases_file.exists():
                with open(cases_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    cases = data.get('cases', [])
                    for case in cases:
                        self.add_case(case)
                    logger.info(f"Loaded {len(cases)} cases")

            # Load relationships
            relationships_file = entities_dir / "relationships.json"
            if relationships_file.exists():
                with open(relationships_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    relationships = data.get('relationships', [])
                    for rel in relationships:
                        self.add_relationship(
                            rel['source'],
                            rel['target'],
                            rel['relationship'],
                            rel.get('context', '')
                        )
                    logger.info(f"Loaded {len(relationships)} relationships")

            logger.success(f"Graph has {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges")
            return True

        except Exception as e:
            logger.error(f"Failed to load entities: {e}")
            return False

    def add_act(self, act_data: Dict) -> str:
        """Add an Act to the graph"""
        entity_id = act_data.get('entity_id', f"act_{len(self.entities['acts'])}")

        # Create node attributes without duplicates
        node_attrs = {
            'type': 'act',
            'name': act_data.get('name'),
            'full_name': act_data.get('full_name', ''),
            'year': act_data.get('year'),
            'aliases': act_data.get('aliases', []),
            'jurisdiction': act_data.get('jurisdiction', ''),
            'ministry': act_data.get('ministry', '')
        }

        self.graph.add_node(entity_id, **node_attrs)
        self.entities['acts'][entity_id] = act_data
        return entity_id

    def add_section(self, section_data: Dict) -> str:
        """Add a Section to the graph"""
        entity_id = section_data.get('entity_id', f"section_{len(self.entities['sections'])}")

        # Create node attributes without duplicates
        node_attrs = {
            'type': 'section',
            'section_number': section_data.get('section_number'),
            'act': section_data.get('act'),
            'act_year': section_data.get('act_year', ''),
            'title': section_data.get('title', ''),
            'description': section_data.get('description', ''),
            'key_provisions': section_data.get('key_provisions', [])
        }

        self.graph.add_node(entity_id, **node_attrs)
        self.entities['sections'][entity_id] = section_data

        # Link section to its act
        act_name = section_data.get('act')
        if act_name:
            # Find act node
            act_id = self._find_act_by_name(act_name)
            if act_id:
                self.add_relationship(entity_id, act_id, 'part_of', f"{section_data.get('section_number')} of {act_name}")

        return entity_id

    def add_case(self, case_data: Dict) -> str:
        """Add a Case to the graph"""
        entity_id = case_data.get('entity_id', f"case_{len(self.entities['cases'])}")

        # Create node attributes without duplicates
        node_attrs = {
            'type': 'case',
            'case_name': case_data.get('case_name'),
            'citation': case_data.get('citation', ''),
            'court': case_data.get('court'),
            'year': case_data.get('year'),
            'date': case_data.get('date', ''),
            'judges': case_data.get('judges', ''),
            'petitioner': case_data.get('petitioner', ''),
            'respondent': case_data.get('respondent', ''),
            'case_type': case_data.get('case_type', ''),
            'summary': case_data.get('summary', ''),
            'key_holding': case_data.get('key_holding', ''),
            'precedent_value': case_data.get('precedent_value', 'Medium')
        }

        self.graph.add_node(entity_id, **node_attrs)
        self.entities['cases'][entity_id] = case_data

        # Link to cited acts
        for act_name in case_data.get('cites_acts', []):
            act_id = self._find_act_by_name(act_name)
            if act_id:
                self.add_relationship(entity_id, act_id, 'cites_act', f"Case cites {act_name}")

        # Link to cited sections
        for section_num in case_data.get('cites_sections', []):
            section_id = self._find_section_by_number(section_num)
            if section_id:
                self.add_relationship(entity_id, section_id, 'cites_section', f"Case cites {section_num}")

        return entity_id

    def add_relationship(self, source: str, target: str, rel_type: str, context: str = "") -> bool:
        """Add a relationship between entities"""
        if source in self.graph and target in self.graph:
            self.graph.add_edge(source, target, type=rel_type, context=context)
            return True
        return False

    def find_related_entities(
        self,
        entity_id: str,
        relationship_types: Optional[List[str]] = None,
        max_depth: int = 2
    ) -> List[Dict]:
        """
        Find entities related to given entity

        Args:
            entity_id: Starting entity
            relationship_types: Filter by relationship types (optional)
            max_depth: Maximum traversal depth

        Returns:
            List of related entities with relationship info
        """
        if not self.initialized or entity_id not in self.graph:
            return []

        related = []

        # BFS traversal
        visited = set()
        queue = [(entity_id, 0)]  # (node, depth)

        while queue:
            current, depth = queue.pop(0)

            if depth > max_depth or current in visited:
                continue

            visited.add(current)

            # Get neighbors
            for neighbor in self.graph.neighbors(current):
                edge_data = self.graph.get_edge_data(current, neighbor)
                rel_type = edge_data.get('type', 'related')

                # Filter by relationship type if specified
                if relationship_types and rel_type not in relationship_types:
                    continue

                # Get node data
                node_data = dict(self.graph.nodes[neighbor])

                related.append({
                    'entity_id': neighbor,
                    'entity_type': node_data.get('type'),
                    'relationship': rel_type,
                    'context': edge_data.get('context', ''),
                    'depth': depth + 1,
                    **node_data
                })

                # Add to queue for further exploration
                if depth + 1 < max_depth:
                    queue.append((neighbor, depth + 1))

        logger.info(f"Found {len(related)} related entities for {entity_id}")
        return related

    def find_citation_network(self, case_id: str, max_depth: int = 2) -> Dict:
        """
        Find citation network for a case

        Args:
            case_id: Case entity ID
            max_depth: Maximum citation depth

        Returns:
            Dictionary with cited_by and cites lists
        """
        if not self.initialized or case_id not in self.graph:
            return {'cites': [], 'cited_by': []}

        # Cases this case cites
        cites = []
        for neighbor in self.graph.neighbors(case_id):
            if self.graph.nodes[neighbor].get('type') == 'case':
                cites.append(neighbor)

        # Cases that cite this case (reverse edges)
        cited_by = []
        for pred in self.graph.predecessors(case_id):
            if self.graph.nodes[pred].get('type') == 'case':
                cited_by.append(pred)

        return {
            'cites': cites,
            'cited_by': cited_by,
            'citation_count': len(cited_by)
        }

    def search_entities(
        self,
        query: str,
        entity_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict]:
        """
        Search for entities by name/text

        Args:
            query: Search query
            entity_type: Filter by type (act, section, case)
            limit: Maximum results

        Returns:
            List of matching entities
        """
        if not self.initialized:
            return []

        query_lower = query.lower()
        results = []

        for node_id, node_data in self.graph.nodes(data=True):
            # Filter by type if specified
            if entity_type and node_data.get('type') != entity_type:
                continue

            # Search in various fields
            searchable_text = " ".join([
                str(node_data.get('name', '')),
                str(node_data.get('full_name', '')),
                " ".join(node_data.get('aliases', [])),
                str(node_data.get('case_name', '')),
                str(node_data.get('section_number', '')),
                str(node_data.get('title', '')),
                str(node_data.get('description', '')),
                str(node_data.get('key_provisions', '')),
                str(node_data.get('summary', '')),
                str(node_data.get('key_holding', '')),
            ]).lower()

            if query_lower in searchable_text:
                results.append({
                    'entity_id': node_id,
                    **node_data
                })

                if len(results) >= limit:
                    break

        logger.info(f"Found {len(results)} entities matching '{query}'")
        return results

    def get_entity_path(self, source: str, target: str) -> List[str]:
        """Find shortest path between two entities"""
        if not self.initialized:
            return []

        try:
            path = nx.shortest_path(self.graph, source, target)
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return []

    def get_stats(self) -> Dict:
        """Get graph statistics"""
        if not self.initialized:
            return {'initialized': False}

        return {
            'initialized': True,
            'total_nodes': self.graph.number_of_nodes(),
            'total_edges': self.graph.number_of_edges(),
            'acts': len(self.entities['acts']),
            'sections': len(self.entities['sections']),
            'cases': len(self.entities['cases']),
            'documents': len(self.entities['documents']),
        }

    # Helper methods
    def _find_act_by_name(self, name: str) -> Optional[str]:
        """Find act entity ID by name"""
        for entity_id, act_data in self.entities['acts'].items():
            if act_data.get('name') == name or name in act_data.get('aliases', []):
                return entity_id
        return None

    def _find_section_by_number(self, section_num: str) -> Optional[str]:
        """Find section entity ID by number"""
        for entity_id, section_data in self.entities['sections'].items():
            if section_data.get('section_number') == section_num:
                return entity_id
        return None


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_graph_service: Optional[GraphService] = None


def get_graph_service() -> GraphService:
    """Get or create graph service singleton"""
    global _graph_service
    if _graph_service is None:
        _graph_service = GraphService()
    return _graph_service


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def search_legal_entities(query: str, entity_type: Optional[str] = None) -> List[Dict]:
    """Quick entity search"""
    service = get_graph_service()
    if not service.initialized:
        service.initialize()
    return service.search_entities(query, entity_type)


def find_related(entity_id: str, max_depth: int = 2) -> List[Dict]:
    """Quick related entities lookup"""
    service = get_graph_service()
    if not service.initialized:
        service.initialize()
    return service.find_related_entities(entity_id, max_depth=max_depth)


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test graph service"""
    print("=" * 70)
    print("TESTING GRAPH SERVICE")
    print("=" * 70)

    # Create service
    service = GraphService()

    # Initialize
    print("\n1. Initializing service...")
    if service.initialize():
        print("SUCCESS: Service initialized!")

        # Check stats
        print("\n2. Service stats:")
        stats = service.get_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")

        # Test search
        if service.graph.number_of_nodes() > 0:
            print("\n3. Testing entity search...")
            results = service.search_entities("RERA", limit=5)
            print(f"Found {len(results)} entities")
            for result in results[:3]:
                print(f"  - {result.get('type')}: {result.get('name', result.get('section_number', 'N/A'))}")

        print("\n" + "=" * 70)
        print("SUCCESS: Graph service working!")
        print("=" * 70)
    else:
        print("FAILED: Could not initialize service")
        print("Note: This is expected if entities haven't been extracted yet (Task 02)")

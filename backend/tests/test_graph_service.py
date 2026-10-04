import json

from config.config import settings
from services.graph_service import GraphService


def test_graph_service_loads_configured_graph_directory_and_searches_aliases(
    tmp_path, monkeypatch
):
    graph_dir = tmp_path / "knowledge_graph"
    graph_dir.mkdir()
    (graph_dir / "acts.json").write_text(
        json.dumps(
            {
                "acts": [
                    {
                        "entity_id": "act_rera",
                        "name": "Real Estate Act",
                        "full_name": "Real Estate (Regulation and Development) Act",
                        "aliases": ["RERA"],
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    (graph_dir / "sections.json").write_text(
        json.dumps(
            {
                "sections": [
                    {
                        "entity_id": "section_18",
                        "section_number": "Section 18",
                        "act": "Real Estate Act",
                        "title": "Delayed possession",
                        "description": "Allottee may claim refund or interest.",
                    }
                ]
            }
        ),
        encoding="utf-8",
    )
    (graph_dir / "cases.json").write_text(json.dumps({"cases": []}), encoding="utf-8")
    (graph_dir / "relationships.json").write_text(
        json.dumps({"relationships": []}), encoding="utf-8"
    )
    monkeypatch.setattr(settings, "GRAPH_DB_DIR", graph_dir)

    service = GraphService()

    assert service.initialize()
    assert service.get_stats()["total_nodes"] == 2
    assert service.search_entities("RERA", entity_type="act")[0]["entity_id"] == "act_rera"
    section = service.search_entities("Section 18", entity_type="section")[0]
    assert section["description"] == "Allottee may claim refund or interest."

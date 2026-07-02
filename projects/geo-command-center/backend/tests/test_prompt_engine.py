from app.schemas.geo import PromptClusterGenerateIn
from app.services.prompt_engine import generate_prompt_clusters


def test_prompt_cluster_generation():
    clusters = generate_prompt_clusters(
        PromptClusterGenerateIn(
            project_id="p1",
            brand_name="GeoBrand",
            primary_domain="example.com",
            competitors=["competitor.com"],
            topics=["geo audit", "ai visibility"],
        )
    )
    assert len(clusters) > 0
    assert any("chatgpt" in " ".join(c.prompts).lower() for c in clusters)

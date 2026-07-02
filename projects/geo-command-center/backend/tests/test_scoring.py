from app.schemas.geo import ClusterGeoScoreIn, PageGeoScoreIn, ProjectGeoScoreIn
from app.services.scoring import cluster_geo_score, page_geo_score, project_geo_score


def test_page_score():
    score = page_geo_score(
        PageGeoScoreIn(
            technical_score=80,
            extractability_score=70,
            entity_score=60,
            trust_score=75,
            content_score=85,
            citation_readiness_score=65,
        )
    )
    assert score > 0


def test_cluster_score():
    score = cluster_geo_score(
        ClusterGeoScoreIn(
            brand_mention_rate=0.6,
            citation_rate=0.5,
            citation_prominence=0.4,
            competitor_gap_inverse=0.7,
            landing_page_match=0.8,
            answer_sentiment=0.5,
        )
    )
    assert score > 0


def test_project_score():
    score = project_geo_score(
        ProjectGeoScoreIn(
            avg_page_geo=0.7,
            avg_cluster_visibility=0.5,
            authority_signal=0.6,
            competitor_outperformance=0.4,
            freshness=0.9,
        )
    )
    assert score > 0

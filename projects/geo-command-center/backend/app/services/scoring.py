from app.schemas.geo import ClusterGeoScoreIn, PageGeoScoreIn, ProjectGeoScoreIn


def page_geo_score(value: PageGeoScoreIn) -> float:
    score = (
        0.20 * value.technical_score
        + 0.20 * value.extractability_score
        + 0.15 * value.entity_score
        + 0.15 * value.trust_score
        + 0.15 * value.content_score
        + 0.15 * value.citation_readiness_score
    )
    return round(score, 3)


def cluster_geo_score(value: ClusterGeoScoreIn) -> float:
    score = (
        0.30 * value.brand_mention_rate
        + 0.25 * value.citation_rate
        + 0.15 * value.citation_prominence
        + 0.10 * value.competitor_gap_inverse
        + 0.10 * value.landing_page_match
        + 0.10 * value.answer_sentiment
    )
    return round(score, 3)


def project_geo_score(value: ProjectGeoScoreIn) -> float:
    score = (
        0.25 * value.avg_page_geo
        + 0.30 * value.avg_cluster_visibility
        + 0.20 * value.authority_signal
        + 0.15 * value.competitor_outperformance
        + 0.10 * value.freshness
    )
    return round(score, 3)


def citation_prominence_score(citation_orders: list[int]) -> float:
    if not citation_orders:
        return 0.0
    normalized = [max(0.0, 1 - ((order - 1) / 10)) for order in citation_orders]
    return round(sum(normalized) / len(normalized) * 100, 3)


def competitor_gap_inverse(brand_mentions: int, competitor_mentions: int) -> float:
    total = max(1, brand_mentions + competitor_mentions)
    gap = competitor_mentions - brand_mentions
    inverse = 1 - max(0, gap) / total
    return round(max(0.0, min(1.0, inverse)) * 100, 3)


def recommendation_impact(
    prompt_value: float, visibility_gap: float, ease_of_fix: float, page_authority: float
) -> float:
    score = (
        0.35 * prompt_value
        + 0.25 * visibility_gap
        + 0.20 * ease_of_fix
        + 0.20 * page_authority
    )
    return round(score, 3)

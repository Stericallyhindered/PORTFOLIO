from app.services.scoring import (
    citation_prominence_score,
    competitor_gap_inverse,
    recommendation_impact,
)


def test_citation_prominence_score_prefers_early_positions():
    early = citation_prominence_score([1, 2, 3])
    late = citation_prominence_score([7, 8, 9])
    assert early > late


def test_competitor_gap_inverse_rewards_brand_lead():
    lead = competitor_gap_inverse(8, 2)
    behind = competitor_gap_inverse(2, 8)
    assert lead > behind


def test_recommendation_impact_formula():
    impact = recommendation_impact(90, 70, 80, 60)
    assert impact > 0

"""Simple, explicitly heuristic terrain-risk model for the hackathon MVP."""
import numpy as np

def score_slope(slope_deg: np.ndarray):
    """Risk is a demonstration heuristic, NOT a rover-certified metric.

    0-5° low, >5-12° moderate, >12-20° high, >20° blocked.
    NaN values are unknown and are never considered traversable.
    """
    slope = np.asarray(slope_deg, dtype=float)
    valid = np.isfinite(slope) & (slope >= 0)
    score = np.where(valid, np.minimum(100.0, slope * 5.0), np.nan)
    labels = np.full(slope.shape, "unknown", dtype=object)
    labels[valid & (slope <= 5)] = "low"
    labels[valid & (slope > 5) & (slope <= 12)] = "moderate"
    labels[valid & (slope > 12) & (slope <= 20)] = "high"
    labels[valid & (slope > 20)] = "blocked"
    traversable = valid & (slope <= 20)
    return score, labels, traversable

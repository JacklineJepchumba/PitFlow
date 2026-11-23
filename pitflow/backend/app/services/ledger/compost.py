"""Wire rules/compost.yaml into a simple batch compliance flag."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from app.models import Batch

RULES_PATH = Path(__file__).resolve().parents[2] / "rules" / "compost.yaml"


def load_rules() -> dict[str, Any]:
    with RULES_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def check_batch_compliance(batch: Batch) -> str:
    """Return a human-readable flag. Untested compost is never food-safe."""
    rules = load_rules()
    if not batch.tested:
        return "Untested compost: not for food crops"
    # Placeholder thresholds from YAML — demo has no temperature series yet
    min_days = rules.get("min_days", 60)
    return (
        f"Marked tested (SAMPLE). Confirm {min_days}d process before food-crop use."
    )

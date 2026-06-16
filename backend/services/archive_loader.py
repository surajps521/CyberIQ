from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

# Primary archive folder inside the CRIMEIQ project
ARCHIVE_DIR = Path(__file__).resolve().parents[2] / "archive"
# Also consider a sibling workspace-level 'archive' folder (one level above CRIMEIQ)
WORKSPACE_LEVEL_ARCHIVE = Path(__file__).resolve().parents[3] / "archive"

DEFAULT_FILES = [
    ARCHIVE_DIR / "CRIME_REVIEW_2021_TO_2024_KARNATAKA_CLEAN.csv",
    ARCHIVE_DIR / "CRIME_REVIEW_2021_TO_2024_KARNATAKA.csv",
    WORKSPACE_LEVEL_ARCHIVE / "CRIME_REVIEW_2021_TO_2024_KARNATAKA_CLEAN.csv",
    WORKSPACE_LEVEL_ARCHIVE / "CRIME_REVIEW_2021_TO_2024_KARNATAKA.csv",
]


def _to_float(value: str | None) -> float:
    if value is None:
        return 0.0
    text = str(value).strip()
    if not text:
        return 0.0
    try:
        return float(text)
    except ValueError:
        return 0.0


def _read_csv(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows: list[dict[str, Any]] = []
        for row in reader:
            rows.append({
                "sl_no": row.get("Sl. No.", ""),
                "act": (row.get("ACT") or "").strip(),
                "major_head": (row.get("MAJOR HEAD") or "").strip(),
                "minor_head": (row.get("MINOR HEAD") or "").strip(),
                "current_year_upto_review": _to_float(row.get("During the current year upto the end of month under review")),
                "corresponding_month_previous_year": _to_float(row.get("During the corresponding month of previous year")),
                "previous_month": _to_float(row.get("During the previous month")),
                "current_month": _to_float(row.get("During the current month")),
                "month": (row.get("Month") or "").strip().upper(),
                "year": int(float(row["Year"])) if row.get("Year") else None,
            })
        return rows


def load_archive_crime_rows() -> list[dict[str, Any]]:
    for path in DEFAULT_FILES:
        if path.exists():
            return _read_csv(path)
    return []

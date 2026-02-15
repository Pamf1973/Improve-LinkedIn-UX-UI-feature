import re
import math
from datetime import datetime, timezone
from urllib.parse import quote


def title_case(s: str) -> str:
    return re.sub(r"\b\w", lambda m: m.group().upper(), s)


def parse_salary_min(s: str) -> int:
    if not s:
        return 0
    m = re.findall(r"[\d,]+", s)
    return int(m[0].replace(",", "")) if m else 0


def days_ago(d: str) -> int:
    if not d:
        return 999
    try:
        dt = datetime.fromisoformat(d)
        diff = datetime.now(timezone.utc) - dt
        return max(0, diff.days)
    except Exception:
        return 999


def fmt_type(t: str) -> str:
    mapping = {
        "full_time": "Full-time",
        "part_time": "Part-time",
        "contract": "Contract",
        "freelance": "Freelance",
        "internship": "Internship",
    }
    return mapping.get(t, t or "Full-time")


def logo_url(name: str, raw: str = "") -> str:
    if raw and raw.startswith("http"):
        return raw
    return f"https://ui-avatars.com/api/?name={quote(name)}&background=0a66c2&color=fff&size=100&bold=true"

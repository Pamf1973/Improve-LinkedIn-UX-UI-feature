import asyncio
import time
import random
from urllib.parse import quote

import aiohttp

from config import (
    DEFAULT_SKILLS, US_STATES, US_CITIES, WORLDWIDE_TERMS, CACHE_TTL_SECONDS,
)
from services.remotive import fetch_remotive
from services.arbeitnow import fetch_arbeitnow
from services.scoring import score_match, get_matched
from utils import logo_url, fmt_type
from services.linkedin_url import generate_linkedin_search_url

# In-memory cache
_cache: dict[str, tuple[float, list[dict]]] = {}


def is_us_location(location: str) -> bool:
    loc = location.lower().strip()
    if any(t in loc for t in WORLDWIDE_TERMS):
        return True
    if "united states" in loc or "usa" in loc:
        return True
    # Check state abbreviation after a comma (e.g. "San Francisco, CA")
    if "," in location:
        after_comma = location.split(",")[-1].strip().upper()
        # Could be "CA" or "CA 94102" — take first token
        state_token = after_comma.split()[0] if after_comma else ""
        if state_token in US_STATES:
            return True
    if any(city in loc for city in US_CITIES):
        return True
    return False


def fallback_jobs(user_skills: list[str]) -> list[dict]:
    base = [
        {"id": "fb-1", "title": "Senior Product Designer", "company": "Stripe",
         "location": "San Francisco, CA", "salary": "$140K-$180K", "salaryMin": 140000,
         "skills": ["Figma", "Design Systems", "Product Strategy"], "jobType": "Full-time",
         "postedDays": 2, "description": "<p>Lead end-to-end UI/UX design for flagship fintech products.</p>"},
        {"id": "fb-2", "title": "Frontend Engineer", "company": "TikTok",
         "location": "Los Angeles, CA", "salary": "$120K-$160K", "salaryMin": 120000,
         "skills": ["React", "TypeScript", "CSS", "Performance"], "jobType": "Full-time",
         "postedDays": 1, "description": "<p>Build the future of digital entertainment at massive scale.</p>"},
        {"id": "fb-3", "title": "Staff Product Designer", "company": "Figma",
         "location": "San Francisco, CA", "salary": "$180K-$220K", "salaryMin": 180000,
         "skills": ["Systems Thinking", "Design Tools", "UX Research"], "jobType": "Full-time",
         "postedDays": 5, "description": "<p>Design the future of design tools used by millions worldwide.</p>"},
        {"id": "fb-4", "title": "Lead Product Designer", "company": "Netflix",
         "location": "Los Gatos, CA", "salary": "$200K-$280K", "salaryMin": 200000,
         "skills": ["Team Leadership", "Entertainment", "Data-Driven Design"], "jobType": "Full-time",
         "postedDays": 3, "description": "<p>Reimagine how millions discover and enjoy content.</p>"},
        {"id": "fb-5", "title": "Product Designer", "company": "Airbnb",
         "location": "Seattle, WA", "salary": "$150K-$190K", "salaryMin": 150000,
         "skills": ["Mobile Design", "Figma", "User Research"], "jobType": "Full-time",
         "postedDays": 1, "description": "<p>Design experiences that connect people around the world.</p>"},
        {"id": "fb-6", "title": "Senior UX Engineer", "company": "Google",
         "location": "Mountain View, CA", "salary": "$160K-$200K", "salaryMin": 160000,
         "skills": ["JavaScript", "Accessibility", "Design Engineering"], "jobType": "Full-time",
         "postedDays": 4, "description": "<p>Bridge design and engineering on core products.</p>"},
    ]
    results = []
    for j in base:
        company_slug = j["company"].lower().replace(" ", "")
        results.append({
            **j,
            "logo": f"https://logo.clearbit.com/{company_slug}.com?size=100",
            "locationType": "remote",
            "match": 80 + random.randint(0, 14),
            "isHtml": True,
            "userSkillMatch": get_matched(j["skills"], user_skills)[:2],
            "url": f"https://www.linkedin.com/jobs/search/?keywords={quote(j['title'] + ' ' + j['company'])}",
            "category": "Design",
            "source": "fallback",
            "linkedinSearchUrl": generate_linkedin_search_url(j["title"], j["company"]),
        })
    return results


async def fetch_all_jobs(
    query: str = "",
    categories: list[str] | None = None,
    user_skills: list[str] | None = None,
    filters: dict | None = None,
) -> tuple[list[dict], bool]:
    categories = categories or []
    user_skills = [s.lower() for s in (user_skills or DEFAULT_SKILLS)]
    filters = filters or {}

    cache_key = f"{query}|{','.join(sorted(categories))}"
    now = time.time()
    if cache_key in _cache:
        ts, cached_jobs = _cache[cache_key]
        if now - ts < CACHE_TTL_SECONDS:
            jobs = _apply_filters(cached_jobs, filters)
            return jobs, True

    tasks = []
    cats = categories[:5] if categories else [""]
    async with aiohttp.ClientSession() as session:
        for cat in cats:
            tasks.append(fetch_remotive(session, query, cat, user_skills))
        tasks.append(fetch_arbeitnow(session, query, user_skills))
        results = await asyncio.gather(*tasks, return_exceptions=True)

    jobs = []
    for r in results:
        if isinstance(r, list):
            jobs.extend(r)

    # US-only filter
    jobs = [j for j in jobs if is_us_location(j["location"])]

    # Dedup by title + company
    seen: set[str] = set()
    unique = []
    for j in jobs:
        key = (j["title"] + j["company"]).lower().replace(" ", "")
        if key not in seen:
            seen.add(key)
            unique.append(j)
    jobs = unique

    # Sort by match desc
    jobs.sort(key=lambda j: j["match"], reverse=True)

    if not jobs:
        jobs = fallback_jobs(user_skills)

    _cache[cache_key] = (now, jobs)
    jobs = _apply_filters(jobs, filters)
    return jobs, False


def _apply_filters(jobs: list[dict], filters: dict) -> list[dict]:
    result = jobs

    # Minimum salary filter
    min_sal = filters.get("minSalary", 0)
    if min_sal > 0:
        result = [j for j in result if j["salaryMin"] >= min_sal]

    # Job type filter
    jt_ids = filters.get("jobTypes") or []
    if jt_ids:
        allowed = {fmt_type(t) for t in jt_ids}
        result = [j for j in result if j["jobType"] in allowed]

    # Existing boolean filters (from StackView quick-filter pills)
    if filters.get("fulltime"):
        result = [j for j in result if j["jobType"] == "Full-time"]
    if filters.get("salary"):
        result = [j for j in result if j["salary"]]
    if filters.get("recent"):
        result = [j for j in result if j["postedDays"] <= 7]
    return result

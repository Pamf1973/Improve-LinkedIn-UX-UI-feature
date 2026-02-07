import re

import aiohttp
from config import REMOTIVE_URL, REMOTIVE_LIMIT
from utils import title_case, parse_salary_min, days_ago, fmt_type, logo_url
from services.scoring import score_match, get_matched
from services.linkedin_url import generate_linkedin_search_url


def map_remotive(r: dict, user_skills: list[str]) -> dict:
    tags = [title_case(t.strip()) for t in (r.get("tags") or []) if t.strip()]
    title = (r.get("title") or "").strip()
    title = re.sub(r"\s*\[.*?\]", "", title).strip() or "Untitled"
    company = r.get("company_name") or "Unknown"
    return {
        "id": f"rm-{r.get('id', '')}",
        "title": title,
        "company": company,
        "logo": logo_url(company, r.get("company_logo", "")),
        "location": r.get("candidate_required_location") or "Worldwide",
        "locationType": "remote",
        "salary": r.get("salary") or "",
        "salaryMin": parse_salary_min(r.get("salary") or ""),
        "match": score_match(tags, user_skills),
        "postedDays": days_ago(r.get("publication_date") or ""),
        "description": r.get("description") or "",
        "isHtml": True,
        "skills": tags[:6],
        "userSkillMatch": get_matched(tags, user_skills)[:6],
        "url": r.get("url") or "",
        "jobType": fmt_type(r.get("job_type") or ""),
        "category": r.get("category") or "",
        "source": "remotive",
        "linkedinSearchUrl": generate_linkedin_search_url(title, company),
    }


async def fetch_remotive(
    session: aiohttp.ClientSession,
    query: str,
    category: str,
    user_skills: list[str],
) -> list[dict]:
    params = {"limit": str(REMOTIVE_LIMIT)}
    if query:
        params["search"] = query
    if category:
        params["category"] = category
    async with session.get(REMOTIVE_URL, params=params) as resp:
        if resp.status != 200:
            return []
        data = await resp.json()
        return [map_remotive(r, user_skills) for r in (data.get("jobs") or [])]

import aiohttp
import random
from config import ARBEITNOW_URL, ARBEITNOW_LIMIT
from utils import title_case, days_ago, logo_url
from services.scoring import score_match, get_matched
from services.linkedin_url import generate_linkedin_search_url


def map_arbeitnow(r: dict, user_skills: list[str]) -> dict:
    tags = [title_case(t.strip()) for t in (r.get("tags") or []) if t.strip()]
    title = (r.get("title") or "").strip() or "Untitled"
    company = r.get("company_name") or "Unknown"
    slug = r.get("slug") or f"{random.randint(10000, 99999)}"
    location = r.get("location") or ("Remote" if r.get("remote") else "Unknown")
    return {
        "id": f"an-{slug}",
        "title": title,
        "company": company,
        "logo": logo_url(company, r.get("company_logo", "")),
        "location": location,
        "locationType": "remote" if r.get("remote") else "onsite",
        "salary": "",
        "salaryMin": 0,
        "match": score_match(tags, user_skills),
        "postedDays": days_ago(r.get("created_at") or ""),
        "description": r.get("description") or "",
        "isHtml": True,
        "skills": tags[:6],
        "userSkillMatch": get_matched(tags, user_skills)[:6],
        "url": r.get("url") or f"https://www.arbeitnow.com/view/{slug}",
        "jobType": (r.get("job_types") or ["Full-time"])[0],
        "category": "",
        "source": "arbeitnow",
        "linkedinSearchUrl": generate_linkedin_search_url(title, company),
    }


async def fetch_arbeitnow(
    session: aiohttp.ClientSession,
    query: str,
    user_skills: list[str],
) -> list[dict]:
    async with session.get(ARBEITNOW_URL) as resp:
        if resp.status != 200:
            return []
        data = await resp.json()
        jobs = [map_arbeitnow(r, user_skills) for r in (data.get("data") or [])]
        if query:
            q = query.lower()
            jobs = [
                j for j in jobs
                if q in j["title"].lower()
                or q in j["company"].lower()
                or any(q in s.lower() for s in j["skills"])
            ]
        return jobs[:ARBEITNOW_LIMIT]

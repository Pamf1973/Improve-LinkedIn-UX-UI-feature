from urllib.parse import quote


def generate_linkedin_search_url(title: str, company: str) -> str:
    query = f"{title} {company}".strip()
    return f"https://www.linkedin.com/jobs/search/?keywords={quote(query)}"

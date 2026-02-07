import os
import base64
import json
import secrets
import urllib.parse

import aiohttp
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from config import CATEGORIES, JOB_TYPES
from models import JobsRequest, JobsResponse, Job
from services.aggregator import fetch_all_jobs

load_dotenv()

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI", "http://localhost:8000/api/auth/linkedin/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# In-memory state store (fine for single-process dev; use Redis in production)
_oauth_states = set()

app = FastAPI(title="MatchPoint API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/categories")
async def get_categories():
    return CATEGORIES


@app.get("/api/job-types")
async def get_job_types():
    return JOB_TYPES


@app.post("/api/jobs", response_model=JobsResponse)
async def get_jobs(req: JobsRequest):
    jobs, cached = await fetch_all_jobs(
        query=req.query,
        categories=req.categories,
        user_skills=req.skills,
        filters=req.filters,
    )
    job_models = [Job(**j) for j in jobs]
    return JobsResponse(jobs=job_models, total=len(job_models), cached=cached)


# --------------- LinkedIn OAuth 2.0 (OpenID Connect) ---------------

@app.get("/api/auth/linkedin")
async def linkedin_auth():
    """Redirect user to LinkedIn authorization page."""
    if not LINKEDIN_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error=not_configured")
    state = secrets.token_urlsafe(32)
    _oauth_states.add(state)
    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": LINKEDIN_CLIENT_ID,
        "redirect_uri": LINKEDIN_REDIRECT_URI,
        "scope": "openid profile email",
        "state": state,
    })
    return RedirectResponse(f"https://www.linkedin.com/oauth/v2/authorization?{params}")


@app.get("/api/auth/linkedin/callback")
async def linkedin_callback(code: str = "", state: str = "", error: str = ""):
    """Handle LinkedIn OAuth callback: exchange code for token, fetch profile."""
    if error:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error={urllib.parse.quote(error)}")

    if state not in _oauth_states:
        return RedirectResponse(f"{FRONTEND_URL}?auth_error=invalid_state")
    _oauth_states.discard(state)

    async with aiohttp.ClientSession() as session:
        # Exchange authorization code for access token
        token_resp = await session.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": LINKEDIN_REDIRECT_URI,
                "client_id": LINKEDIN_CLIENT_ID,
                "client_secret": LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_resp.status != 200:
            return RedirectResponse(f"{FRONTEND_URL}?auth_error=token_failed")
        token_data = await token_resp.json()
        access_token = token_data.get("access_token")

        # Fetch profile via OpenID Connect userinfo endpoint
        profile_resp = await session.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_resp.status != 200:
            return RedirectResponse(f"{FRONTEND_URL}?auth_error=profile_failed")
        profile = await profile_resp.json()

    user = {
        "name": profile.get("name", ""),
        "firstName": profile.get("given_name", ""),
        "lastName": profile.get("family_name", ""),
        "email": profile.get("email", ""),
        "picture": profile.get("picture", ""),
    }
    user_b64 = base64.urlsafe_b64encode(json.dumps(user).encode()).decode()
    return RedirectResponse(f"{FRONTEND_URL}?linkedin_user={user_b64}")

from pydantic import BaseModel, ConfigDict


class Job(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    company: str
    logo: str
    location: str
    locationType: str
    salary: str
    salaryMin: int
    match: int
    postedDays: int
    description: str
    isHtml: bool
    skills: list[str]
    userSkillMatch: list[str]
    url: str
    jobType: str
    category: str
    source: str
    linkedinSearchUrl: str = ""


class JobsRequest(BaseModel):
    query: str = ""
    categories: list[str] = []
    skills: list[str] = []
    filters: dict = {}


class JobsResponse(BaseModel):
    jobs: list[Job]
    total: int
    cached: bool

REMOTIVE_URL = "https://remotive.com/api/remote-jobs"
ARBEITNOW_URL = "https://www.arbeitnow.com/api/job-board-api"
REMOTIVE_LIMIT = 100
ARBEITNOW_LIMIT = 50
CACHE_TTL_SECONDS = 300

CATEGORIES = [
    {"id": "software-dev", "label": "Software Dev", "icon": "fa-code"},
    {"id": "design", "label": "Design", "icon": "fa-palette"},
    {"id": "product", "label": "Product", "icon": "fa-box"},
    {"id": "marketing", "label": "Marketing", "icon": "fa-bullhorn"},
    {"id": "data", "label": "Data", "icon": "fa-database"},
    {"id": "devops", "label": "DevOps & Infra", "icon": "fa-server"},
    {"id": "customer-support", "label": "Support", "icon": "fa-headset"},
    {"id": "sales", "label": "Sales", "icon": "fa-handshake"},
    {"id": "finance-legal", "label": "Finance & Legal", "icon": "fa-scale-balanced"},
    {"id": "hr", "label": "Human Resources", "icon": "fa-users"},
    {"id": "qa", "label": "QA", "icon": "fa-bug"},
    {"id": "writing", "label": "Writing", "icon": "fa-pen"},
]

JOB_TYPES = [
    {"id": "full_time", "label": "Full-time", "icon": "fa-briefcase"},
    {"id": "contract", "label": "Contract", "icon": "fa-file-contract"},
    {"id": "part_time", "label": "Part-time", "icon": "fa-clock"},
    {"id": "freelance", "label": "Freelance", "icon": "fa-laptop"},
    {"id": "internship", "label": "Internship", "icon": "fa-graduation-cap"},
]

DEFAULT_SKILLS = [
    "javascript", "react", "design", "figma", "css", "html", "python",
    "product", "ui", "ux", "typescript", "node", "marketing", "data",
    "analytics", "devops", "aws", "docker", "sql", "git", "agile",
    "management", "engineering", "frontend", "backend", "mobile",
]

US_STATES = {
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
    "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
    "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
    "VA","WA","WV","WI","WY","DC",
}

US_CITIES = {
    "new york","san francisco","los angeles","chicago","seattle","austin","boston",
    "denver","atlanta","portland","miami","dallas","houston","phoenix","philadelphia",
    "san diego","san jose","detroit","minneapolis","washington","charlotte","nashville",
    "raleigh","salt lake","las vegas","tampa","orlando","pittsburgh","columbus",
    "indianapolis","brooklyn","manhattan","oakland","sacramento","san antonio",
    "jacksonville","fort worth","memphis","baltimore","milwaukee","albuquerque",
    "tucson","fresno","mesa","kansas city","omaha","colorado springs","reno",
    "cleveland","cincinnati","st louis","st. louis",
}

WORLDWIDE_TERMS = {"worldwide","anywhere","global","remote","usa or","us or","north america"}

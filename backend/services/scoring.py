import random


def score_match(tags: list[str], user_skills: list[str]) -> int:
    if not tags:
        return 70 + random.randint(0, 19)
    matched = [t for t in tags if any(s in t.lower() for s in user_skills)]
    raw = round((len(matched) / len(tags)) * 40 + random.random() * 25 + 35)
    return max(60, min(99, raw))


def get_matched(tags: list[str], user_skills: list[str]) -> list[str]:
    return [t for t in tags if any(s in t.lower() for s in user_skills)]

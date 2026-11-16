#!/usr/bin/env python3
"""Create exactly one rich fictional Development audition through the real agency API.

Requires GA_DEMO_EMAIL and GA_DEMO_PASSWORD for an existing Development QA agency.
No DB reset, hardcoded passwords, real payments, Production access, or migrations.
Designed for local Codex/Grok execution in an authenticated environment.
"""
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = "https://frontend-develop-3d3e.up.railway.app"
API = ROOT + "/api"
TITLE = "[DEV-DEMO] 2027 GLOBAL ROOKIE ARTIST AUDITION — FULL PROFILE"
EMAIL = os.environ.get("GA_DEMO_EMAIL", "").strip()
PASSWORD = os.environ.get("GA_DEMO_PASSWORD", "")

def call(method, path, data=None, token=None):
    payload = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else None
    headers = {"Accept": "application/json", "X-Content-Locale": "ko"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
    req = Request(API + path, data=payload, headers=headers, method=method)
    try:
        with urlopen(req, timeout=25) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        # Never echo request headers, body or credentials.
        raise RuntimeError(f"{method} {path}: HTTP {exc.code}") from None
    except URLError as exc:
        raise RuntimeError(f"{method} {path}: network error ({exc.reason})") from None

def main():
    if not EMAIL.endswith("@audition.local") or not PASSWORD:
        sys.exit("Provide a DEV QA agency via GA_DEMO_EMAIL (@audition.local) and GA_DEMO_PASSWORD.")
    # Idempotency: the sample is a public OPEN post with a unique title.
    public = call("GET", "/auditions?status=OPEN")
    if not isinstance(public, list):
        sys.exit("Unexpected Development public auditions response; nothing changed.")
    for item in public:
        if isinstance(item, dict) and item.get("title") == TITLE:
            print(f"Already exists: {ROOT}/ko/auditions/{item['id']}")
            return

    auth = call("POST", "/auth/login", {"email": EMAIL, "password": PASSWORD})
    token = auth.get("token") if isinstance(auth, dict) else None
    if not token:
        sys.exit("QA agency authentication failed; no audition created.")

    asset = ROOT + "/dev-assets/"
    payload = {
        "title": TITLE,
        "description": (
            "[DEVELOPMENT SAMPLE / FICTIONAL AGENCY — NOT A REAL CASTING CALL]\\n\\n"
            "STUDIO NOVA is looking for rookie vocalists, dancers, rappers and actors to join a new global artist project. "
            "This is a complete example of an agency-authored audition used to review the real mobile/web detail layout.\\n\\n"
            "Project: global rookie artist showcase (fictional)\\n"
            "Age range: approximately 15–28; minors must have guardian consent.\\n"
            "Languages: any language; audition videos may be submitted in the applicant's native language.\\n"
            "Application: online profile, a 60–120 second performance clip and a short self-introduction.\\n"
            "Screening: round 1 video review → round 2 online interview → round 3 in-person stage assessment.\\n"
            "Travel and accommodation for final candidates: conditions communicated individually by the fictional agency.\\n"
            "Fees: the platform's configured application credit policy applies.\\n\\n"
            "All names, dates, eligibility and benefits on this page are sample data only."
        ),
        "status": "OPEN",
        "agencyName": "[DEV-DEMO] STUDIO NOVA (fictional)",
        "images": {
            "original": asset + "hero-stage.webp",
            "medium": asset + "thumb-stage.webp",
            "thumb": asset + "thumb-vocalist.webp",
        },
        "galleryImages": [
            asset + "thumb-vocalist.webp",
            asset + "thumb-dance.webp",
            asset + "thumb-mic.webp",
        ],
        "customTagNames": ["Global Rookie", "K-POP", "Vocal", "Dance", "Rap", "Acting"],
        "recruitFields": ["Vocal", "Dance", "Rap", "Acting"],
        "qualifications": [
            "All nationalities; ages 15–28 (sample criteria)",
            "Applicants under 19 require guardian consent",
            "Solo and group entries accepted",
            "No prior agency contract required (sample criteria)",
        ],
        "schedules": [
            "Application: 2027-01-10 – 2027-02-20",
            "Round 1 video screening: 2027-02-21 – 2027-02-28",
            "Round 2 online interview: 2027-03-05 – 2027-03-12",
            "Round 3 live assessment: March 2027 (sample)",
        ],
        "benefits": [
            "Final candidates: stage coaching and profile evaluation (sample)",
            "Selected overseas candidates: airfare/accommodation assistance (sample; subject to terms)",
            "Agency project participation discussion (not a guarantee)",
        ],
        "location": "Seoul, South Korea / online first round (sample)",
        "startDate": "2027-01-10",
        "endDate": "2027-02-20",
        "deadlineAt": "2027-02-20T14:59:59Z",
        "countryCode": "KR",
        "hostCountry": "KR",
        "defaultLocale": "en",
        "processMode": "MULTI_ROUND",
        # Existing approved single branch is attached automatically by the backend.
    }
    created = call("POST", "/auditions", payload, token)
    audition_id = created.get("id") if isinstance(created, dict) else None
    if not audition_id:
        sys.exit("Create returned no audition ID; inspect Development logs.")
    print("Created ONE full-content fictional Development audition:")
    print(f"{ROOT}/ko/auditions/{audition_id}")
    print(f"Android app: Auditions -> search for [DEV-DEMO] GLOBAL ROOKIE")
    print("Verify 5 languages, country, dates, 4 fields, requirements, schedule, benefits, gallery and round labels.")
    print("Intro video intentionally omitted: no verified demo clip URL exists. Do not misrepresent a real agency.")

if __name__ == "__main__":
    main()

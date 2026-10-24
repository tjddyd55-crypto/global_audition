#!/usr/bin/env python3
"""Verify develop QA seed via public API (development only)."""

import os
import json
import sys
import urllib.error
import urllib.request

BASE = "https://frontend-develop-3d3e.up.railway.app/api"
IDS = {
    "fresh_audition": "00000010-0000-4000-8000-000000000010",
    "closed_audition": "00000011-0000-4000-8000-000000000011",
    "vote_audition": "00000014-0000-4000-8000-000000000014",
    "existing_audition": "00000015-0000-4000-8000-000000000015",
    "vote_app_b": "00000021-0000-4000-8000-000000000021",
    "vote_app_c": "00000022-0000-4000-8000-000000000022",
    "channel_owner": "00000005-0000-4000-8000-000000000005",
    "video_1": "00000041-0000-4000-8000-000000000041",
}


def req(method: str, path: str, token: str | None = None, body: dict | None = None):
    data = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    with urllib.request.urlopen(request) as resp:
        return json.loads(resp.read().decode("utf-8"))


def login():
    res = req("POST", "/auth/login", body={"email": "qa-dev-applicant@audition.local", "password": os.environ["QA_DEV_PASSWORD"]})
    return res["token"]


def main() -> int:
    token = login()
    results = {}

    auditions_raw = req("GET", "/auditions", token)
    auditions = auditions_raw if isinstance(auditions_raw, list) else auditions_raw.get("value", [])
    results["open_auditions"] = len(auditions) >= 5

    credits_raw = req("GET", "/credits/balance", token)
    credits = credits_raw.get("balance", credits_raw) if isinstance(credits_raw, dict) else credits_raw
    results["credits"] = credits >= 1

    vote_raw = req("GET", f"/auditions/{IDS['vote_audition']}/votes", token)
    vote = vote_raw.get("data", vote_raw) if isinstance(vote_raw, dict) else vote_raw
    results["vote_candidates"] = len(vote.get("items", [])) == 3

    channels_raw = req("GET", "/channels/public")
    channels = channels_raw.get("data", channels_raw) if isinstance(channels_raw, dict) else channels_raw
    results["channels"] = len(channels) >= 1

    videos_raw = req("GET", "/videos/browse")
    videos = videos_raw.get("data", videos_raw) if isinstance(videos_raw, dict) else videos_raw
    results["videos"] = len(videos) >= 2

    # Apply fresh — re-runs are expected: an existing application (HTTP 409) means
    # "already applied" and is NOT retried, so no second fee can be attempted.
    mine_raw = req("GET", "/applications/me", token)
    mine = mine_raw if isinstance(mine_raw, list) else mine_raw.get("value", mine_raw.get("data", []))
    already = any(str(a.get("auditionId")) == IDS["fresh_audition"] for a in mine)
    if already:
        results["apply_fresh"] = True
        print("apply_fresh: already applied (re-run), skipping submit")
    else:
        try:
            apply = req(
                "POST",
                "/applications",
                token,
                {"auditionId": IDS["fresh_audition"], "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"},
            )
            results["apply_fresh"] = apply.get("id") is not None
        except urllib.error.HTTPError as exc:
            results["apply_fresh"] = exc.code == 409
            print("apply_fresh: HTTP", exc.code, "(409 = already applied)", file=sys.stderr)
        except Exception as exc:
            results["apply_fresh"] = False
            print("apply_fresh error:", exc, file=sys.stderr)

    # Duplicate apply should fail
    try:
        req(
            "POST",
            "/applications",
            token,
            {"auditionId": IDS["fresh_audition"], "videoUrl": "https://www.youtube.com/watch?v=aqz-KE-bpKQ"},
        )
        results["apply_duplicate_blocked"] = False
    except urllib.error.HTTPError as exc:
        results["apply_duplicate_blocked"] = exc.code == 409

    # Vote cast / cancel / recast
    cast1_raw = req(
        "POST",
        "/votes",
        token,
        {"auditionId": IDS["vote_audition"], "applicationId": IDS["vote_app_b"]},
    )
    cast1 = cast1_raw.get("data", cast1_raw) if isinstance(cast1_raw, dict) else cast1_raw
    results["vote_cast"] = cast1.get("applicationId") == IDS["vote_app_b"]

    try:
        req(
            "POST",
            "/votes",
            token,
            {"auditionId": IDS["vote_audition"], "applicationId": IDS["vote_app_b"]},
        )
        results["vote_duplicate_ok"] = True
    except Exception:
        results["vote_duplicate_ok"] = False

    req("DELETE", f"/votes/{IDS['vote_app_b']}", token)
    vote_after_cancel_raw = req("GET", f"/auditions/{IDS['vote_audition']}/votes", token)
    vote_after_cancel = vote_after_cancel_raw.get("data", vote_after_cancel_raw)
    my_vote = vote_after_cancel["summary"]["myVoteCount"]
    results["vote_cancel"] = my_vote == 0

    req(
        "POST",
        "/votes",
        token,
        {"auditionId": IDS["vote_audition"], "applicationId": IDS["vote_app_c"]},
    )
    vote_recast_raw = req("GET", f"/auditions/{IDS['vote_audition']}/votes", token)
    vote_recast = vote_recast_raw.get("data", vote_recast_raw)
    voted_item = next((i for i in vote_recast["items"] if i.get("isVoted")), None)
    results["vote_recast"] = voted_item and voted_item["applicationId"] == IDS["vote_app_c"]

    apps = req("GET", "/me/applications", token)
    app_list = apps if isinstance(apps, list) else apps.get("value", apps.get("data", []))
    results["my_applications"] = len(app_list) >= 2

    print(json.dumps({"results": results, "ids": IDS}, ensure_ascii=False, indent=2))
    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())

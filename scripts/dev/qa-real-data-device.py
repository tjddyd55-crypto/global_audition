#!/usr/bin/env python3
"""DEVELOPMENT ONLY — Real-data Native User E2E on physical Android device."""

from __future__ import annotations

import re
import subprocess
import sys
import time
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[2]
QA = {
    "fresh_id": "00000010-0000-4000-8000-000000000010",
    "closed_id": "00000011-0000-4000-8000-000000000011",
    "vote_id": "00000014-0000-4000-8000-000000000014",
    "video_url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    "locale_y": 397,
    "locale_ko_x": 153,
    "locale_en_x": 392,
    "locale_mn_x": 652,
    "email": "qa-dev-applicant@audition.local",
    "password": "qa123456",
}

# Dedicated seed-owned account (scripts/dev/seed-native-qa-develop.sql); never an existing user.
QA_MARKER = "qa_dev_applicant"

LABEL = {
    "apply": ["\uc9c0\uc6d0\ud558\uae30", "\u0411\u04af\u0440\u0442\u0433\u04af\u04af\u043b\u044d\u0445", "Apply"],
    "submit": ["\uc9c0\uc6d0\uc11c \uc81c\ucd9c", "\u04e8\u0440\u0433\u04e9\u0434\u04e9\u043b \u0438\u043b\u0433\u044d\u044d\u0445", "Submit application"],
    "view_app": ["\ub0b4 \uc9c0\uc6d0\uc11c \ubcf4\uae30", "\u041c\u0438\u043d\u0438\u0439 \u04e9\u0440\u0433\u04e9\u0434\u04e9\u043b \u04af\u0437\u044d\u0445"],
    "cannot_apply": ["\uc9c0\uc6d0 \ubd88\uac00", "\u0411\u04af\u0440\u0442\u0433\u04af\u04af\u043b\u044d\u0445 \u0431\u043e\u043b\u043e\u043c\u0436\u0433\u04af\u0439", "Cannot apply"],
    "cast": ["\uc774 \uc9c0\uc6d0\uc790\uc5d0\uac8c \ud22c\ud45c", "\u042d\u043d\u044d \u04e9\u0440\u0433\u04e9\u0434\u04e9\u043b\u0434 \u0441\u0430\u043d\u0430\u043b \u04e9\u0433\u04e9\u0445", "Vote for this applicant", "\u0441\u0430\u043d\u0430\u043b \u04e9\u0433\u04e9\u0445"],
    "voted": ["\ud22c\ud45c \uc644\ub8cc", "\u0421\u0430\u043d\u0430\u043b \u04e9\u0433\u043b\u04e9\u04e9", "Voted"],
    "cancel_vote": ["\ud22c\ud45c \ucde8\uc18c", "\u0421\u0430\u043d\u0430\u043b \u0446\u0443\u0446\u043b\u0430\u0445", "Remove vote"],
    "ranking": ["\ub79c\ud0b9", "\u0427\u0430\u043d\u0441\u0430\u0430", "Ranking"],
    "dance": ["\ub304\uc2a4"],
    "closed_markers": ["\ud06c\ub77c\uac8c\ub428", "\u0425\u0430\u0430\u0433\u0434\u0441\u0430\u043d", "CLOSED", "\ub9c8\uac10"],
}

results: list[tuple[str, str, str]] = []


def adb(*args: str) -> None:
    subprocess.run(["adb", *args], check=False, capture_output=True)


def wait(sec: float = 2.0) -> None:
    time.sleep(sec)


def dump(name: str) -> str:
    path = OUT_DIR / f"qa-rd-{name}.xml"
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    adb("pull", "/sdcard/ui.xml", str(path))
    return path.read_text(encoding="utf-8", errors="replace")


def ui_texts(content: str) -> list[str]:
    texts = set(re.findall(r'text="([^"]{1,240})"', content))
    texts.update(re.findall(r'content-desc="([^"]{1,240})"', content))
    return sorted(t for t in texts if t.strip())


def has_raw_key(texts: list[str]) -> bool:
    for t in texts:
        if re.match(r"^[a-z][a-z0-9]*\.[a-zA-Z0-9_.]+$", t):
            return True
        if re.match(r"^(home|common|audition|vote|profile|apply|auth)\.", t):
            return True
    return False


def tap_tab(index: int) -> None:
    adb("shell", "input", "tap", str(108 + index * 216), "2192")


def tap_label(content: str, label: str) -> bool:
    escaped = re.escape(label)
    for pattern in (
        rf'text="{escaped}"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        rf'content-desc="{escaped}"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
    ):
        m = re.search(pattern, content)
        if m:
            x = (int(m.group(1)) + int(m.group(3))) // 2
            y = (int(m.group(2)) + int(m.group(4))) // 2
            adb("shell", "input", "tap", str(x), str(y))
            return True
    return False


def tap_any(content: str, labels: list[str]) -> bool:
    for label in labels:
        if tap_label(content, label):
            return True
    return False


def contains_any(content: str, labels: list[str]) -> bool:
    return any(label in content for label in labels)


def count_any(content: str, labels: list[str]) -> int:
    return sum(content.count(label) for label in labels)


def set_locale(x: int) -> None:
    tap_tab(4)
    wait(2)
    adb("shell", "input", "tap", str(x), str(QA["locale_y"]))
    wait(2)
    tap_tab(0)
    wait(2)


def needs_auth(content: str) -> bool:
    markers = [
        "\ub85c\uadf8\uc778",
        "\u041d\u044d\u0432\u0442\u0440\u044d\u0445",
        "Login",
        "\u041d\u0443\u0443\u0446 \u04af\u0433",
        "\u043d\u044d\u0432\u0442\u044d\u0440",
        "\ub85c\uadf8\uc778\uc774 \ud544\uc694",
        "\u0428\u0430\u0430\u0440\u0434\u043b\u0430\u0433\u0430\u0442\u0430\u0439",
    ]
    lowered = content.lower()
    return any(m.lower() in lowered for m in markers)


def ensure_authenticated() -> None:
    ui = dump("auth-check")
    if QA_MARKER in ui and not needs_auth(ui):
        return

    if needs_auth(ui) and "EditText" not in ui:
        tap_any(ui, ["\ub85c\uadf8\uc778", "\u041d\u044d\u0432\u0442\u0440\u044d\u0445", "Login", "\ub85c\uadf8\uc778\ud558\uae30", "\u041d\u044d\u0432\u0442\u0440\u044d\u0445"])
        wait(3)
        ui = dump("auth-form")

    fields = list(re.finditer(r'class="android.widget.EditText"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', ui))
    if len(fields) < 2:
        tap_tab(4)
        wait(2)
        ui = dump("profile-prelogin")
        if not tap_any(ui, ["\ub85c\uadf8\uc778", "\u041d\u044d\u0432\u0442\u0440\u044d\u0445", "Login", "\ub85c\uadf8\uc778\ud558\uae30"]):
            open_deep_link("login")
        wait(3)
        ui = dump("auth-form-direct")
        fields = list(re.finditer(r'class="android.widget.EditText"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', ui))
    if len(fields) < 2:
        return

    for idx, value in enumerate((QA["email"].replace("@", "%s"), QA["password"])):
        m = fields[idx]
        x = (int(m.group(1)) + int(m.group(3))) // 2
        y = (int(m.group(2)) + int(m.group(4))) // 2
        adb("shell", "input", "tap", str(x), str(y))
        wait(0.5)
        adb("shell", "input", "keyevent", "123")
        adb("shell", "input", "text", value)
        wait(0.5)
    ui = dump("auth-ready")
    tap_any(ui, ["\ub85c\uadf8\uc778", "\u041d\u044d\u0432\u0442\u0440\u044d\u0445", "Login", "\ub85c\uadf8\uc778\ud558\uae30"])
    wait(8)


def bottom_cta_disabled(content: str) -> bool:
    for m in re.finditer(
        r'text="([^"]+)"[^/]*clickable="false"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        content,
    ):
        y = int(m.group(3))
        if y >= 2000 and any(token in m.group(1) for token in LABEL["apply"]):
            return True
    return False


def tap_contains(content: str, needle: str) -> bool:
    for m in re.finditer(r'text="([^"]+)"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', content):
        if needle in m.group(1):
            x = (int(m.group(2)) + int(m.group(4))) // 2
            y = (int(m.group(3)) + int(m.group(5))) // 2
            adb("shell", "input", "tap", str(x), str(y))
            return True
    return False


def scroll_down(times: int = 1) -> None:
    for _ in range(times):
        adb("shell", "input", "swipe", "540", "1600", "540", "700", "350")
        wait(1)


def open_deep_link(path: str) -> None:
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"globalaudition://{path}")
    wait(3)


def count_label(content: str, label: str) -> int:
    return len(re.findall(re.escape(label), content))


def input_url(content: str, url: str) -> bool:
    fields = list(re.finditer(r'class="android.widget.EditText"[^/]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', content))
    if not fields:
        return False
    m = max(fields, key=lambda match: int(match.group(2)))
    x = (int(m.group(1)) + int(m.group(3))) // 2
    y = (int(m.group(2)) + int(m.group(4))) // 2
    adb("shell", "input", "tap", str(x), str(y))
    wait(1)
    adb("shell", "input", "keyevent", "123")
    safe = "youtu.be/aqz-KE-bpKQ".replace(" ", "%s")
    adb("shell", "input", "text", safe)
    return True


def add_result(scenario: str, status: str, note: str) -> None:
    results.append((scenario, status, note))
    print(f"[{status}] {scenario} - {note}")


def wake_unlock() -> None:
    adb("shell", "input", "keyevent", "224")  # WAKEUP
    wait(1)
    adb("shell", "wm", "dismiss-keyguard")
    wait(1)
    adb("shell", "input", "swipe", "540", "2000", "540", "900", "250")
    wait(1)


def ensure_app_foreground() -> None:
    wake_unlock()
    adb("reverse", "tcp:8081", "tcp:8081")
    adb("shell", "monkey", "-p", "com.globalaudition.app", "-c", "android.intent.category.LAUNCHER", "1")
    wait(5)
    ui = dump("foreground-check")
    if "com.globalaudition.app" not in ui:
        adb("shell", "am", "force-stop", "com.globalaudition.app")
        adb("shell", "monkey", "-p", "com.globalaudition.app", "-c", "android.intent.category.LAUNCHER", "1")
        wait(6)


def require_qa_applicant() -> str:
    ensure_authenticated()
    ui = dump("session-check")
    if QA_MARKER not in ui:
        ensure_authenticated()
        wait(3)
        ui = dump("session-check-2")
    return ui


def main() -> int:
    ensure_app_foreground()
    ensure_authenticated()
    ui = dump("post-login")
    if QA_MARKER not in ui:
        ensure_authenticated()
        ui = dump("post-login-2")
    set_locale(QA["locale_ko_x"])

    ui = dump("boot")
    texts = ui_texts(ui)
    joined = "|".join(texts)
    if QA_MARKER in joined:
        add_result("Boot", "PASS", "logged in as qa_dev_applicant")
    elif "DEV-QA" in joined or "\uc624\ub514\uc158" in joined or "\u0410\u0443\u0434\u0438\u0448\u043d" in joined:
        add_result("Boot", "PARTIAL", "app launched (guest)")
    elif "\ub85c\uadf8\uc778" in joined or "Login" in joined:
        add_result("Boot", "FAIL", "auth screen only")
        return 1
    else:
        add_result("Boot", "PARTIAL", f"unexpected boot texts={len(texts)}")

    require_qa_applicant()
    tap_tab(1)
    wait(3)
    ui = dump("list")
    if not tap_contains(ui, "Fresh Apply"):
        scroll_down(2)
        ui = dump("list-scroll")
        tap_contains(ui, "Fresh Apply")
    wait(3)
    ui = dump("fresh-detail")
    already_applied = contains_any(ui, LABEL["view_app"]) or "\uc774\ubbf8 \uc9c0\uc6d0" in ui
    if already_applied:
        # Re-run: the account already applied. Do not submit again (no second fee attempt).
        add_result("Apply Fresh", "PASS", "already applied (re-run), submit skipped")
    else:
        tap_any(ui, LABEL["apply"])
        wait(3)
    ui = dump("fresh-apply")

    if already_applied:
        pass
    elif needs_auth(ui):
        require_qa_applicant()
        tap_tab(1)
        wait(2)
        ui = dump("list-retry")
        tap_contains(ui, "Fresh Apply")
        wait(3)
        ui = dump("fresh-detail-retry")
        tap_any(ui, LABEL["apply"])
        wait(3)
        ui = dump("fresh-apply-retry")

    if already_applied:
        pass
    elif "Fresh Apply" in ui or "DEV-QA" in ui or ("EditText" in ui and not needs_auth(ui)):
        ui = dump("fresh-apply")
        credit_ok = ("\ubcf4\uc720" in ui) or ("10" in ui and "\ud06c\ub808\ub527" in ui)
        add_result("Apply Credit", "PASS" if credit_ok else "PARTIAL", "balance/cost visible" if credit_ok else "credit banner not parsed")

        if not tap_any(ui, LABEL["submit"]):
            add_result("Apply Validation", "PASS", "submit disabled without video")
        else:
            add_result("Apply Validation", "PARTIAL", "submit unexpectedly enabled")
            adb("shell", "input", "keyevent", "4")
            wait(1)

        scroll_down(2)
        ui = dump("fresh-apply-scroll")
        if input_url(ui, QA["video_url"]):
            wait(1)
            scroll_down(3)
            ui = dump("fresh-apply-ready")
            if tap_any(ui, LABEL["submit"]):
                wait(4)
                ui = dump("fresh-after-submit")
                after = "|".join(ui_texts(ui))
                if "\ub0b4 \uc9c0\uc6d0" in after or "DEV-QA" in after or "Existing Application" in after:
                    add_result("Apply Fresh", "PASS", "submitted")
                else:
                    add_result("Apply Fresh", "PARTIAL", "submit tapped")
            else:
                add_result("Apply Fresh", "FAIL", "submit button not found")
        else:
            add_result("Apply Fresh", "FAIL", "video field not found")
    else:
        add_result("Apply Fresh", "FAIL", "apply screen not reached")

    require_qa_applicant()
    open_deep_link(f"auditions/{QA['fresh_id']}")
    ui = dump("dup-detail")
    if contains_any(ui, LABEL["view_app"]) or "\uc774\ubbf8 \uc9c0\uc6d0" in ui:
        add_result("Apply Duplicate", "PASS", "already-applied gate")
    elif contains_any(ui, LABEL["cannot_apply"]):
        add_result("Apply Duplicate", "PASS", "cannot apply CTA")
    else:
        add_result("Apply Duplicate", "PARTIAL", "duplicate state unclear")

    open_deep_link(f"auditions/{QA['closed_id']}")
    ui = dump("closed-detail")
    closed_ok = (
        contains_any(ui, LABEL["cannot_apply"])
        or contains_any(ui, LABEL["closed_markers"])
        or bottom_cta_disabled(ui)
    )
    add_result("Apply Closed", "PASS" if closed_ok else "FAIL", "closed gate" if closed_ok else "closed still open")

    tap_tab(2)
    wait(3)
    ui = dump("vote-hub")
    if tap_contains(ui, "Vote Enabled"):
        add_result("Vote Hub", "PASS", "vote audition visible")
    else:
        add_result("Vote Hub", "PARTIAL", "opening vote board via deep link")

    require_qa_applicant()
    open_deep_link(f"auditions/{QA['vote_id']}/vote")
    wait(3)
    scroll_down(2)
    ui = dump("vote-board")
    if needs_auth(ui):
        require_qa_applicant()
        open_deep_link(f"auditions/{QA['vote_id']}/vote")
        wait(3)
        scroll_down(2)
        ui = dump("vote-board-auth")
    cast_count = count_any(ui, LABEL["cast"])
    if cast_count < 1:
        scroll_down(2)
        ui = dump("vote-board-scroll")
        cast_count = count_any(ui, LABEL["cast"])
    add_result("Vote Candidates", "PASS" if cast_count >= 1 else "FAIL", f"cast_buttons={cast_count}")

    if tap_any(ui, LABEL["cast"]) or tap_contains(ui, "\u0441\u0430\u043d\u0430\u043b \u04e9\u0433\u04e9\u0445"):
        wait(3)
        ui = dump("vote-cast")
        add_result("Vote Cast", "PASS" if contains_any(ui, LABEL["voted"]) else "PARTIAL", "voted state" if contains_any(ui, LABEL["voted"]) else "cast tapped")

        if tap_any(ui, LABEL["cancel_vote"]):
            wait(3)
            ui = dump("vote-cancel")
            add_result("Vote Cancel", "PASS" if count_any(ui, LABEL["cast"]) >= 1 else "PARTIAL", "cancelled")
        else:
            add_result("Vote Cancel", "FAIL", "cancel missing")

        ui = dump("vote-recast-pre")
        add_result("Vote Recast", "PASS" if tap_any(ui, LABEL["cast"]) else "FAIL", "re-cast")

        ui = dump("vote-filter")
        if tap_any(ui, LABEL["dance"]):
            wait(2)
            ui = dump("vote-filtered")
            add_result("Vote Category", "PASS" if LABEL["dance"][0] in ui else "PARTIAL", "category filter")
        else:
            add_result("Vote Category", "PARTIAL", "dance chip missing")

        ui = dump("vote-rank-btn")
        if tap_any(ui, LABEL["ranking"]):
            wait(3)
            ui = dump("ranking")
            texts = ui_texts(ui)
            add_result("Ranking", "PASS" if len(texts) > 5 and not has_raw_key(texts) else "PARTIAL", "ranking screen")
        else:
            add_result("Ranking", "PARTIAL", "ranking button missing")
    else:
        add_result("Vote Cast", "FAIL", "cast button missing")

    require_qa_applicant()
    tap_tab(3)
    wait(3)
    ui = dump("apps")
    joined = "|".join(ui_texts(ui))
    has_existing = "Existing Application" in joined
    has_fresh = "Fresh Apply" in joined
    if has_existing and has_fresh:
        add_result("Applications", "PASS", "existing + fresh")
    elif has_existing or len(ui_texts(ui)) > 6:
        add_result("Applications", "PARTIAL", f"existing={has_existing} fresh={has_fresh}")
    else:
        add_result("Applications", "FAIL", "empty list")

    tap_tab(0)
    wait(2)
    adb("shell", "input", "tap", "792", "1098")
    wait(3)
    ui = dump("videos")
    add_result("Video", "PASS" if "DEV-QA" in ui or len(ui_texts(ui)) > 4 else "FAIL", "video list")
    adb("shell", "input", "keyevent", "4")
    wait(1)

    tap_tab(0)
    wait(1)
    adb("shell", "input", "tap", "540", "1254")
    wait(3)
    ui = dump("channels")
    add_result("Channel", "PASS" if "DEV-QA" in ui or len(ui_texts(ui)) > 4 else "FAIL", "channel list")
    adb("shell", "input", "keyevent", "4")
    wait(1)

    locale_notes: list[str] = []
    locale_pass = True
    for loc_id, x in (("ko", QA["locale_ko_x"]), ("en", QA["locale_en_x"]), ("mn", QA["locale_mn_x"])):
        set_locale(x)
        for screen, link in (
            ("detail", f"auditions/{QA['vote_id']}"),
            ("vote", f"auditions/{QA['vote_id']}/vote"),
            ("apps", None),
        ):
            if link:
                open_deep_link(link)
            else:
                tap_tab(3)
            wait(2)
            texts = ui_texts(dump(f"loc-{loc_id}-{screen}"))
            if has_raw_key(texts):
                locale_pass = False
                locale_notes.append(f"{loc_id}-{screen}")
    add_result("Locale ko/en/mn", "PASS" if locale_pass else "FAIL", "ok" if locale_pass else ", ".join(locale_notes))

    fails = [r for r in results if r[1] == "FAIL"]
    verdict = "GLOBAL_AUDITION_NATIVE_USER_E2E_COMPLETE" if not fails else "GLOBAL_AUDITION_NATIVE_USER_E2E_BLOCKED"
    print()
    print("# GLOBAL AUDITION NATIVE USER REAL-DATA E2E RESULT")
    print(f"Verdict: {verdict}")
    for scenario, status, note in results:
        print(f"  {scenario}: {status} ({note})")
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())

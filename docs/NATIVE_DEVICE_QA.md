# Native Device QA — Metro Reset Checklist

Use this checklist when local UI changes do not appear on a physical Android device.

## 1. Confirm branch and working tree

```bash
git branch --show-current
git status --short
```

Expected: you are on the UX feature branch with committed changes, or a clean tree after `git stash` if separating work.

## 2. Stop old Metro

Kill any process bound to port `8081` before starting a new dev server.

## 3. Start Metro with a clean cache

```bash
cd frontend/mobile
npx expo start --port 8081 --clear
```

Set develop API env vars if needed:

```powershell
$env:EXPO_PUBLIC_WEB_URL='https://frontend-develop-3d3e.up.railway.app'
$env:EXPO_PUBLIC_API_URL='https://frontend-develop-3d3e.up.railway.app/api'
```

## 4. Reverse ADB port

```bash
adb reverse tcp:8081 tcp:8081
```

## 5. Reload the app

```bash
adb shell am force-stop com.globalaudition.app
adb shell am start -n com.globalaudition.app/.MainActivity
```

Dismiss any dev error overlay (e.g. LogBox) before judging UI.

## 6. Verify the latest bundle

Smoke checks on device:

- Home banner and tab IA (Channel tab, no Applications tab)
- Profile flat sections (`프로필 완성도`, `내 지원`, `영상 / 채널`, `계정`)
- Header language switcher (`KO` / `EN` / `MN` pill)
- Bottom tab bar not overlapping system navigation

Optional: `adb shell uiautomator dump /sdcard/ui.xml` and inspect texts.

## Common root cause

If code is correct in the working tree but the device shows the old UI:

- Metro was not restarted after branch/checkout
- Stale bundle on port 8081
- Changes were never committed on the expected branch
- Dev client fell back to an embedded bundle (no active Metro session)

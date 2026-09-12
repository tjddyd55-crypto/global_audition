import re
import sys
from pathlib import Path

out = Path(sys.argv[-1]) if len(sys.argv) > 2 and sys.argv[-1].endswith(".txt") else Path(__file__).resolve().parents[2] / "parsed-qa-rd.txt"
files = sys.argv[1:-1] if str(out).endswith(".txt") and len(sys.argv) > 2 else sys.argv[1:]
lines: list[str] = []
for arg in files:
    s = Path(arg).read_text(encoding="utf-8", errors="replace")
    texts = sorted(set(re.findall(r'text="([^"]{1,160})"', s)))
    lines.append(f"{arg} {len(texts)}")
    for t in texts:
        if t.strip():
            lines.append(f"  {t}")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"wrote {out}")

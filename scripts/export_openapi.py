from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app  # noqa: E402


def _generate_schema() -> str:
    return json.dumps(app.openapi(), indent=2) + "\n"


def main() -> None:
    output_path = REPO_ROOT / "openapi.json"

    if "--check-only" in sys.argv:
        current = output_path.read_text(encoding="utf-8") if output_path.exists() else ""
        generated = _generate_schema()
        if current != generated:
            print(
                "ERROR: openapi.json is out of date.  "
                "Run 'make generate' and commit the updated file.",
                file=sys.stderr,
            )
            sys.exit(1)
        print("openapi.json is up to date.")
        return

    output_path.write_text(_generate_schema(), encoding="utf-8")
    print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()

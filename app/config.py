import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "rankion.db"

# Security & Application Defaults
DEFAULT_PASSCODE = "2486"
SESSION_COOKIE_NAME = "rankion_session"
DEFAULT_DAILY_REVISION_LIMIT = 50
DEFAULT_DAILY_NEW_CARDS = 20

# Load local .env if present
env_path = BASE_DIR / ".env"
if env_path.exists():
    try:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass


# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

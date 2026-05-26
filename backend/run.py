"""
Homepage Backend — Entry Point
Runs on port 5001 (independent from HMS backend on port 5000)
"""

import os
import sys

# Fix Windows cp1252 encoding issue — emoji in print() crashes without this
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Load .env before importing app
from dotenv import load_dotenv
_BASE = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_BASE, ".env"))

# Add backend dir to path so hp_src is importable
if _BASE not in sys.path:
    sys.path.insert(0, _BASE)

from app import app

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    print("\n" + "=" * 60)
    print("  HMS HOMEPAGE BACKEND")
    print("=" * 60)
    print(f"  Server  : http://localhost:{port}")
    print(f"  API     : http://localhost:{port}/api")
    print(f"  Health  : http://localhost:{port}/api/health")
    print(f"  Debug   : {debug}")
    db_url = os.getenv("DATABASE_URL", "NOT SET")
    db_display = db_url[:40] + "..." if len(db_url) > 40 else db_url
    print(f"  DB      : {db_display}")
    print("=" * 60 + "\n")

    # Verify DB Connection
    try:
        from hp_src.config.database import db
        db.execute_query("SELECT 1")
        print("✓ db connection successfull")
    except Exception as e:
        print(f"✗ db connection failed: {e}")
        
    print("✓ backend is runned succesfully")
    print("=" * 60 + "\n")

    app.run(host="0.0.0.0", port=port, debug=debug, threaded=True)
# trigger reload

"""
Cross-Platform KrishiConnect Backend Runner
Automatically configures sys.path and starts uvicorn on port 8000.
Runs identically on Windows (python run.py) and Linux/macOS (python3 run.py).
"""
import sys
from pathlib import Path
import uvicorn

# Ensure backend root is always in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

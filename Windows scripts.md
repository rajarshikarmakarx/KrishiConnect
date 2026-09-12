---

📦 1. What to Put on Your Pendrive Tonight

Create a folder on your pendrive called KrishiConnect-Setup containing:
1. backend_env.txt (Copy of your backend/.env)
2. frontend_env.txt (Copy of your frontend/.env)
3. (Optional Safety Net) A .zip copy of your repository in case the college demo room has slow or restricted internet for git clone.

---

🚀 2. Step-by-Step on Your Teammate's Windows Laptop

1. Clone the Repo (or extract zip):
git clone <YOUR_GITHUB_REPO_URL>
cd KrishiConnect
2. Copy .env Files from Pendrive:
   - Place backend_env.txt into backend/.env
   - Place frontend_env.txt into frontend/.env
3. Run the 1-Click Startup:
   - Option A (Easiest): Simply double-click start.bat in Windows File Explorer.
   - Option B (Command Prompt): Open CMD in the proj.
   - Option C (PowerShell): Open PowerShell and type .\start.ps1.
   - Option D (Git Bash): Open Git Bash and type ./s

What start.bat automatically handles in 60 seconds:

- Detects Windows Python (python.exe, py -3, or pyth
- Creates the Windows virtual environment backend\venv\.
- Installs all backend packages from backend\require
- Initializes the tables and pre-seeds demo mandis, historical queue data, and farmer accounts.
- Installs frontend node_modules via pnpm install.
- Launches the FastAPI backend on http://localhost:8000.
- Launches the Vite React frontend on http://localho
- Automatically opens your default browser directly to the Farmer Portal.

---

⚠️ 3. Three Critical "Demo Day" Traps & How to Avoid Them

Trap #1: College Wi-Fi Blocking Remote Database Ports (Port 5432)

- The Problem: Many college and campus Wi-Fi networks block external database connections (Supabase PostgreSQL port 5432/6543) via
  campus firewalls.
- The Fix (Choose either):
  - Fix A (Recommended): Connect the demo laptop to or 100% unrestricted internet.
  - Fix B (100% Offline SQLite): If there is no internet in the demo room, open backend/.env and comment out the DATABASE_URL= line.
    The backend will instantly fallback to local SQLed all data locally!

Trap #2: Teammate's Python is not in Windows PATH

- If running python in CMD opens the Windows Microsoto:
  a. Open Windows Start → Search "Environment Variables".
  b. Or re-run the Python Installer, click "Modify",H".

Trap #3: Teammate's Node.js Version

- Ensure your teammate has Node.js 18+ or 20+ instal

---

📋 4. Demo Cheat-Sheet (Keep This Open During Demo)

┌────────────────────────────────┬───────────────────────────────────────────────────────────────┐
│             Portal             │             URL             │                       Demo Credentials                       │
├────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 🌾 Farmer Portal               │ http://localhost:5173/      │ Any 10-digit mobile (e.g. 9876543210) with master OTP 123456 │
├────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 🏢 Mandi Officer (Operator)    │ http://localhost:5173/admin │ Mobile: 9000000001 | Password: operator123                   │
├────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 🏛️ District Agricultural Admin │ http://localhost:5173/admin │ Mobile: 9000000000 | Password: admin123                      │
├────────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ 🔌 Interactive API Docs        │ http://localhost:8000/docs  │ Live Swagger UI                                              │
└────────────────────────────────┴───────────────────────────────────────────────────────────────┘

✻ Cogitated for 1m 44s · done 10:04 pm
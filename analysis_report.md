# SecretSanta-2025 Project Analysis Report

## 1. Project Overview
- **Name**: SecretSanta-2025
- **Purpose**: A full‑stack secret‑santa gift exchange platform with real‑time chat, mini‑games, admin console, and point‑based task system.
- **Primary Users**:
  - **Participants** – Register/login via Delta Auth (SSO) or email, complete daily tasks, play games, view leaderboard.
  - **Admins** – "Hacker" console for user management, pairing generation, task builder, logs, and system settings.

## 2. Technology Stack
| Layer | Technology | Notes |
|------|------------|-------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Lucide‑React | Uses Vite dev server with HTTPS, custom CSS animations (snowfall). |
| **Backend API** | Node.js (ESM), Express 5, dotenv, cors, jsonwebtoken | Exposes `/api/*` routes, proxies Delta Auth, and forwards to Supabase via service‑role client. |
| **Database** | Supabase (PostgreSQL) | All data stored in Supabase tables; migrations live in `database/` folder. |
| **Auth** | Delta Auth (SSO) + Supabase JWT | Token verification middleware supports both. |
| **Deployment** | Google Cloud Run (Docker), optional Caddy reverse proxy | Dockerfile builds Vite bundle, `server.mjs` serves static files. |
| **CI/CD** | Cloud Build (`cloudbuild.yaml`) | Builds Docker image and pushes to GCR. |
| **Styling** | TailwindCSS, custom CSS animations (falling snow) | `tailwind.config.js` defines `fall` animation. |
| **Testing / Scripts** | Node scripts in `scripts/` (e.g., `fix_words_and_bonus.js`, `execute_bonus_v2.js`) | Used for DB fixes, bonus task execution. |

## 3. Directory Structure (top‑level)
```
.
├─ .dockerignore, .env, .gitignore, .firebaserc, .gcloudignore
├─ ADD_SANTA_RUN_SETTING.sql, ENABLE_INFINITE_GAME.sql, ... (SQL migrations)
├─ Dockerfile, docker-compose.yml, docker-compose.prod.yml
├─ README.md, index.html, nginx.conf
├─ package.json, pnpm-lock.yaml, vite.config.ts, tailwind.config.js
├─ scripts/            # utility scripts
├─ src/                # React source
│   ├─ App.tsx
│   ├─ index.css
│   ├─ components/    # 26 UI components (Leaderboard, TicTacToe, etc.)
│   ├─ contexts/      # React context providers (Auth, Settings)
│   ├─ hooks/         # custom hooks
│   └─ lib/           # shared utilities
├─ server.mjs          # Express backend proxy
├─ supabase/          # Supabase migration folder
└─ public/            # static assets (icons, music, OG image)
```

## 4. Core Frontend Components (selected)
- **UserDashboard.tsx** – Main user view, shows points, tasks, games, chat, leaderboard.
- **AdminDashboard.tsx** – Admin console with user management, pairings, logs, task builder.
- **TicTacToe.tsx**, **MemoryGame.tsx**, **KollywoodGame.tsx**, **SantaRunGame.tsx** – Mini‑games with scoring logic.
- **SantaChat.tsx** – Real‑time chat powered by Supabase Realtime.
- **Leaderboard.tsx** – Displays top users based on points.
- **BonusTaskModal.tsx**, **TodaysBonusTask.tsx** – UI for daily/bonus tasks.
- **SnowBackground.tsx**, **ChristmasBackground.tsx** – Visual effects using Tailwind animation `fall`.

## 5. Backend API (`server.mjs`)
- **Auth Proxy** – `/api/dauth/*` routes forward to Delta Auth endpoints.
- **Token Verification Middleware** – Supports DAuth RSA public key or Supabase JWT verification.
- **Protected Routes** – `/api/user_tasks`, `/api/profiles`, `/api/app_settings`, `/api/news_feed`, `/api/tasks`.
- **Admin Routes** – Require `checkAdmin` middleware; expose user list, logs, pairings, pairing generation.
- **Game Routes** – Daily check‑in, memory game score, TicTacToe CRUD (create, get active, move).
- **Static File Serving** – Serves Vite `dist` folder for production.

## 6. Database & Migrations
- **SQL folder** contains ~70 migration scripts (e.g., `COMPLETE_DB_SETUP.sql`, `FIX_PAIRING_VISIBILITY.sql`).
- Key tables (referenced in API): `profiles`, `user_tasks`, `app_settings`, `news_feed`, `tasks`, `pairings`, `tictactoe_games`, `memory_game_scores`, `daily_checkins`.
- RLS policies are enabled (`ENABLE_RLS_POLICIES.sql`) to enforce row‑level security.
- Bonus/score fixes are applied via `fix_words_and_bonus.js` which runs `FIX_KOLLYWOOD_AND_BONUS.sql` and `RESEED_ALL_WORDS.sql`.

## 7. Scripts
- **fix_words_and_bonus.js** – Connects to Supabase DB, runs bonus‑task and reseed SQL files.
- **execute_bonus_v2.js** – Executes bonus task logic (not inspected in detail).
- **apply_migration.js** – Generic migration runner used by other scripts.
- **run_local.sh** – Helper to start dev server locally.

## 8. Known TODO / FIXME Items
- No `TODO` or `FIXME` markers were found via a case‑insensitive grep across the repository.
- Potential areas for improvement:
  - Centralize API endpoint URLs in a config file rather than hard‑coding in `vite.config.ts` and `server.mjs`.
  - Add unit tests for backend routes (currently none).
  - Document environment variables required for production (`.env.example` should be reviewed).

## 9. Recommendations & Next Steps
1. **Testing** – Add Jest/React Testing Library tests for critical components (Leaderboard, Game logic) and Supertest for Express routes.
2. **Security Review** – Ensure `DAUTH_PUBLIC_KEY` and `SUPABASE_JWT_SECRET` are never exposed to the client; consider moving token verification to a dedicated auth service.
3. **CI Pipeline** – Extend `cloudbuild.yaml` to run linting and tests before Docker image build.
4. **Documentation** – Create a `docs/` folder with architecture diagram (Mermaid) and deployment guide.
5. **Performance** – Enable Vite's `esbuild` minification for production and consider code‑splitting for heavy game components.
6. **Accessibility** – Audit UI components for WCAG compliance (ARIA labels, focus order).

---
*Generated on 2025‑12‑12 by Antigravity AI.*

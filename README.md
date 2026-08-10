# Lodestar

A private, fast search engine frontend with its own Node.js search API.
Lodestar searches anonymously through SearXNG and multiple fallback
providers, keeps your history and bookmarks on your device, and is fully
translated into English, Arabic, Spanish, Irish and Hebrew.

## Features

- Private search: web, images, news, videos and maps — no tracking, no ads
- Per-language interface (en / ar / es / ga / he) with RTL support
- Optional account sync (history, bookmarks, settings) via Supabase
- Search history, saved results, bangs, time filters and safe search
- Instant answers, official-site badges, country cards and voice search
- Installable PWA with offline caching
- Light / dark / system themes

## Project layout

```
frontend/        Static app (HTML, CSS, JS). Runs on any static host.
backend/         Node.js search + account API (no dependencies).
  lib/           Providers, ranking, auth, rate limiting, icon cache.
  data/          supabase-schema.sql  <- run this in Supabase
searxng/         Optional SearXNG instance (docker-compose).
assets/          Logos, icons, fonts.
start.bat        Starts backend + frontend locally on Windows.
```

## Running locally

You need Node.js 18+. A local SearXNG instance is optional — the backend
falls back to other providers when SearXNG is unreachable.

```bat
start.bat
```

Or manually:

```bash
# Backend API on http://localhost:3001
cd backend
node server.js

# Frontend on http://localhost:3000
cd frontend
node serve.js
```

Open http://localhost:3000.

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust:

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend port (default `3001`) |
| `SEARXNG_URL` | SearXNG instance (default `http://localhost:8080`) |
| `CORS_ORIGIN` | Allowed frontend origin (default `http://localhost:3000`) |
| `SUPABASE_URL` | Supabase project URL (accounts + sync) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (kept secret) |
| `YOUTUBE_API_KEY` | Optional: enables the Videos tab |
| `OPENVERSE_TOKEN` | Optional: Openverse images |

## Supabase setup

Accounts, synced data and password-reset codes are stored in Supabase.

1. Create a project in Supabase.
2. Open the SQL editor and run `backend/data/supabase-schema.sql`.
3. Copy `SUPABASE_URL` and the service role key
   (Project Settings → API) into `backend/.env`.

The backend uses the service role key directly, so no Row Level Security
policies are required. Passwords are hashed with scrypt; only the hash and
salt are stored. Because the reset code is shown in the interface (no email
is sent), the `users.email` field is optional in existing rows but required
at registration.

## Deployment

**Frontend** — it is fully static. Host it on GitHub Pages, Netlify or any
static server. On `*.github.io` the frontend automatically talks to the
hosted API URL; set `window.LODESTAR_API` before the app scripts to point
it elsewhere.

**Backend** — deploy the `backend/` folder on Render (or any Node host) with
`npm start`-style `node server.js`, and set the same env vars above in the
service. The icon cache lives on the ephemeral disk and is cleared on each
deploy automatically.

## Localized logos

The wordmark is swapped by language: Arabic uses `assets/logo-arabic.svg`,
Hebrew uses `assets/logo-hebrew.svg`, every other language uses the regular
purple/white logos. Replace those two files to change the look.

## License

Private project.

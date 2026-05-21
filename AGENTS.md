# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is **同辈课栈 (Peer Course Hub)** — a Vue 3 SPA (Vite + Tailwind CSS) that connects to a hosted Supabase backend. There is no local backend or database to run.

### Dev commands

All standard commands are in `package.json`:

- `npm run dev` — start Vite dev server (default port 5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

### Supabase configuration

The app requires two env vars in `.env.local` to connect to Supabase:

- `VITE_SUPABASE_URL` — Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase anonymous/public API key

Without these, the app still starts and renders the UI, but auth and data operations will not work (a console warning is emitted).

### Notes

- No test framework is configured — there are no automated tests to run.
- No linter (ESLint) or formatter (Prettier) is configured — there are no lint commands.
- The project has no lockfile; `npm install` generates `package-lock.json` locally.
- Node.js >= 18 is required (see `engines` in `package.json`).

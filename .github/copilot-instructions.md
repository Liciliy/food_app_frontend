# Food App Frontend Copilot Instructions

This repository is a Vite + React 19 + TypeScript frontend deployed on Cloudflare Pages.

## High-signal repo facts

- Production frontend domain is `https://meal-hunter.uk`.
- Planned backend API hostname is `https://backend.meal-hunter.uk`.
- Cloudflare Pages is the active deployment target. Do not assume Vercel or Netlify conventions.
- Client-side routing uses `BrowserRouter`, so SPA fallback must keep working through `public/_redirects`.
- API base URL is driven by `VITE_API_BASE_URL` in Cloudflare Pages or `.env.production` for local production builds.
- Tailwind config must remain in `tailwind.config.cjs` because the package is ESM (`"type": "module"`).

## Change strategy

- Prefer the smallest local change that fits the current structure.
- Keep app state in Zustand stores, API logic in `src/services`, page routing in `src/App.tsx`, and shared types in `src/types`.
- Reuse existing auth token helpers from `src/services/api.ts` instead of introducing new storage keys or auth persistence patterns.
- When changing routes or deployment behavior, update documentation in `README.md` if the operational setup changes.

## Validation defaults

- Use the narrowest relevant validation first.
- For code changes, prefer `npm run build` or `npx tsc --noEmit`.
- There is no established automated test suite yet, so do not assume unit or E2E coverage exists.

## Token-efficiency guidance

- Avoid broad repo exploration when the request is about one page, store, service, or deployment file.
- Read the nearest owning file first, then only one adjacent dependency when needed.
- Prefer updating existing patterns over introducing new abstractions.
---
applyTo: "src/**/*.{ts,tsx}"
description: "Use when editing React or TypeScript source in the Food Tracker frontend. Captures repo structure, frontend conventions, and low-cost validation defaults."
---

# Frontend Source Instructions

- Use React function components and existing semicolon-heavy TypeScript style.
- Keep page composition in `src/pages`, reusable UI in `src/components`, and hooks in `src/hooks`.
- Put network calls and transport formatting in `src/services` rather than inside components or stores.
- Put cross-page client state in Zustand stores under `src/stores`; keep stores thin and service-backed.
- For auth changes, reuse `getStoredToken`, `storeToken`, and `removeToken` from `src/services/api.ts`.
- Preserve the existing environment-driven API entry point via `VITE_API_BASE_URL`.
- When adding user-facing copy to existing flows, check whether the feature already uses i18n and add locale keys instead of hardcoding new strings into shared UI.
- Be careful with route changes: this app is hosted on Cloudflare Pages and depends on SPA fallback behavior.
- After meaningful source edits, prefer `npm run build` as the default validation unless a cheaper slice-specific check exists.
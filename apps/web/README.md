# @repo/web

React 19 + Vite frontend for Waymate. Routes are code-based (TanStack Router); data fetching goes through `@elysiajs/eden` wrapped in TanStack Query.

## Layout

```
src/
  App.tsx               — RouterProvider only
  main.tsx              — QueryClientProvider + StrictMode root
  router.tsx            — code-based route tree (TanStack Router)
  pages/                — page components (one per URL)
  components/           — shared components
  hooks/                — shared hooks
  lib/
    eden.ts             — Eden treaty client (typed via @repo/api)
    eden-query.ts       — `unwrap()` helper bridging Eden → TanStack Query
    query-client.ts     — singleton QueryClient
    layout-context.tsx  — LayoutProvider + useLayout() (language/theme state)
    router-compat.ts    — react-router-dom v7 shim on top of TanStack Router
    api.ts              — legacy fetch helper, only used by auth pages
  i18n/                 — react-i18next setup and locale files
```

## Data fetching

Use the Eden client + TanStack Query:

```ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/eden";
import { unwrap } from "@/lib/eden-query";

const { data, isLoading, error } = useQuery({
    queryKey: ["cars", "brands"],
    queryFn: () => unwrap(api.cars.brands.get()),
});
```

`api` is a typed treaty client — autocomplete reflects routes registered on the Elysia app in `apps/api/src/index.ts`. Refactoring a backend route handler immediately produces a TypeScript error here.

Cookie auth (better-auth sessions) is configured via `credentials: "include"` in `lib/eden.ts` — no per-call setup needed.

## Routing

Routes are defined in `src/router.tsx`. To add a route:

1. Add the page component under `src/pages/`.
2. Add an entry to the `audienceRoutes` array (or define a custom route with bespoke prop wiring like `HomeRoute`).

Pages currently receive `language`/`theme`/handlers as props — the router injects them from `useLayout()`. Inside a page, use `useNavigate`/`useLocation` from `lib/router-compat` (transitional) or migrate to `@tanstack/react-router` directly.

## Adding a new audience-style page

```tsx
// 1. src/pages/MyPage.tsx
type MyPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
};
export function MyPage(props: MyPageProps) {
    /* ... */
}

// 2. src/router.tsx — add to audienceRoutes:
{ path: "/my-page", Component: MyPage },
```

## Shared layout state

`useLayout()` returns `{ language, theme, onLanguageChange, onThemeToggle }`. Use it in pages that don't already receive these as props.

## Environment

Copy `.env.example` to `.env.local` if you need to override defaults:

- `API_PROXY_TARGET` — where the local Vite `/api/*` proxy (dev and preview only) forwards requests. Default: `http://localhost:3000`. Set it if the API runs elsewhere, without a trailing slash.
- `VITE_API_PROXY_TARGET` — backward-compatible local alias for `API_PROXY_TARGET`.
- `VITE_API_BASE_URL` — base URL the generated API client uses. Default: `/api` (the local proxy). Production sets it to the API origin, see below.

## Cloudflare Pages deployment

Production is built and served by Cloudflare Pages. After the `main` pipeline passes, the `trigger-deployments` CI job starts the build through a deploy hook and waits until `/version.json` reports the new commit (`CF_PAGES_COMMIT_SHA`). `public/_headers` keeps `version.json` uncached.

Cloudflare Pages has no `/api` proxy, so the browser calls the API directly. Set these build variables in Cloudflare Pages:

- `VITE_API_BASE_URL` — the API origin, e.g. `https://api.wezmesa.world`
- `VITE_AUTH_BASE_URL` — the API origin followed by `/api/auth`
- `VITE_MAPBOX_ACCESS_TOKEN`

Vite bakes them into the bundle at build time, so changing them needs a new deploy.

On the API, set `WEB_ORIGIN` to the frontend origin (`https://wezmesa.world`) so CORS and Better Auth accept its requests, and add any other frontend origins to `CORS_ORIGINS`. `BETTER_AUTH_URL` is the public URL the auth routes are served from. For Google OAuth, register this redirect URI in Google Cloud:

```txt
<BETTER_AUTH_URL>/api/auth/callback/google
```

## UI library

Components live in `src/components/ui/`, `src/components/shared/`, `src/components/navigation/`, and feature-specific `src/features/*/components/`.

## i18n parity check

Locale files live in `src/i18n/locales/{en,cs,sk}.json`. To catch unused keys and en/cs/sk drift:

```bash
bun run --cwd apps/web i18n:check
```

The script flattens each locale, fails if any key in `en.json` is unreferenced in `src/`, and fails if cs/sk diverge from en. It runs as a CI job (`i18n-check` in `.gitlab-ci.yml`).

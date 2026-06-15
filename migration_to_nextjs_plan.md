# Migration Plan: React (Vite) to Next.js 14+ (App Router)

## Current Architecture Assessment
- **Frontend Framework:** React 18+ (currently built with Vite, SPA).
- **Backend Framework:** Express.js (`server.ts` custom server acting as API and serving static files).
- **Authentication:** Dual-system auth with Supabase Auth (Primary) and Firebase Auth (Secondary/Legacy functionality).
- **Database Architecture:** Supabase (PostgreSQL) loaded via real-time WebSocket subscriptions and manual REST polling (`/api/state`).
- **Search Engine:** Likely basic client-side or partial backend filtering (reference to Elasticsearch module in `src/components/ElasticsearchModule.tsx`).
- **Build System:** Vite (Frontend bundle) + ESBuild (Backend compilation to `dist/server.cjs`). package.json specifies `build: "vite build && esbuild server.ts ..."`.
- **Deployment Architecture:** Node.js standalone executable within container instances, routing via `node dist/server.cjs`.

---

## 1. File Modification & Structural Migration Plan

The core of moving to Next.js App Router (`/app` directory) involves dismantling the Vite build and custom Express server, shifting API routes to Next.js Route Handlers.

### Key Directory Shifts
- **`/src/App.tsx & main.tsx`** → Translated to `/app/layout.tsx` (Global providers, Supabase sessions, global CSS injections) and `/app/page.tsx` (Dashboard landing / Auth router).
- **`/src/components/*`** → Move to `/components/*`. Components with state (like `useSupabaseData`) require the `"use client"` directive at the top.
- **`/server.ts`** → Obsolete. Express routes (e.g., `/api/state`, `/api/health`) will migrate to `/app/api/[route]/route.ts`.
- **`/src/hooks/*`** → Retained, but must execute inside Client Boundaries when interacting with `window` or `localStorage`.
- **`index.html`** → Obsolete. Meta tags and SEO moved to `metadata` export in `layout.tsx`.

---

## 2. Routing Migration Strategy

Current SPA relies on basic logical routing or React Router. Next.js App Router utilizes filesystem-based routing.

1. **Dashboard & Modules:**
   Create discrete pages instead of a monolithic App.tsx view:
   - `/app/dashboard/page.tsx`
   - `/app/cases/page.tsx`
   - `/app/clients/page.tsx`
   - `/app/settings/page.tsx`
2. **Dynamic Routes:**
   - `/app/cases/[id]/page.tsx` to handle specific Case Detail Views (Server-Side Rendering capable).
3. **Layout Nesting:**
   The `Sidebar` and `NotificationsBell` should sit inside `/app/dashboard/layout.tsx` so they don't re-render during intra-dashboard navigation.

---

## 3. Authentication Migration Strategy (Supabase + Firebase)

Currently auth is trapped inside a React Context in a pure SPA. In Next.js, authentication must be verified at the server edge to protect routes securely.

- **Supabase SSR (Next.js Auth Helpers):** 
  Migrate from `@supabase/supabase-js` standard client to `@supabase/ssr`. 
  - *Cookies over LocalStorage:* Sessions will be stored in cookies to allow Server Components to verify Auth before rendering.
  - Implement Middleware: Create `/src/middleware.ts` to intercept protected routes (`/dashboard/*`) and redirect to `/login` if no valid Supabase cookie exists.
- **Firebase Auth:** 
  If Firebase is purely client-side, it will remain inside Client Components (`"use client"`). If server verification is needed, integrate `firebase-admin` inside Next.js Route Handlers.

---

## 4. API Migration Strategy

The standalone Express backend (`server.ts`) will be broken apart:

- **State Polling & Management:**
  The current `/api/state` and `/api/state/update` endpoints will migrate to:
  - `/app/api/state/route.ts` (GET)
  - `/app/api/state/update/route.ts` (POST)
- **Supabase WebSocket Subs:**
  Remain on the client-side (`"use client"`) using the `supabase` browser client, ensuring `useEffect` hooks retain the `channel().subscribe()` logic.
- **Deduplication:** Let Next.js `fetch` manage HTTP caching where possible rather than custom interval polling. The current `setInterval` for 3.5 seconds can be replaced with SWR or React Query, or retained in Client hooks.

---

## 5. Build Configuration Changes

Modifications required to `package.json`:
- **Remove:** `vite`, `esbuild`, `@vitejs/plugin-react`
- **Add:** `next` (v14+), `@supabase/ssr` (replacing auth aspects)
- **Scripts:**
  - `"dev": "next dev"` (Replacing Vite + TSX)
  - `"build": "next build"` (Replacing Vite build + ESBuild)
  - `"start": "next start"` (Replacing `node dist/server.cjs`)
- **Next.js Config (`next.config.js`):**
  Necessary to configure strict mode, output modes (e.g. `output: "standalone"` for Docker caching efficiency), and allowed image domains.
- **Tailwind:** Update `tailwind.config.js` or `index.css` to scan the `/app` and `/components` directories.

---

## 6. Technical Risks & Mitigation

1. **"use client" Waterfall & Context Hell:**
   *Risk:* The current `App.tsx` has massive global states (Hearings, Documents) living in one huge file. If moved identically, the entire App requires `"use client"`, negating Next.js SSR benefits.
   *Mitigation:* Aggressively push state down. Use Zustand or React Context Providers specifically wrapped at the layout levels that need them.
2. **WebSocket & Hydration Mismatches:**
   *Risk:* Supabase real-time client renders differently on the server (no Websockets) vs. client.
   *Mitigation:* Render initial state via Server Components (`await supabase.from('cases').select()`), pass to Client Components, which then mount the WebSocket listener.
3. **Environment Variables:**
   *Risk:* Current setup mixes `process.env` and `import.meta.env`. Next.js requires `NEXT_PUBLIC_` for client-side variables.
   *Mitigation:* Standardize all variables to `process.env.NEXT_PUBLIC_` for client, `process.env.*` for server routes.

---

## 7. Estimated Effort Breakdown

**Total Estimate: ~9 to 14 Days**

- **Phase 1: Setup & Initialization (1 Day)**
  - Initialize Next.js, configure Tailwind, setup absolute imports (`@/*`), establish `next.config.js`.
- **Phase 2: Auth & Middleware Migration (2-3 Days)**
  - Move to `@supabase/ssr`, setup cookie-based sessions, write `middleware.ts` for route protection.
- **Phase 3: Component & Layout Segregation (3-4 Days)**
  - Break `App.tsx` down into `/app/dashboard/layout.tsx` and individual pages. Add `"use client"` definitions.
- **Phase 4: API & Backend Unification (2-3 Days)**
  - Convert `server.ts` Express routes to `app/api/.../route.ts`. Retool any Drizzle/Supabase admin interactions to use Next API contexts.
- **Phase 5: State & Polling Refactor (1-2 Days)**
  - Test real-time synchronization (`useSupabaseData`), convert environment strings to `NEXT_PUBLIC_`.
- **Phase 6: QA, Error Handling & Build (1 Day)**
  - Test containerization with `output: 'standalone'`, ensure `initGlobalErrorHandling` runs predictably.

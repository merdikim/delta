# Delta

Your goals are attainable thanks to Defi yield.

## Vercel deployment

This app uses `@tanstack/react-start` with SSR and server functions, so it should be deployed to Vercel using TanStack Start's Nitro-based setup rather than the older SPA-style `index.html` rewrite approach.

### Included setup

- `vite.config.ts` includes `tanstackStart()` and `nitro()`
- `package.json` includes:
  - `build`: `vite build`
  - `start`: `node .output/server/index.mjs`
  - `engines.node`: `>=20.19 <23`

### Vercel settings

- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: `npm run build`

### Required environment variables

- `DATABASE_URL`
- `LIFI_EARN_API_KEY`

### Why this differs from the TanStack Router SPA guide

The TanStack Router Vercel rewrite example that sends every route to `index.html` is for client-only SPA deployments. This project uses TanStack Start SSR plus server functions and Prisma, so it needs the Nitro-based server deployment path instead.

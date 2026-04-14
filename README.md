# Delta

Delta is a goal-based DeFi savings app that helps people turn vague financial ambitions into a concrete, funded plan. Instead of letting money sit idle, Delta pairs personal savings goals with yield-bearing vaults so users can deposit, track progress, and see how compounding can help close the gap faster.

Built with TanStack Start, React, RainbowKit, Wagmi, Prisma, and LI.FI Earn, the app combines a polished wallet-based experience with server-rendered routes, database-backed goal tracking, and cross-chain vault interactions.

## What Delta Does

- Connects a wallet to unlock a private goal dashboard
- Lets users create savings goals with a target amount and initial funded deposit
- Surfaces supported LI.FI Earn vaults across selected networks and assets
- Tracks active goal balances, deposits, and withdrawals over time
- Supports vault funding and withdrawal flows, including cross-chain routing where available
- Stores each goal and its transaction history in Postgres through Prisma

## Product Flow

1. Connect a wallet.
2. Create a goal with a name, current deposit amount, and target amount.
3. Choose a supported vault returned by LI.FI Earn.
4. Deposit funds into that vault.
5. Monitor progress from the dashboard and withdraw when needed.

## Tech Stack

- `TanStack Start` for SSR, routing, and server functions
- `React 19` for the frontend
- `TanStack Query` for data fetching and cache management
- `RainbowKit` and `Wagmi` for wallet connection and onchain interactions
- `Prisma` with PostgreSQL for persistence
- `LI.FI Earn` and composer APIs for vault discovery and routing
- `Tailwind CSS v4` for styling
- `Vite` and `Nitro` for build and server output
- `ENS` names

## Local Development

### Prerequisites

- Node.js `>=20.19 <23`
- npm
- A PostgreSQL database
- A LI.FI Earn API key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL=postgresql://...
LIFI_EARN_API_KEY=your_lifi_key
```

### Wallet Configuration

Update the RainbowKit project ID in [src/integrations/wallet/wallet-provider.tsx](/Users/merdikim/delta/src/integrations/wallet/wallet-provider.tsx) before shipping:

```ts
projectId: 'YOUR_PROJECT_ID'
```

### Database Setup

```bash
npm run db:generate
npm run db:push
```

Optional seed command:

```bash
npm run db:seed
```

### Start The App

```bash
npm run dev
```

The local app runs on `http://localhost:3000`.

## Useful Scripts

- `npm run dev` starts the local development server
- `npm run build` creates the production build
- `npm run start` runs the Nitro server output
- `npm run test` runs the test suite
- `npm run lint` runs ESLint
- `npm run format` checks formatting
- `npm run check` formats and fixes lint issues
- `npm run db:generate` generates the Prisma client
- `npm run db:push` syncs the schema to the database
- `npm run db:migrate` creates and runs Prisma migrations
- `npm run db:studio` opens Prisma Studio
- `npm run db:seed` seeds the database

## Deployment

This project is not a static SPA. It uses `@tanstack/react-start` with SSR and server functions, so it should be deployed using TanStack Start's Nitro server output.

### Vercel Settings

- Framework Preset: `Other`
- Install Command: `npm install`
- Build Command: `npm run build`
- Start Command: `npm run start`

### Required Production Environment Variables

- `DATABASE_URL`
- `LIFI_EARN_API_KEY`

### Why Nitro Deployment Matters

The common TanStack Router SPA rewrite setup that forwards everything to `index.html` does not apply here. Delta depends on SSR, server functions, and Prisma-backed data access, so it needs a server deployment target rather than a static rewrite-only configuration.

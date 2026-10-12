# ClimaLedger — Fullstack ESG & Carbon Credit Platform on Solana

ClimaLedger is an enterprise-grade carbon credit tokenization, greenhouse gas (GHG) tracking, and on-chain ESG reconciliation platform powered by **Next.js 14**, **NestJS**, and the **Solana Blockchain**.

---

## 🏗️ Architecture Overview

The platform consists of four primary components:

1. **Frontend (`frontend/`)**: Modern web application built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, consuming backend REST APIs and real-time WebSockets.
2. **Backend (`backend/`)**: Modular **NestJS** microservice running on port `3001` with real-time WebSocket gateways (`socket.io`), Solana Web3 integration, and an in-memory synchronized state store.
3. **Smart Contracts (`contracts/climaledger/`)**: Solana on-chain program developed using the **Anchor Framework (Rust)**, featuring SPL token minting, escrow-based marketplace trades, retirement burns, and attestations. Anchor IDL JSON is included for client wallet connectivity.
4. **Testnet Validator & Simulator (`backend/rust-testnet/`)**: Automated local Solana validator manager with an embedded RPC fallback simulator for environments without native Solana toolchains.

---

## 📁 Repository Structure

```text
climaledger-nodejs-scaffold/
├── package.json              # Root package script (build, dev, test scripts)
├── frontend/                 # Next.js 14 Frontend (App Router, TS, Tailwind)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts    # Brand styling, Plus Jakarta Sans & JetBrains Mono typography
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout + I18nProvider + Sidebar + Topbar
│   │   │   ├── page.tsx      # Redirect to /dashboard
│   │   │   ├── dashboard/    # ESG overview, 4 core KPIs, Weekly emission chart, batch table
│   │   │   ├── tracker/      # GHG Scope 1/2/3 data entry, monthly analytics, CSV export
│   │   │   ├── assess/       # Surplus credit calculator, ISO 14064, VCS/Gold Standard quotas
│   │   │   ├── tokenize/     # Lock -> Mint SPL token wizard with real-time WebSocket progress
│   │   │   ├── market/       # Carbon marketplace order book, USDC settlement, buy/sell modals
│   │   │   ├── portfolio/    # SPL token balances, retirement (burn), PDF certificates
│   │   │   ├── audit/        # On-chain explorer, 3-way reconciliation, transaction inspector
│   │   │   └── settings/     # 4-step KYB checklist, Phantom wallet connector, entity profiles
│   │   ├── components/       # Reusable UI components (Sidebar, Topbar, Toast, Modals)
│   │   ├── lib/              # api.ts (backend client), i18n.tsx (localization)
│   │   └── types/            # TypeScript data contracts & interfaces
├── backend/                  # NestJS Application (Standalone port 3001)
│   ├── package.json          # NestJS, @solana/web3.js, socket.io
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts           # Server entrypoint (Port 3001, CORS enabled, /api/v1 prefix)
│   │   ├── app.module.ts
│   │   ├── database/         # In-memory synchronized store & mock data
│   │   └── modules/          # Dashboard, Emissions, Registry, Tokenize, Market, Portfolio, Audit, Settings
│   ├── rust-testnet/         # solana-test-validator runner & simulated JSON-RPC fallback
│   └── docker-compose.testnet.yml
├── contracts/                # Solana Smart Contracts (Anchor Framework)
│   └── climaledger/
│       ├── Cargo.toml
│       ├── src/lib.rs        # Rust program: Tokenize, Escrow Market, Retire Burn, Attest
│       └── idl/climaledger.json # Anchor IDL for client wallets (e.g., Phantom)
├── html/                     # Reference static HTML mockup templates
└── prompts/                  # UI and component architectural specifications
```

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher

---

### 1. Unified Root Commands

From the project root (`climaledger-nodejs-scaffold/`):

```bash
# Build both Backend & Frontend
npm run build

# Start Backend server (port 3001)
npm run start:backend
# or in dev/watch mode:
npm run dev:backend

# Start Frontend development server (port 3000)
npm run dev:frontend
```

---

### 2. Running the Backend (NestJS)

To run the backend independently:

```bash
cd backend
npm install
npm run build
npm run start
# or development mode:
npm run start:dev
```

* **REST API Base URL**: `http://localhost:3001/api/v1`
* **WebSocket Gateway**: `ws://localhost:3001/ws/tokenize`
* **Testnet Status Endpoint**: `http://localhost:3001/testnet/status`

---

### 3. Running the Frontend (Next.js)

To run the frontend independently:

```bash
cd frontend
npm install
npm run build
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application automatically consumes endpoints from the backend at `http://localhost:3001/api/v1`.

---

## 🔄 End-to-End Data Synchronization

All actions executed on the frontend are synchronized across the backend in-memory state and the Solana blockchain:

1. **Carbon Tokenization (`/tokenize`)**:
   * Initiates `POST /api/v1/tokenize/lock` followed by `POST /api/v1/tokenize/mint`.
   * Real-time progress is streamed over WebSockets (`ws://localhost:3001/ws/tokenize`).
   * Deducts remaining batch quotas in `/assess` and updates total emissions on `/dashboard`.
   * Credits newly minted SPL tokens to the user balance in `/portfolio`.
   * Records verifiable transaction signatures and slot numbers in `/audit`.

2. **Marketplace & Trading (`/market`)**:
   * Listing tokens moves balances from the wallet into an on-chain escrow program.
   * Purchasing orders settles USDC balances, transfers ownership of carbon credits to the buyer, and creates an audit record.

3. **Retirement & Offsetting (`/portfolio`)**:
   * Permanently burns SPL tokens on-chain to offset corporate GHG emissions.
   * Generates a tamper-proof carbon offset PDF certificate.
   * Recalculates net emissions and increases the corporate offset percentage on `/dashboard`.

4. **3-Way Integrity Reconciliation (`/audit`)**:
   * Verifies mathematical integrity:
     $$\text{Total Minted} = \text{Active Balance} + \text{Escrow Listed} + \text{Burned/Retired}$$
   * Displays instant **MATCH** or discrepancy warnings on-chain.

---

## 🚀 Deployment Guide

### Deploying Frontend to Vercel

The frontend is optimized for zero-config deployment on Vercel:

1. Push your repository to GitHub.
2. Navigate to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. In **Root Directory**, select `frontend` (or `climaledger-nodejs-scaffold/frontend`).
4. Set Framework Preset to **Next.js**.
5. Configure the environment variable:
   * `NEXT_PUBLIC_API_URL`: Your backend API URL (e.g., `https://api.yourdomain.com/api/v1`).
6. Click **Deploy**.

Alternatively, deploy via the Vercel CLI from inside `frontend/`:
```bash
cd frontend
npx vercel login
npx vercel
```

### Deploying Backend (NestJS)

Because the backend utilizes long-running WebSockets (`socket.io`) and Solana RPC processes, it should be deployed on container-based platforms:

* **Recommended Platforms**: [Railway](https://railway.app), [Render](https://render.com), [Fly.io](https://fly.io), or a standard VPS via Docker (`docker-compose.testnet.yml`).
* Set environment variables:
  * `PORT=3001`
  * `SOLANA_RPC_URL`: Solana cluster RPC endpoint (e.g., `https://api.devnet.solana.com` or local testnet validator).

---

## 📄 License

This project is licensed under the MIT License — see the codebase for proprietary smart contract attestation details.

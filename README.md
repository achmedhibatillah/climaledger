# ClimaLedger — Fullstack Next.js, NestJS & Solana Blockchain Platform

Repositori ini telah dilengkapi dengan arsitektur penuh:
1. **Frontend (Next.js 14 App Router + TypeScript + Tailwind CSS)** di folder `frontend/` yang langsung mengonsumsi backend API.
2. **Backend (NestJS)** di folder `backend/` yang siap dijalankan mandiri di port 3001.
3. **Smart Contract Solana (Anchor / Rust)** di folder `contracts/climaledger/` lengkap dengan Anchor IDL JSON.
4. **HTML Mockup Templates** di folder `html/` sebagai acuan desain visual dan state interaction.

---

## 📁 Struktur Proyek

```text
climaledger-nodejs-scaffold/
├── package.json              # Root package script (start, dev:backend, dev:frontend)
├── frontend/                 # Aplikasi Frontend Next.js 14 (App Router, TS, Tailwind)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts    # Brand colors, typography Plus Jakarta Sans & JetBrains Mono
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout + I18nProvider + Sidebar + Topbar
│   │   │   ├── page.tsx      # Redirect ke /dashboard
│   │   │   ├── dashboard/    # Ringkasan ESG, 4 KPI, Weekly Bar Chart, Donut, Batch Table
│   │   │   ├── tracker/      # GHG Scope 1/2/3 data entry, monthly chart, CSV export
│   │   │   ├── assess/       # Kalkulator surplus kredit, ISO 14064, kuota VCS/GS
│   │   │   ├── tokenize/     # Wizard lock -> mint SPL Token, real-time progress
│   │   │   ├── market/       # Order book marketplace, penyelesaian USDC, modal beli & jual
│   │   │   ├── portfolio/    # Saldo token, retire (burn) token, sertifikat PDF
│   │   │   ├── audit/        # Explorer on-chain, rekonsiliasi 3-arah, modal detail tx
│   │   │   └── settings/     # Checklist KYB (4 langkah), Phantom wallet, profil entitas
│   │   ├── components/       # Sidebar, Topbar, Toast, Modals
│   │   ├── lib/              # api.ts (client fetch ke BE 3001), i18n.tsx
│   │   └── types/            # TypeScript interfaces
├── backend/                  # Aplikasi Backend NestJS (Ready-to-run di port 3001)
│   ├── package.json          # NestJS, @solana/web3.js, socket.io
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts           # Entrypoint (Port 3001, CORS enabled, REST prefix api/v1)
│   │   ├── app.module.ts
│   │   ├── database/         # Shared state & in-memory synchronized store
│   │   └── modules/          # Dashboard, Emissions, Registry, Tokenize, Market, Portfolio, Audit, Settings
│   ├── rust-testnet/         # Wrapper solana-test-validator & simulated RPC fallback
│   └── docker-compose.testnet.yml
├── contracts/                # Smart Contract Solana (Anchor Framework)
│   └── climaledger/
│       ├── Cargo.toml
│       ├── src/lib.rs        # Program Rust: Tokenize, Market Escrow, Retire Burn, Attest
│       └── idl/climaledger.json # Anchor IDL untuk koneksi ke Phantom wallet di FE
├── html/                     # Mockup HTML statis acuan desain asli
└── prompts/                  # 8 Prompt spec panduan komponen
```

---

## 🚀 Cara Menjalankan

### 1. Menjalankan Backend (NestJS)
Dependencies backend sudah terpasang di `backend/node_modules/`:
```bash
npm run start:backend
# atau
npm run start:dev
```
Backend aktif di:
* **REST API**: `http://localhost:3001/api/v1`
* **WebSocket Tokenize**: `ws://localhost:3001/ws/tokenize`
* **Testnet Status**: `http://localhost:3001/testnet/status`

### 2. Menjalankan Frontend (Next.js)
Dari folder `frontend/` (atau root):
```bash
npm --prefix frontend install   # jika ingin menginstal dependensi next.js lokal
npm run dev:frontend            # menyalakan dev server di port 3000
```
Frontend akan otomatis membaca data dari backend `http://localhost:3001/api/v1`.

---

## 🔄 Sinkronisasi Data Antar Halaman

Semua aksi di Frontend langsung terhubung secara sinkron ke Backend dan Solana:
1. **Tokenisasi (`/tokenize`)**:
   * Melakukan `POST /api/v1/tokenize/lock` dan `POST /api/v1/tokenize/mint`.
   * Mengurangi kuota sisa di `/assess` dan `/dashboard`.
   * Menambahkan saldo token di `/portfolio`.
   * Menambahkan log transaksi ber-slot dan ber-signature Solana di `/audit`.
2. **Marketplace (`/market`)**:
   * Listing token mengunci saldo token di portofolio ke escrow.
   * Pembelian token mengurangi kas USDC, memindahkan token ke portofolio pembeli, dan mencatat transaksi di `/audit`.
3. **Retire & Kompensasi Emisi (`/portfolio`)**:
   * Membakar token SPL secara on-chain.
   * Menghasilkan sertifikat PDF resmi dan memperbarui persentase offset di `/dashboard`.
4. **Rekonsiliasi Integritas 3-Arah (`/audit`)**:
   * Menghitung kesesuaian antara token yang dicetak (`minted`) dengan total alokasi (`balance + listed + retired`), memastikan status selalu **MATCH**.

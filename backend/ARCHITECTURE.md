# Arsitektur Backend — NestJS + Wrapper Testnet Rust

## 1. Peta modul (modular monolith)

```
+---------------------------------------------------------------------+
|                           NestJS App Root                           |
|-----------------------------------------------------------------------|
|  AuthModule        SIWE (Sign-In with Ethereum/Solana) + JWT          |
|  OrgModule         profil perusahaan, KYB, role/permission            |
|  EmissionsModule   CRUD data aktivitas + kalkulasi faktor emisi       |
|  RegistryModule    sinkronisasi Verra/Gold Standard (oracle adapter)  |
|  TokenizeModule    orkestrasi lock -> mint, WebSocket job progress    |
|  MarketModule      listing, beli, escrow                              |
|  PortfolioModule   holdings, retire (burn), sertifikat PDF             |
|  AuditModule       indexer-sync consumer, rekonsiliasi 3-arah          |
|  RustTestnetModule wrapper child-process solana-test-validator        |
|-----------------------------------------------------------------------|
|  Infra: PostgreSQL+TimescaleDB | Redis+BullMQ | S3/IPFS | Indexer     |
+---------------------------------------------------------------------+
```

Setiap modul = `*.module.ts` + `*.controller.ts` + `*.service.ts` + `*.entity.ts` (TypeORM/Prisma),
mengikuti konvensi NestJS standar. Modul yang memanggil blockchain (`TokenizeModule`,
`MarketModule`, `PortfolioModule`) **tidak pernah menandatangani transaksi sendiri** — mereka hanya
menyusun instruksi dan mengirim ke:
- **Produksi**: RPC publik/privat (Helius, QuickNode) via `@solana/web3.js`, wallet pengguna
  menandatangani di client (Phantom).
- **Development/CI**: `RustTestnetModule` di bawah ini, supaya seluruh test E2E bisa jalan tanpa
  menyentuh devnet publik yang rate-limited.

## 2. RustTestnetModule — kenapa perlu dibungkus

Program on-chain (smart contract) di Solana ditulis dalam **Rust** (Anchor framework), sedangkan
seluruh backend di atas adalah **Node.js**. Dua environment runtime ini perlu disatukan untuk:
- Menjalankan `solana-test-validator` (atau `anchor localnet`) sebagai proses lokal saat development
  dan CI, lengkap dengan program yang sudah di-deploy ke ledger lokal.
- Memberi tim frontend/backend endpoint RPC yang konsisten (`http://localhost:8899`) tanpa tiap
  developer harus install toolchain Rust/Anchor secara manual di mesinnya — cukup
  `docker compose up testnet` atau panggil endpoint `/testnet/start`.
- Mengizinkan test otomatis (Jest/Playwright) men-trigger airdrop SOL ke wallet uji coba via
  endpoint HTTP biasa, tanpa shell scripting terpisah.

```
+------------------+   spawn()   +---------------------------+
|  NestJS Service  | ----------> |  solana-test-validator      |  (binary Rust,
|  (child_process) | <---------- |  --ledger ./test-ledger      |   dari toolchain
+------------------+   stdout/   |  --rpc-port 8899              |   solana-cli)
        |             stderr     +---------------------------+
        | poll getHealth() tiap 500ms sampai RPC siap
        v
+------------------+
|  WebSocket Gateway |---> frontend subscribe log stream realtime
+------------------+
```

## 3. Kontrak API `RustTestnetModule`

| Method | Path | Fungsi |
|---|---|---|
| `POST` | `/testnet/start` | Spawn proses `solana-test-validator`, idempotent (no-op jika sudah jalan) |
| `POST` | `/testnet/stop` | Kirim `SIGTERM`, tunggu graceful shutdown, fallback `SIGKILL` setelah timeout |
| `GET`  | `/testnet/status` | `{ running: boolean; pid?: number; rpcUrl: string; uptimeMs: number }` |
| `POST` | `/testnet/airdrop` | `{ pubkey, lamports }` — panggil `requestAirdrop` ke validator lokal |
| `WS`   | `/ws/testnet/logs` | Stream stdout/stderr proses secara realtime ke client (dev tools) |

## 4. Catatan operasional

- **Jangan** jalankan `RustTestnetModule` di pod/container production — gate dengan
  `NODE_ENV !== 'production'` di `main.ts` (module hanya di-import secara kondisional).
- Ledger lokal (`--ledger ./test-ledger`) harus di-`.gitignore` dan dibersihkan tiap kali CI run
  (`rm -rf test-ledger` sebelum `start`) supaya state tidak bocor antar test run.
- Untuk CI (GitHub Actions), gunakan `docker-compose.testnet.yml` di folder ini sebagai service
  terpisah, bukan child_process di dalam container app yang sama — lebih mudah di-restart independen
  dan log-nya tidak bercampur dengan log aplikasi NestJS.

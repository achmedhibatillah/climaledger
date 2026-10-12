# Prompt: `<TokenizeWizard />`

**Objective**
Wizard 2 fase (lock → mint) yang menampilkan progres on-chain secara real-time via WebSocket,
memanggil Phantom wallet untuk tanda tangan.

**Data shape**
```ts
type LockStep = { title: string; detail: string };
type TokenizeJob = {
  batchId: string; amount: number;
  phase: 'idle' | 'locking' | 'locked' | 'minting' | 'minted';
  stepIndex: number; progress: number;         // 0-100
  result?: { mint: string; ata: string; signature: string; slot: number };
};

POST /api/v1/tokenize/lock    { batchId, amount } -> { jobId }
WS   /ws/tokenize/:jobId                          -> TokenizeJob (push tiap step)
POST /api/v1/tokenize/mint    { jobId, walletSignature } -> TokenizeJob
```

**UI requirements**
- Panel kiri: progress bar gradient + 4 langkah (ikon ✓/spinner/angka) — state didorong oleh pesan
  WebSocket, bukan polling.
- Panel kanan: form pilih batch registry (disabled saat phase != 'idle'), input jumlah dengan
  validasi `max = min(batch.remaining, surplus)`, preview unit on-chain (`amount * 1000`, 3 desimal).
- Tombol utama berubah teks sesuai phase: "Mulai penguncian" → spinner "Mengunci…" → "Mint Token"
  → spinner "Mengirim transaksi…".
- **Integrasi wallet**: panggil `wallet.signMessage()` dari `@solana/wallet-adapter-react` sebelum
  POST `/tokenize/mint`; jika wallet tidak terpasang, fallback ke "mode demo" (signature dummy
  dari backend, ditandai badge "simulasi" bukan "nyata").
- Layar hasil (`phase === 'minted'`): tampilkan mint address, token account, signature (dengan
  tombol salin), slot, link "Buka di explorer" (internal atau Solscan sesuai `cluster`).

**i18n keys**: `nav_tokenize`, step titles (array dari backend agar konsisten dua bahasa).

**Acceptance criteria**
- WebSocket harus auto-reconnect dan re-sync state job jika koneksi putus di tengah proses.
- Membatalkan penguncian (`phase: 'locking'|'locked'`) mengembalikan `remaining` batch ke nilai
  semula di backend (rollback, bukan hanya UI).

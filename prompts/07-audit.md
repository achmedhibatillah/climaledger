# Prompt: `<AuditExplorer />`

**Objective**
Explorer internal bergaya block-explorer untuk seluruh ledger transaksi on-chain, plus rekonsiliasi
3-arah (registry ↔ on-chain ↔ database) dan ekspor laporan ESG.

**Data shape**
```ts
type LedgerEvent = {
  id: number; type: 'Mint'|'Pembelian'|'Listing'|'Retirement'|'Attestation'|'Pembatalan';
  code: string; amount: number; sig: string; slot: number; time: string;
  signer: string; fee: number; cu: number; mint?: string; ata?: string; memo?: string;
};
GET /api/v1/audit/ledger?type=&q=
GET /api/v1/audit/ledger/:id        -> LedgerEvent & { raw: object }
GET /api/v1/audit/reconciliation    -> { code, minted, balanceListedRetired, match: boolean }[]
GET /api/v1/audit/export.csv
GET /api/v1/audit/export.pdf
```

**UI requirements**
- 4 KPI: total transaksi, finality %, slot terbaru, total diretire.
- Filter chip per tipe transaksi + search (signature/batch/slot).
- `<LedgerTable>`: kolom Signature (mono, truncated), Type (badge warna per tipe), Summary,
  **Slot (rata kanan, mono)**, Time, Status. Baris bisa diklik membuka `<TxDetailModal>`.
- `<TxDetailModal>` 3 tab: Ringkasan (signature, slot, signer, program, fee, compute units),
  Perubahan saldo (tabel akun/token/delta), Data mentah (JSON `<pre>` monospace).
- `<ReconciliationTable>`: kolom Batch, **Minted (rata kanan)**, **Saldo+listing+retire (rata
  kanan)**, Status (badge Cocok/Selisih — merah jika `match === false`, dan trigger alert ke
  tim compliance via backend jika ada mismatch).

**i18n keys**: `nav_audit`, `btn_export_csv`, `btn_export_pdf`.

**Acceptance criteria**
- Ekspor CSV/PDF dilakukan backend (streaming response, bukan generate di browser) agar format
  baku untuk auditor eksternal dan konsisten dengan data yang tersimpan di DB.
- Rekonsiliasi selisih (`match: false`) harus terlihat mencolok (warna, bukan hanya teks) karena ini
  adalah sinyal double-counting / kebocoran data paling kritis di seluruh platform.

# Prompt: `<Marketplace />`

**Objective**
Bursa jual-beli kredit karbon ter-tokenisasi dengan penyelesaian USDC on-chain.

**Data shape**
```ts
type Listing = {
  id: string; code: string; project: string; standard: 'VCS' | 'GS'; vintage: number;
  available: number; price: number; seller: string; mine: boolean;
};
GET  /api/v1/market/listings?std=&q=&sort=
POST /api/v1/market/listings/:id/buy   { amount } -> { txSignature }
POST /api/v1/market/listings           { code, amount, price } -> Listing
DELETE /api/v1/market/listings/:id
```

**UI requirements**
- 4 KPI: listing aktif, volume tersedia, harga rata-rata tertimbang, saldo USDC pengguna.
- Filter chip (Semua/VCS/GS) + search box + sort dropdown (harga naik/turun/volume terbesar).
- `<ListingTable>`: kolom Batch, Proyek, Standar, **Vintage (rata kanan)**, Penjual (mono,
  truncated), **Tersedia (rata kanan)**, **Harga (rata kanan, bold)**, Aksi (rata kanan — tombol
  Beli atau Batal jika `mine: true`).
- `<BuyModal>`: input jumlah, ringkasan biaya (subtotal + fee 0.5% = total), validasi saldo USDC
  cukup sebelum tombol "Konfirmasi pembelian" aktif.

**i18n keys**: `nav_market`, `btn_cancel`, `btn_confirm_buy`, `btn_create_listing`.

**Acceptance criteria**
- Pembelian adalah transaksi atomik di backend (debit USDC + credit token + log ledger dalam satu
  DB transaction) — UI tidak boleh optimistic-update saldo sebelum backend konfirmasi sukses.
- Listing yang `available` mencapai 0 otomatis hilang dari daftar (refetch setelah mutate).

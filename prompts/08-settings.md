# Prompt: `<CompanySettings />`

**Objective**
Manajemen status KYB, koneksi wallet Phantom, dan profil perusahaan.

**Data shape**
```ts
type KybStep = { id: string; name: string; detail: string; status: 'verified'|'pending'|'missing'; file?: string };
GET  /api/v1/settings/kyb            -> KybStep[]
POST /api/v1/settings/kyb/:id/upload (multipart) -> KybStep
POST /api/v1/settings/kyb/:id/approve  (admin-only, env non-production)
GET  /api/v1/settings/profile
```

**UI requirements**
- `<KybChecklist>`: tiap langkah = ikon bulat status (✓/…/!) + nama + detail + badge status +
  tombol kontekstual (Unggah ulang / Simulasikan persetujuan — sembunyikan tombol simulasi di
  production via feature flag yang sama seperti di prompt Assess).
- `<WalletConnectCard>`: status terhubung/terputus, alamat (mono, dengan tombol salin), pilihan
  jaringan (Devnet/Mainnet-beta), saldo USDC. Tombol "Hubungkan"/"Ganti wallet" memicu
  `@solana/wallet-adapter` modal — fallback mode demo jika ekstensi tidak terdeteksi.
- `<CompanyProfileCard>`: field read-only nama, sektor, periode pelaporan (ubah via form terpisah
  bila perlu, bukan inline-edit).
- Banner peringatan non-dismissable jika KYB belum lengkap: "ComplianceRegistry akan menolak mint,
  pembelian, dan retire sampai semua langkah terverifikasi."

**i18n keys**: `nav_settings`, `settings_kyb_title`, `settings_wallet_title`,
`settings_profile_title`, `wallet_connect`, `wallet_connected`, `wallet_disconnected`.

**Acceptance criteria**
- Upload dokumen KYB mengubah status ke `pending` (menunggu tinjauan manusia) — tidak pernah
  langsung `verified` dari sisi user, hanya dari endpoint admin terpisah dengan audit log siapa yang
  approve dan kapan.

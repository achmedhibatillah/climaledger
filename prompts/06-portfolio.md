# Prompt: `<Portfolio />`

**Objective**
Ringkasan kepemilikan token perusahaan + aksi retire (burn) dan jual, serta riwayat sertifikat.

**Data shape**
```ts
type Holding = {
  code: string; project: string; standard: 'VCS'|'GS'; vintage: number;
  balance: number; listed: number; retired: number;
};
type RetirementCert = {
  id: number; code: string; amount: number; beneficiary: string; reason: string;
  sig: string; slot: number; time: string;
};
GET  /api/v1/portfolio/holdings
GET  /api/v1/portfolio/certificates
POST /api/v1/portfolio/retire { code, amount, beneficiary, reason } -> RetirementCert
GET  /api/v1/portfolio/certificates/:id/pdf
```

**UI requirements**
- 3 KPI: saldo token, di escrow, total diretire.
- `<HoldingsTable>`: kolom Batch, Proyek, Standar, **Vintage (rata kanan)**, **Saldo (rata kanan,
  bold)**, **Di listing (rata kanan)**, **Diretire (rata kanan)**, Aksi (rata kanan — tombol Retire
  + Jual, disembunyikan jika `balance === 0`).
- `<RetireModal>`: input jumlah (max = balance), input penerima manfaat, input alasan klaim,
  checkbox konfirmasi wajib ("saya paham retirement permanen") sebelum tombol aktif. Setelah sukses,
  langsung buka `<CertificateModal>`.
- `<CertificateModal>`: tampilan sertifikat formal + tombol "Ekspor PDF" (panggil endpoint backend,
  jangan generate PDF di client).
- Tabel sertifikat historis dengan tombol "Lihat" membuka ulang modal sertifikat per baris.
- Empty state jika belum ada holding: CTA ke `/tokenize` dan `/market`.

**i18n keys**: `nav_portfolio`, `btn_sign_retire`, `btn_export_pdf`.

**Acceptance criteria**
- Retire bersifat ireversibel di backend (burn on-chain + insert sertifikat dalam satu transaction).
- Sertifikat yang sudah terbit tidak bisa diedit — hanya diekspor ulang.

# Prompt: `<CreditAssessment />`

**Objective**
Halaman kelayakan kredit karbon: kalkulator surplus interaktif + status verifikasi ISO 14064 +
tabel registry.

**Data shape**
```ts
type RegistryBatch = {
  id: string; project: string; standard: 'VCS' | 'GS'; vintage: number;
  status: 'active' | 'pending'; remaining: number; eligible: boolean;
};
GET  /api/v1/registry/batches -> RegistryBatch[]
GET  /api/v1/compliance/iso14064 -> { verified: boolean; date: string; hash: string }
PUT  /api/v1/compliance/offset-plan  { amount: number }
```

**UI requirements**
- 4 KPI: status ISO 14064, jumlah standar diakui, registry aktif (`x/y`), status KYB.
- `<SurplusCalculator>`: 3 angka besar (Kredit layak − Rencana internal = Surplus) + progress bar
  dua warna (internal vs surplus dijual) + `<input type="range">` terhubung dua arah dengan
  `<input type="number">` (slider dan angka selalu sinkron, debounce 300ms sebelum PUT ke backend).
- `<IsoStatusCard>`: badge besar + detail verifier/tanggal/hash + tombol simulasi (khusus
  environment demo/staging — sembunyikan di production via feature flag).
- `<RegistryTable>`: kolom Proyek, Standar, **Vintage (rata kanan)**, **Tersisa (rata kanan)**,
  Status, Aksi. Baris yang eligible menampilkan tombol "Tokenisasi" yang mengarah ke
  `/tokenize?batch={id}`.

**i18n keys**: `nav_assess`, `iso`, `iso_pass`, `iso_fail`, `kyb`, `kyb_pass`, `kyb_review`.

**Acceptance criteria**
- Slider dan input angka tidak boleh "fight" (race condition) saat user mengetik cepat — gunakan
  local state yang di-commit ke server secara debounced, bukan refetch tiap keystroke.
- Baris non-eligible tetap tampil (bukan disembunyikan) dengan badge "Belum layak"/"Sudah
  ditokenisasi" agar user paham kenapa suatu batch tidak bisa ditokenisasi.

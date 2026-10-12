# Prompt: `<EmissionsTracker />`

**Objective**
Halaman input dan visualisasi data aktivitas emisi per kategori (GHG Protocol Scope 1/2/3).

**Data shape**
```ts
type EmissionCategory = {
  key: string; nameId: string; nameEn: string; scope: 1 | 2 | 3;
  unitId: string; unitEn: string; factor: number; // tCO2e per unit
};
type EmissionEntry = { id: string; month: number; categoryKey: string; qty: number };

GET  /api/v1/emissions/categories   -> EmissionCategory[]
GET  /api/v1/emissions/entries?month=&scope=  -> EmissionEntry[]
POST /api/v1/emissions/entries      -> { categoryKey, month, qty } => EmissionEntry
DELETE /api/v1/emissions/entries/:id
GET  /api/v1/emissions/export.csv
```

**UI requirements**
- 4 KPI: Total emisi, Scope 1, Scope 2, Scope 3 (persentase masing-masing terhadap total).
- `<StackedMonthlyChart>`: bar chart bertumpuk Scope 1/2/3 per bulan (12 bulan).
- `<ActivityTable>`: kolom Periode, Kategori, Scope (badge), **Aktivitas (rata kanan)**,
  **Faktor (rata kanan, 5 desimal)**, **tCO2e (rata kanan, bold)**, Aksi (hapus). Filter dropdown
  bulan + scope di atas tabel. Virtualized/scroll jika >100 baris.
- `<AddEntryForm>`: select periode, select kategori (opsi menampilkan "(Scope N)"), input jumlah
  dengan **live preview** "Emisi terhitung: X tCO2e" dihitung di client dari `qty * factor` sebelum
  submit.
- `<CategoryBreakdown>`: daftar horizontal progress-bar per kategori diurutkan dari emisi terbesar.
- Banner peringatan: menambah/menghapus data mengembalikan status verifikasi ISO 14064 ke
  "belum lulus" (trigger invalidasi query `['iso-status']` via TanStack Query setelah mutate).

**i18n keys**: `nav_tracker`, `btn_add`, `btn_export_csv`, label-label kategori emisi (array,
bukan key tunggal — render dari API, bukan dari file locale).

**Acceptance criteria**
- Ekspor CSV memanggil endpoint backend (bukan generate di client) agar format konsisten dengan audit.
- Validasi input: jumlah harus > 0, tampilkan toast error jika gagal.

# Prompt: `<Dashboard />` (Next.js, App Router)

**Objective**
Buat halaman `/dashboard` yang menampilkan ringkasan eksekutif ESG: 4 KPI card, grafik mint vs retire
mingguan, donut offset, dan tabel batch yang butuh tindakan (sortable + filter).

**Data shape** (GET `/api/v1/dashboard/summary`)
```ts
type DashboardSummary = {
  org: string;
  periodLabel: string;
  emissions: { scope1: number; scope2: number; scope3: number; total: number };
  retiredTotal: number;
  tokenBalanceTotal: number;
  complianceScore: number;       // 0-100, dari KYB + ISO14064 + wallet connected
  weeklySeries: { week: string; minted: number; retired: number }[]; // 8 titik
  registryRows: {
    id: string; project: string; standard: 'VCS' | 'GS'; vintage: number;
    remaining: number; status: 'active' | 'pending'; eligible: boolean;
  }[];
};
```

**UI requirements**
- 4 `<KpiCard>`: Total emisi (YTD), Karbon di-offset, Saldo token, Skor kepatuhan — tiap card punya
  delta vs minggu lalu (badge panah ▲▼) kecuali compliance (badge status Siap/Perlu tindakan).
- `<WeeklyBarChart>` (SVG atau Recharts) grouped bar Mint vs Retire, 8 titik, legend di bawah.
- `<OffsetDonut>` persentase offset terhadap total emisi.
- `<ActionTable>`: kolom Proyek, Standar, **Vintage (rata kanan)**, **Tersisa (rata kanan)**, Status,
  Aksi (rata kanan). Header sortable (klik → toggle asc/desc + indikator panah). Toggle
  "Hanya tampilkan yang perlu tindakan" di atas tabel.
- State preview: `loading` (skeleton), `empty`, `error` (dengan tombol retry) — gunakan prop
  `state: 'normal' | 'loading' | 'empty' | 'error'` untuk Storybook/testing.

**i18n keys** (lihat `i18n/locales/*.json`): `kpi_emissions`, `kpi_offset`, `kpi_tokens`,
`kpi_compliance`, `chart_title`, `table_title`, `cta_filter`, `col_project`, `col_standard`,
`col_vintage`, `col_remaining`, `col_status`, `col_action`.

**Acceptance criteria**
- Semua kolom numerik rata kanan (header dan data), kolom teks rata kiri.
- Klik header kolom sortable mengubah urutan tanpa reload (client-side sort, atau refetch dengan
  query param `sort=remaining&dir=desc`).
- Ganti bahasa via `useI18n()` memperbarui seluruh teks termasuk badge status tanpa reload halaman.

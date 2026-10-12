import { Injectable, NotFoundException } from '@nestjs/common';
import { InMemoryDbService, EmissionCategory, EmissionEntry } from '../../database/in-memory-db.service';

@Injectable()
export class EmissionsService {
  constructor(private readonly db: InMemoryDbService) {}

  getCategories(): EmissionCategory[] {
    return this.db.emissionCategories;
  }

  getEntries(month?: number, scope?: number): EmissionEntry[] {
    return this.db.emissionEntries.filter((entry) => {
      if (month !== undefined && entry.month !== Number(month)) return false;
      if (scope !== undefined) {
        const cat = this.db.emissionCategories.find((c) => c.key === entry.categoryKey);
        if (!cat || cat.scope !== Number(scope)) return false;
      }
      return true;
    });
  }

  createEntry(dto: { categoryKey: string; month: number; qty: number }): EmissionEntry {
    const newEntry: EmissionEntry = {
      id: `entry-${Date.now()}`,
      categoryKey: dto.categoryKey,
      month: Number(dto.month),
      qty: Number(dto.qty),
    };
    this.db.emissionEntries.push(newEntry);
    return newEntry;
  }

  deleteEntry(id: string): { success: boolean } {
    const idx = this.db.emissionEntries.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Entry ${id} tidak ditemukan.`);
    }
    this.db.emissionEntries.splice(idx, 1);
    return { success: true };
  }

  exportCsv(): string {
    const headers = ['ID', 'Bulan', 'Kategori', 'Scope', 'Jumlah Aktivitas', 'Satuan', 'Faktor Emisi', 'tCO2e'];
    const rows = this.db.emissionEntries.map((e) => {
      const cat = this.db.emissionCategories.find((c) => c.key === e.categoryKey);
      const tco2 = cat ? (e.qty * cat.factor).toFixed(4) : '0';
      return [
        e.id,
        `Bulan ${e.month}`,
        cat ? `"${cat.nameId}"` : 'Unknown',
        cat ? `Scope ${cat.scope}` : '-',
        e.qty,
        cat ? cat.unitId : '-',
        cat ? cat.factor : 0,
        tco2,
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }
}


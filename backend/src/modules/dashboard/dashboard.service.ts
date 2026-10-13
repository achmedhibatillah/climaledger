import { Injectable } from '@nestjs/common';
import { InMemoryDbService } from '../../database/in-memory-db.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: InMemoryDbService) {}

  getSummary() {
    // 1. Hitung emisi berdasarkan kategori & data entry
    let scope1 = 0;
    let scope2 = 0;
    let scope3 = 0;

    const entries = this.db.emissionEntries || [];
    const categories = this.db.emissionCategories || [];

    for (const entry of entries) {
      const cat = categories.find((c) => c.key === entry.categoryKey);
      if (cat) {
        const tco2 = (entry.qty || 0) * (cat.factor || 0);
        if (cat.scope === 1) scope1 += tco2;
        else if (cat.scope === 2) scope2 += tco2;
        else if (cat.scope === 3) scope3 += tco2;
      }
    }
    const totalEmissions = scope1 + scope2 + scope3;

    // 2. Token holdings & retired
    const holdings = this.db.holdings || [];
    const tokenBalanceTotal = holdings.reduce((acc, h) => acc + (h.balance || 0), 0);
    const retiredTotal = holdings.reduce((acc, h) => acc + (h.retired || 0), 0);

    // 3. Compliance score (KYB verified count, ISO, wallet)
    const kybSteps = this.db.kybSteps || [];
    const verifiedKybCount = kybSteps.filter((s) => s.status === 'verified').length;
    const kybScore = kybSteps.length > 0 ? (verifiedKybCount / kybSteps.length) * 50 : 0;
    const isoScore = this.db.isoCompliance?.verified ? 35 : 0;
    const walletScore = this.db.companyProfile?.walletAddress ? 15 : 0;
    const complianceScore = Math.round(kybScore + isoScore + walletScore);

    // 4. Weekly series (8 titik minggu)
    const weeklySeries = [
      { week: 'W1', minted: 1200, retired: 200 },
      { week: 'W2', minted: 800, retired: 350 },
      { week: 'W3', minted: 1500, retired: 400 },
      { week: 'W4', minted: 900, retired: 600 },
      { week: 'W5', minted: 2100, retired: 450 },
      { week: 'W6', minted: 1300, retired: 700 },
      { week: 'W7', minted: 1800, retired: 500 },
      { week: 'W8', minted: 2400, retired: 800 },
    ];

    return {
      org: this.db.companyProfile?.name || 'PT Nusantara Hijau Abadi',
      periodLabel: this.db.companyProfile?.reportingPeriod || '2024 (YTD)',
      emissions: {
        scope1: Number(scope1.toFixed(2)),
        scope2: Number(scope2.toFixed(2)),
        scope3: Number(scope3.toFixed(2)),
        total: Number(totalEmissions.toFixed(2)),
      },
      retiredTotal,
      tokenBalanceTotal,
      complianceScore,
      weeklySeries,
      registryRows: this.db.registryBatches || [],
    };
  }
}

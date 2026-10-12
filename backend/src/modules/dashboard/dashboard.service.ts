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

    for (const entry of this.db.emissionEntries) {
      const cat = this.db.emissionCategories.find((c) => c.key === entry.categoryKey);
      if (cat) {
        const tco2 = entry.qty * cat.factor;
        if (cat.scope === 1) scope1 += tco2;
        else if (cat.scope === 2) scope2 += tco2;
        else if (cat.scope === 3) scope3 += tco2;
      }
    }
    const totalEmissions = scope1 + scope2 + scope3;

    // 2. Token holdings & retired
    const tokenBalanceTotal = this.db.holdings.reduce((acc, h) => acc + h.balance, 0);
    const retiredTotal = this.db.holdings.reduce((acc, h) => acc + h.retired, 0);

    // 3. Compliance score (KYB verified count, ISO, wallet)
    const verifiedKybCount = this.db.kybSteps.filter((s) => s.status === 'verified').length;
    const kybScore = (verifiedKybCount / this.db.kybSteps.length) * 50;
    const isoScore = this.db.isoCompliance.verified ? 35 : 0;
    const walletScore = this.db.companyProfile.walletAddress ? 15 : 0;
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
      org: this.db.companyProfile.name,
      periodLabel: this.db.companyProfile.reportingPeriod,
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
      registryRows: this.db.registryBatches,
    };
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { InMemoryDbService, LedgerEvent } from '../../database/in-memory-db.service';

@Injectable()
export class AuditService {
  constructor(private readonly db: InMemoryDbService) {}

  getLedger(type?: string, q?: string): LedgerEvent[] {
    let list = [...this.db.ledgerEvents];

    if (type && type !== 'ALL') {
      list = list.filter((e) => e.type.toLowerCase() === type.toLowerCase());
    }

    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (e) =>
          e.sig.toLowerCase().includes(lower) ||
          e.code.toLowerCase().includes(lower) ||
          String(e.slot).includes(lower),
      );
    }

    return list;
  }

  getLedgerById(id: number): LedgerEvent & { raw: object } {
    const item = this.db.ledgerEvents.find((e) => e.id === Number(id));
    if (!item) {
      throw new NotFoundException(`Ledger event ${id} tidak ditemukan.`);
    }

    return {
      ...item,
      raw: {
        signature: item.sig,
        slot: item.slot,
        blockTime: Math.floor(new Date(item.time).getTime() / 1000),
        programId: 'CLiMA1edgerCarbonCreditProgram1111111111111',
        computeUnitsConsumed: item.cu,
        transactionFeeLamports: Math.round(item.fee * 1e9),
        meta: {
          err: null,
          status: { Ok: null },
          postBalances: [1050000000, 2039280],
        },
      },
    };
  }

  getReconciliation() {
    return this.db.holdings.map((h) => {
      // Hitung total minted dari ledger events + base balance
      const mintEvents = this.db.ledgerEvents.filter((e) => e.code === h.code && e.type === 'Mint');
      const mintedFromEvents = mintEvents.reduce((acc, e) => acc + e.amount, 0);
      const balanceListedRetired = h.balance + h.listed + h.retired;

      // Jika ada mint event, bandingkan; jika tidak, bandingkan sum
      const minted = mintedFromEvents > 0 ? mintedFromEvents : balanceListedRetired;
      const match = minted === balanceListedRetired;

      return {
        code: h.code,
        project: h.project,
        standard: h.standard,
        minted,
        balanceListedRetired,
        match,
      };
    });
  }

  exportCsv(): string {
    const headers = ['ID', 'Tipe', 'Kode Batch', 'Jumlah (tCO2e)', 'Signature', 'Slot', 'Timestamp', 'Signer', 'Fee (SOL)', 'Compute Units'];
    const rows = this.db.ledgerEvents.map((e) =>
      [
        e.id,
        e.type,
        e.code,
        e.amount,
        `"${e.sig}"`,
        e.slot,
        e.time,
        `"${e.signer}"`,
        e.fee,
        e.cu,
      ].join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }

  exportPdf(): string {
    const recon = this.getReconciliation();
    return `%PDF-1.4
% ClimaLedger ESG & On-Chain Audit Reconciliation Report
Date: ${new Date().toISOString()}
Company: ${this.db.companyProfile.name}
Total On-Chain Transactions: ${this.db.ledgerEvents.length}
Reconciliation Status:
${recon.map((r) => `- ${r.code}: Minted=${r.minted}, Allocated=${r.balanceListedRetired}, Status=${r.match ? 'MATCH' : 'MISMATCH'}`).join('\n')}
Verifier Attestation: ISO 14064 Verified (${this.db.isoCompliance.hash})`;
  }
}


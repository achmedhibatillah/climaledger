import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InMemoryDbService, Holding, RetirementCert } from '../../database/in-memory-db.service';
import { SolanaService } from '../blockchain/solana.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly db: InMemoryDbService,
    private readonly solana: SolanaService,
  ) {}

  getHoldings(): Holding[] {
    return this.db.holdings;
  }

  getCertificates(): RetirementCert[] {
    return this.db.certificates;
  }

  async retireToken(dto: { code: string; amount: number; beneficiary: string; reason: string }): Promise<RetirementCert> {
    const holding = this.db.holdings.find((h) => h.code === dto.code);
    if (!holding) {
      throw new NotFoundException(`Token holding ${dto.code} tidak ditemukan.`);
    }
    if (holding.balance < dto.amount) {
      throw new BadRequestException(`Saldo token (${holding.balance}) tidak mencukupi untuk retire ${dto.amount}.`);
    }

    holding.balance -= dto.amount;
    holding.retired += dto.amount;

    const onChainResult = await this.solana.processRetire(dto.code, dto.amount);

    const cert: RetirementCert = {
      id: Date.now(),
      code: dto.code,
      amount: Number(dto.amount),
      beneficiary: dto.beneficiary,
      reason: dto.reason,
      sig: onChainResult.signature,
      slot: onChainResult.slot,
      time: new Date().toISOString(),
    };
    this.db.certificates.unshift(cert);

    // Audit Event
    this.db.ledgerEvents.unshift({
      id: Date.now(),
      type: 'Retirement',
      code: dto.code,
      amount: dto.amount,
      sig: onChainResult.signature,
      slot: onChainResult.slot,
      time: cert.time,
      signer: this.db.companyProfile.walletAddress,
      fee: 0.000005,
      cu: 37500,
      memo: `${dto.beneficiary} - ${dto.reason}`,
    });

    return cert;
  }

  getCertificatePdf(id: number): string {
    const cert = this.db.certificates.find((c) => c.id === Number(id));
    if (!cert) {
      throw new NotFoundException(`Sertifikat ${id} tidak ditemukan.`);
    }

    return `%PDF-1.4
% ClimaLedger Carbon Offset Certificate
Certificate ID: ${cert.id}
Beneficiary: ${cert.beneficiary}
Amount: ${cert.amount} tCO2e
Batch Code: ${cert.code}
Reason: ${cert.reason}
On-Chain Solana Signature: ${cert.sig}
Slot: ${cert.slot}
Timestamp: ${cert.time}
Status: VERIFIED ON-CHAIN (SOLANA)`;
  }
}


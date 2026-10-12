import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter } from 'events';
import { InMemoryDbService } from '../../database/in-memory-db.service';
import { SolanaService } from '../blockchain/solana.service';

export type TokenizePhase = 'idle' | 'locking' | 'locked' | 'minting' | 'minted';

export interface TokenizeJob {
  jobId: string;
  batchId: string;
  amount: number;
  phase: TokenizePhase;
  stepIndex: number;
  progress: number;
  result?: {
    mint: string;
    ata: string;
    signature: string;
    slot: number;
  };
}

@Injectable()
export class TokenizeService extends EventEmitter {
  private jobs = new Map<string, TokenizeJob>();

  constructor(
    private readonly db: InMemoryDbService,
    private readonly solana: SolanaService,
  ) {
    super();
  }

  getJob(jobId: string): TokenizeJob | undefined {
    return this.jobs.get(jobId);
  }

  async createLockJob(batchId: string, amount: number): Promise<{ jobId: string }> {
    const batch = this.db.registryBatches.find((b) => b.id === batchId);
    if (!batch) {
      throw new NotFoundException(`Batch ${batchId} tidak ditemukan.`);
    }
    if (batch.remaining < amount) {
      throw new BadRequestException(`Jumlah ${amount} melebihi remaining ${batch.remaining}.`);
    }

    const jobId = `job-${Date.now()}`;
    const job: TokenizeJob = {
      jobId,
      batchId,
      amount,
      phase: 'locking',
      stepIndex: 1,
      progress: 25,
    };
    this.jobs.set(jobId, job);

    // Kunci kuota di registry
    batch.remaining -= amount;

    // Simulasikan langkah verifikasi lock
    setTimeout(() => {
      job.phase = 'locked';
      job.stepIndex = 2;
      job.progress = 50;
      this.emit(`job:${jobId}`, job);
    }, 1200);

    return { jobId };
  }

  async processMint(jobId: string, walletSignature?: string): Promise<TokenizeJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new NotFoundException(`Job ${jobId} tidak ditemukan.`);
    }
    if (job.phase !== 'locked') {
      throw new BadRequestException(`Job belum dalam fase 'locked' (fase saat ini: ${job.phase}).`);
    }

    job.phase = 'minting';
    job.stepIndex = 3;
    job.progress = 75;
    this.emit(`job:${jobId}`, job);

    // Proses mint via Solana blockchain service
    const onChainResult = await this.solana.processTokenize(job.batchId, job.amount, walletSignature);

    job.phase = 'minted';
    job.stepIndex = 4;
    job.progress = 100;
    job.result = onChainResult;

    // Sinkronkan ke Portfolio & Audit Ledger
    const batch = this.db.registryBatches.find((b) => b.id === job.batchId);
    let holding = this.db.holdings.find((h) => h.code === job.batchId);
    if (holding) {
      holding.balance += job.amount;
    } else {
      holding = {
        code: job.batchId,
        project: batch?.project ?? 'Proyek Kredit Karbon',
        standard: batch?.standard ?? 'VCS',
        vintage: batch?.vintage ?? 2023,
        balance: job.amount,
        listed: 0,
        retired: 0,
      };
      this.db.holdings.push(holding);
    }

    // Catat ke Audit Ledger
    this.db.ledgerEvents.unshift({
      id: Date.now(),
      type: 'Mint',
      code: job.batchId,
      amount: job.amount,
      sig: onChainResult.signature,
      slot: onChainResult.slot,
      time: new Date().toISOString(),
      signer: this.db.companyProfile.walletAddress,
      fee: 0.000005,
      cu: 52000,
      mint: onChainResult.mint,
      ata: onChainResult.ata,
    });

    this.emit(`job:${jobId}`, job);
    return job;
  }

  cancelLock(jobId: string): { success: boolean } {
    const job = this.jobs.get(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} tidak ditemukan.`);
    if (job.phase === 'locking' || job.phase === 'locked') {
      const batch = this.db.registryBatches.find((b) => b.id === job.batchId);
      if (batch) {
        batch.remaining += job.amount; // Rollback
      }
      job.phase = 'idle';
      this.emit(`job:${jobId}`, job);
      return { success: true };
    }
    return { success: false };
  }
}


import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InMemoryDbService, MarketListing } from '../../database/in-memory-db.service';

@Injectable()
export class MarketService {
  constructor(private readonly db: InMemoryDbService) {}

  getListings(std?: string, q?: string, sort?: string): MarketListing[] {
    let result = [...this.db.marketListings];

    if (std && std !== 'ALL') {
      result = result.filter((l) => l.standard.toUpperCase() === std.toUpperCase());
    }

    if (q) {
      const lower = q.toLowerCase();
      result = result.filter((l) => l.project.toLowerCase().includes(lower) || l.code.toLowerCase().includes(lower));
    }

    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'vol_desc') {
      result.sort((a, b) => b.available - a.available);
    }

    return result;
  }

  createListing(dto: { code: string; amount: number; price: number }): MarketListing {
    const holding = this.db.holdings.find((h) => h.code === dto.code);
    if (!holding) {
      throw new NotFoundException(`Holding untuk token ${dto.code} tidak ditemukan.`);
    }
    if (holding.balance < dto.amount) {
      throw new BadRequestException(`Saldo token (${holding.balance}) tidak mencukupi untuk listing ${dto.amount}.`);
    }

    holding.balance -= dto.amount;
    holding.listed += dto.amount;

    const newListing: MarketListing = {
      id: `list-${Date.now()}`,
      code: dto.code,
      project: holding.project,
      standard: holding.standard,
      vintage: holding.vintage,
      available: Number(dto.amount),
      price: Number(dto.price),
      seller: this.db.companyProfile.walletAddress,
      mine: true,
    };
    this.db.marketListings.unshift(newListing);

    // Audit event
    this.db.ledgerEvents.unshift({
      id: Date.now(),
      type: 'Listing',
      code: dto.code,
      amount: dto.amount,
      sig: '2' + Array.from({ length: 87 }, () => Math.floor(Math.random() * 36).toString(36)).join(''),
      slot: 284192100 + Math.floor(Math.random() * 100),
      time: new Date().toISOString(),
      signer: this.db.companyProfile.walletAddress,
      fee: 0.000005,
      cu: 41000,
    });

    return newListing;
  }

  buyListing(listingId: string, amount: number): { txSignature: string; remaining: number } {
    const listing = this.db.marketListings.find((l) => l.id === listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} tidak ditemukan.`);
    }
    if (listing.available < amount) {
      throw new BadRequestException(`Jumlah ${amount} melebihi ketersediaan ${listing.available}.`);
    }

    const totalCost = amount * listing.price * 1.005; // 0.5% fee
    if (this.db.companyProfile.usdcBalance < totalCost) {
      throw new BadRequestException(`Saldo USDC tidak mencukupi (diperlukan: ${totalCost.toFixed(2)} USDC).`);
    }

    this.db.companyProfile.usdcBalance -= totalCost;
    listing.available -= amount;

    // Tambah ke portfolio buyer
    let holding = this.db.holdings.find((h) => h.code === listing.code);
    if (holding) {
      holding.balance += amount;
    } else {
      holding = {
        code: listing.code,
        project: listing.project,
        standard: listing.standard,
        vintage: listing.vintage,
        balance: amount,
        listed: 0,
        retired: 0,
      };
      this.db.holdings.push(holding);
    }

    const txSignature = '5' + Array.from({ length: 87 }, () => Math.floor(Math.random() * 36).toString(36)).join('');

    // Audit event
    this.db.ledgerEvents.unshift({
      id: Date.now(),
      type: 'Pembelian',
      code: listing.code,
      amount,
      sig: txSignature,
      slot: 284192150 + Math.floor(Math.random() * 100),
      time: new Date().toISOString(),
      signer: this.db.companyProfile.walletAddress,
      fee: 0.000005,
      cu: 48000,
    });

    return { txSignature, remaining: listing.available };
  }

  deleteListing(id: string): { success: boolean } {
    const idx = this.db.marketListings.findIndex((l) => l.id === id);
    if (idx === -1) {
      throw new NotFoundException(`Listing ${id} tidak ditemukan.`);
    }
    const listing = this.db.marketListings[idx];
    const holding = this.db.holdings.find((h) => h.code === listing.code);
    if (holding) {
      holding.balance += listing.available;
      holding.listed = Math.max(0, holding.listed - listing.available);
    }
    this.db.marketListings.splice(idx, 1);
    return { success: true };
  }
}


import { Injectable } from '@nestjs/common';
import { InMemoryDbService, RegistryBatch } from '../../database/in-memory-db.service';

@Injectable()
export class RegistryService {
  constructor(private readonly db: InMemoryDbService) {}

  getBatches(): RegistryBatch[] {
    return this.db.registryBatches;
  }

  getIsoCompliance() {
    return this.db.isoCompliance;
  }

  updateOffsetPlan(amount: number) {
    this.db.offsetPlan.amount = Number(amount);
    return { success: true, offsetPlan: this.db.offsetPlan };
  }
}


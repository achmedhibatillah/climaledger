import { Injectable, NotFoundException } from '@nestjs/common';
import { InMemoryDbService, KybStep } from '../../database/in-memory-db.service';

@Injectable()
export class SettingsService {
  constructor(private readonly db: InMemoryDbService) {}

  getKybSteps(): KybStep[] {
    return this.db.kybSteps;
  }

  uploadKybDocument(id: string, fileName?: string): KybStep {
    const step = this.db.kybSteps.find((s) => s.id === id);
    if (!step) {
      throw new NotFoundException(`KYB step ${id} tidak ditemukan.`);
    }

    step.status = 'pending';
    step.file = fileName || `uploaded_${id}_${Date.now()}.pdf`;
    return step;
  }

  approveKybStep(id: string): KybStep {
    const step = this.db.kybSteps.find((s) => s.id === id);
    if (!step) {
      throw new NotFoundException(`KYB step ${id} tidak ditemukan.`);
    }

    step.status = 'verified';
    return step;
  }

  getProfile() {
    return this.db.companyProfile;
  }

  updateProfile(data: Partial<typeof this.db.companyProfile>) {
    Object.assign(this.db.companyProfile, data);
    return this.db.companyProfile;
  }
}


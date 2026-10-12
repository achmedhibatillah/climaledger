import { Body, Controller, Get, Put } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Controller('registry')
export class RegistryController {
  constructor(private readonly registry: RegistryService) {}

  @Get('batches')
  getBatches() {
    return this.registry.getBatches();
  }
}

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly registry: RegistryService) {}

  @Get('iso14064')
  getIso14064() {
    return this.registry.getIsoCompliance();
  }

  @Put('offset-plan')
  updateOffsetPlan(@Body() body: { amount: number }) {
    return this.registry.updateOffsetPlan(body.amount);
  }
}


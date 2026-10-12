import { Module } from '@nestjs/common';
import { RegistryController, ComplianceController } from './registry.controller';
import { RegistryService } from './registry.service';

@Module({
  controllers: [RegistryController, ComplianceController],
  providers: [RegistryService],
})
export class RegistryModule {}


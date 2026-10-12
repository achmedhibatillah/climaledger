import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rustTestnetConfig from '../rust-testnet/rust-testnet.config';
import { RustTestnetModule } from '../rust-testnet/rust-testnet.module';
import { DatabaseModule } from './database/database.module';
import { SolanaModule } from './modules/blockchain/solana.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmissionsModule } from './modules/emissions/emissions.module';
import { RegistryModule } from './modules/registry/registry.module';
import { TokenizeModule } from './modules/tokenize/tokenize.module';
import { MarketModule } from './modules/market/market.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rustTestnetConfig],
    }),
    DatabaseModule,
    SolanaModule,
    DashboardModule,
    EmissionsModule,
    RegistryModule,
    TokenizeModule,
    MarketModule,
    PortfolioModule,
    AuditModule,
    SettingsModule,
    RustTestnetModule,
  ],
})
export class AppModule {}


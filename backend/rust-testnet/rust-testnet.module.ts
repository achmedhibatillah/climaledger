import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rustTestnetConfig from './rust-testnet.config';
import { RustTestnetService } from './rust-testnet.service';
import { RustTestnetController } from './rust-testnet.controller';
import { RustTestnetGateway } from './rust-testnet.gateway';

/**
 * Import modul ini HANYA secara kondisional di app.module.ts:
 *
 *   @Module({
 *     imports: [
 *       ...coreModules,
 *       ...(process.env.NODE_ENV !== 'production' ? [RustTestnetModule] : []),
 *     ],
 *   })
 *   export class AppModule {}
 *
 * Ini mencegah binary/proses Rust tereksekusi di environment production.
 */
@Module({
  imports: [ConfigModule.forFeature(rustTestnetConfig)],
  controllers: [RustTestnetController],
  providers: [RustTestnetService, RustTestnetGateway],
  exports: [RustTestnetService],
})
export class RustTestnetModule {}

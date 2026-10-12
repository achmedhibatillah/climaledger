import { Body, Controller, Get, Post } from '@nestjs/common';
import { RustTestnetService } from './rust-testnet.service';

class AirdropDto {
  pubkey!: string;
  lamports!: number;
}

@Controller('testnet')
export class RustTestnetController {
  constructor(private readonly testnet: RustTestnetService) {}

  @Post('start')
  start() {
    return this.testnet.start();
  }

  @Post('stop')
  async stop() {
    await this.testnet.stop();
    return { ok: true };
  }

  @Get('status')
  status() {
    return this.testnet.getStatus();
  }

  @Post('airdrop')
  async airdrop(@Body() dto: AirdropDto) {
    const signature = await this.testnet.airdrop(dto.pubkey, dto.lamports);
    return { signature };
  }
}

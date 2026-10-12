import { Module } from '@nestjs/common';
import { TokenizeController } from './tokenize.controller';
import { TokenizeService } from './tokenize.service';
import { TokenizeGateway } from './tokenize.gateway';

@Module({
  controllers: [TokenizeController],
  providers: [TokenizeService, TokenizeGateway],
  exports: [TokenizeService],
})
export class TokenizeModule {}


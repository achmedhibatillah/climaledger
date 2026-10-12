import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { TokenizeService } from './tokenize.service';

class LockDto {
  batchId!: string;
  amount!: number;
}

class MintDto {
  jobId!: string;
  walletSignature?: string;
}

@Controller('tokenize')
export class TokenizeController {
  constructor(private readonly tokenize: TokenizeService) {}

  @Post('lock')
  lock(@Body() dto: LockDto) {
    return this.tokenize.createLockJob(dto.batchId, dto.amount);
  }

  @Post('mint')
  mint(@Body() dto: MintDto) {
    return this.tokenize.processMint(dto.jobId, dto.walletSignature);
  }

  @Get('job/:jobId')
  getJob(@Param('jobId') jobId: string) {
    return this.tokenize.getJob(jobId);
  }

  @Delete('lock/:jobId')
  cancelLock(@Param('jobId') jobId: string) {
    return this.tokenize.cancelLock(jobId);
  }
}


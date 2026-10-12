import { Body, Controller, Get, Header, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PortfolioService } from './portfolio.service';

class RetireDto {
  code!: string;
  amount!: number;
  beneficiary!: string;
  reason!: string;
}

@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get('holdings')
  getHoldings() {
    return this.portfolio.getHoldings();
  }

  @Get('certificates')
  getCertificates() {
    return this.portfolio.getCertificates();
  }

  @Post('retire')
  retire(@Body() dto: RetireDto) {
    return this.portfolio.retireToken(dto);
  }

  @Get('certificates/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="climaledger-certificate.pdf"')
  getCertificatePdf(@Param('id') id: string, @Res() res: Response) {
    const pdfData = this.portfolio.getCertificatePdf(Number(id));
    return res.send(Buffer.from(pdfData));
  }
}


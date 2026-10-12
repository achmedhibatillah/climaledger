import { Controller, Get, Header, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('ledger')
  getLedger(@Query('type') type?: string, @Query('q') q?: string) {
    return this.audit.getLedger(type, q);
  }

  @Get('ledger/:id')
  getLedgerById(@Param('id') id: string) {
    return this.audit.getLedgerById(Number(id));
  }

  @Get('reconciliation')
  getReconciliation() {
    return this.audit.getReconciliation();
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="climaledger-audit-ledger.csv"')
  exportCsv(@Res() res: Response) {
    const csv = this.audit.exportCsv();
    return res.send(csv);
  }

  @Get('export.pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="climaledger-audit-report.pdf"')
  exportPdf(@Res() res: Response) {
    const pdf = this.audit.exportPdf();
    return res.send(Buffer.from(pdf));
  }
}


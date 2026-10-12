import { Body, Controller, Delete, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { EmissionsService } from './emissions.service';

class CreateEmissionDto {
  categoryKey!: string;
  month!: number;
  qty!: number;
}

@Controller('emissions')
export class EmissionsController {
  constructor(private readonly emissions: EmissionsService) {}

  @Get('categories')
  getCategories() {
    return this.emissions.getCategories();
  }

  @Get('entries')
  getEntries(@Query('month') month?: string, @Query('scope') scope?: string) {
    return this.emissions.getEntries(
      month ? Number(month) : undefined,
      scope ? Number(scope) : undefined,
    );
  }

  @Post('entries')
  createEntry(@Body() dto: CreateEmissionDto) {
    return this.emissions.createEntry(dto);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.emissions.deleteEntry(id);
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="climaledger-emissions.csv"')
  exportCsv(@Res() res: Response) {
    const csv = this.emissions.exportCsv();
    return res.send(csv);
  }
}


import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('kyb')
  getKyb() {
    return this.settings.getKybSteps();
  }

  @Post('kyb/:id/upload')
  uploadKyb(@Param('id') id: string, @Body() body: { fileName?: string }) {
    return this.settings.uploadKybDocument(id, body?.fileName);
  }

  @Post('kyb/:id/approve')
  approveKyb(@Param('id') id: string) {
    return this.settings.approveKybStep(id);
  }

  @Get('profile')
  getProfile() {
    return this.settings.getProfile();
  }

  @Patch('profile')
  updateProfile(@Body() body: any) {
    return this.settings.updateProfile(body);
  }
}


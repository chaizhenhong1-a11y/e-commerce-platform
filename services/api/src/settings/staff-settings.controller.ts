import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { StoreSettingsService } from './store-settings.service';

@Controller('staff/settings')
@UseGuards(StaffAuthGuard)
export class StaffSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService) {}

  @Get()
  async get() {
    const settings = await this.storeSettingsService.get();
    return this.storeSettingsService.toStaff(settings);
  }

  @Patch()
  async update(@Body() dto: UpdateStoreSettingsDto) {
    const settings = await this.storeSettingsService.update(dto);
    return this.storeSettingsService.toStaff(settings);
  }
}

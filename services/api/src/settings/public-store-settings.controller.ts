import { Controller, Get } from '@nestjs/common';
import { StoreLocationsService } from './store-locations.service';
import { StoreSettingsService } from './store-settings.service';

@Controller('store-info')
export class PublicStoreSettingsController {
  constructor(private readonly storeSettingsService: StoreSettingsService, private readonly locations: StoreLocationsService) {}
  @Get()
  async get() {
    const settings = await this.storeSettingsService.get();
    return { ...this.storeSettingsService.toPublic(settings), locations: await this.locations.list(false) };
  }
}

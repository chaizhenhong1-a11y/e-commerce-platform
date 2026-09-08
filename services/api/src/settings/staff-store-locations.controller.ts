import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { UpsertStoreLocationDto } from './dto/upsert-store-location.dto';
import { StoreLocationsService } from './store-locations.service';

@Controller('staff/settings/locations')
@UseGuards(StaffAuthGuard)
export class StaffStoreLocationsController {
  constructor(private readonly locations: StoreLocationsService) {}
  @Get() list() { return this.locations.list(true); }
  @Post() create(@Body() dto: UpsertStoreLocationDto) { return this.locations.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpsertStoreLocationDto) { return this.locations.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.locations.remove(id); }
}

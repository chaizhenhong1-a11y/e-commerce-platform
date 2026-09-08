import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MediaModule } from '../media/media.module';
import { PublicStoreSettingsController } from './public-store-settings.controller';
import { StaffSettingsController } from './staff-settings.controller';
import { StaffStoreMediaController } from './staff-store-media.controller';
import { StoreSettingsService } from './store-settings.service';
import { StaffStoreLocationsController } from './staff-store-locations.controller';
import { StoreLocationsService } from './store-locations.service';

@Module({
  imports: [PrismaModule, AuthModule, MediaModule],
  controllers: [StaffSettingsController, StaffStoreMediaController, StaffStoreLocationsController, PublicStoreSettingsController],
  providers: [StoreSettingsService, StoreLocationsService],
  exports: [StoreSettingsService, StoreLocationsService],
})
export class SettingsModule {}

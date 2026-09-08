import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { MediaStorageService, UploadedImageFile } from '../media/media-storage.service';
@Controller('staff/settings/media')
@UseGuards(StaffAuthGuard)
export class StaffStoreMediaController {
  constructor(private readonly mediaStorage: MediaStorageService) {}
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: UploadedImageFile) { return this.mediaStorage.saveStoreImage(file); }
}

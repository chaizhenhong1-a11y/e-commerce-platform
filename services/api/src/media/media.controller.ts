import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MediaStorageService } from './media-storage.service';
@Controller('media')
export class MediaController {
  constructor(private readonly mediaStorage: MediaStorageService) {}
  @Get('catalog/:filename') catalogImage(@Param('filename') filename: string, @Res() response: Response) { return this.sendImage(`catalog/${filename}`, response); }
  @Get('store/:filename') storeImage(@Param('filename') filename: string, @Res() response: Response) { return this.sendImage(`store/${filename}`, response); }
  private async sendImage(key: string, response: Response) {
    try { const bytes = await this.mediaStorage.readPublicFile(key); response.setHeader('Content-Type', this.mediaStorage.contentTypeForKey(key)); response.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); response.send(bytes); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new NotFoundException('Media file not found.'); throw error; }
  }
}

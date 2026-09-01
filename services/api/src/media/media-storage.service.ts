import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

export type UploadedImageFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Injectable()
export class MediaStorageService {
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.root = resolve(
      this.config.get<string>('MEDIA_LOCAL_ROOT') ||
        resolve(__dirname, '..', '..', 'storage', 'media'),
    );
    const port = this.config.get<number>('PORT') ?? 3001;
    this.publicBaseUrl = (
      this.config.get<string>('MEDIA_PUBLIC_BASE_URL') ||
      `http://localhost:${port}`
    ).replace(/\/$/, '');
  }

  async saveCatalogImage(file: UploadedImageFile) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Choose an image to upload.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Product images must be 5 MB or smaller.');
    }

    const extension = MIME_EXTENSIONS[file.mimetype];
    if (!extension || !this.matchesImageSignature(file.buffer, file.mimetype)) {
      throw new BadRequestException('Only valid JPG, PNG, or WebP images are allowed.');
    }

    const directory = resolve(this.root, 'catalog');
    await mkdir(directory, { recursive: true });
    const key = `catalog/${randomUUID()}${extension}`;
    await writeFile(resolve(this.root, key), file.buffer, { flag: 'wx' });

    return {
      key,
      url: `${this.publicBaseUrl}/media/${key}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async readPublicFile(key: string) {
    const safeKey = this.safeKey(key);
    return readFile(resolve(this.root, safeKey));
  }

  async deleteOwnedUrl(url: string | null | undefined) {
    const prefix = `${this.publicBaseUrl}/media/`;
    if (!url?.startsWith(prefix)) return false;
    const key = this.safeKey(url.slice(prefix.length));
    try {
      await unlink(resolve(this.root, key));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }

  contentTypeForKey(key: string) {
    const extension = extname(key).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    throw new BadRequestException('Unsupported media type.');
  }

  private safeKey(key: string) {
    const normalized = key.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!/^catalog\/[a-f0-9-]+\.(?:jpg|png|webp)$/i.test(normalized)) {
      throw new BadRequestException('Invalid media path.');
    }
    return normalized;
  }

  private matchesImageSignature(buffer: Buffer, mimeType: string) {
    if (mimeType === 'image/jpeg') {
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimeType === 'image/png') {
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (mimeType === 'image/webp') {
      return buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    }
    return false;
  }
}

import { BadRequestException, Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { PushPlatform } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushNotificationsService } from './push-notifications.service';

@Controller('notifications/devices')
@UseGuards(JwtAuthGuard)
export class PushDevicesController {
  constructor(private readonly push: PushNotificationsService) {}
  @Post()
  register(@CurrentUser() user: AuthenticatedUser, @Body() body: { token?: string; platform?: PushPlatform }) {
    if (!body.token || !body.platform || !Object.values(PushPlatform).includes(body.platform)) throw new BadRequestException('Valid token and platform are required.');
    return this.push.registerDevice(user.id, body.token, body.platform);
  }
  @Delete()
  unregister(@CurrentUser() user: AuthenticatedUser, @Body() body: { token?: string }) {
    if (!body.token) return { success: true };
    return this.push.unregisterDevice(user.id, body.token);
  }
}

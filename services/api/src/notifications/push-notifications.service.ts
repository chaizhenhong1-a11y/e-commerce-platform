import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushPlatform } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async registerDevice(userId: string, token: string, platform: PushPlatform) {
    const clean = token.trim();
    if (!clean) throw new Error('Push token is required.');
    return this.prisma.pushDevice.upsert({
      where: { token: clean },
      create: { userId, token: clean, platform },
      update: { userId, platform, enabled: true, lastSeenAt: new Date() },
      select: { id: true, platform: true, enabled: true },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    await this.prisma.pushDevice.updateMany({ where: { userId, token }, data: { enabled: false } });
    return { success: true };
  }

  async deliver(input: { userId: string; eventKey: string; title: string; message: string; actionPath?: string; orderNumber?: string }) {
    if (!this.config.get<boolean>('PUSH_ENABLED')) return;
    const devices = await this.prisma.pushDevice.findMany({ where: { userId: input.userId, enabled: true } });
    await Promise.allSettled(devices.map((device) => this.deliverToDevice(device, input)));
  }

  private async deliverToDevice(device: { id: string; token: string; userId: string }, input: { userId: string; eventKey: string; title: string; message: string; actionPath?: string; orderNumber?: string }) {
    const existing = await this.prisma.pushDelivery.findUnique({
      where: { eventKey_deviceId: { eventKey: input.eventKey, deviceId: device.id } },
    });
    if (existing?.status === 'SENT' || existing?.status === 'PENDING') return;

    const delivery = existing
      ? await this.prisma.pushDelivery.update({ where: { id: existing.id }, data: { status: 'PENDING', errorMessage: null } })
      : await this.prisma.pushDelivery.create({ data: { userId: input.userId, eventKey: input.eventKey, deviceId: device.id } });

    try {
      const mode = (this.config.get<string>('PUSH_DELIVERY_MODE') ?? 'CONSOLE').toUpperCase();
      if (mode === 'CONSOLE') {
        this.logger.log(`[push:${input.eventKey}] ${input.title} -> ${device.id}`);
      } else if (mode === 'FCM') {
        await this.sendFcm(device.token, input);
      } else {
        throw new Error(`Unsupported PUSH_DELIVERY_MODE: ${mode}`);
      }
      await this.prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: 'SENT', sentAt: new Date() } });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: 'FAILED', errorMessage: message.slice(0, 1000) } });
      this.logger.error(`Push delivery failed for ${input.eventKey}: ${message}`);
    }
  }

  private async sendFcm(token: string, input: { title: string; message: string; actionPath?: string; orderNumber?: string }) {
    const projectId = this.config.get<string>('FCM_PROJECT_ID');
    if (!projectId) throw new Error('Missing FCM_PROJECT_ID');
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
    const client = await auth.getClient();
    const access = await client.getAccessToken();
    if (!access.token) throw new Error('Unable to obtain FCM access token');
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, notification: { title: input.title, body: input.message }, data: { actionPath: input.actionPath ?? '/notifications', orderNumber: input.orderNumber ?? '' } } }),
    });
    if (!response.ok) {
      const body = await response.text();
      if (response.status === 404 || response.status === 400) {
        await this.prisma.pushDevice.updateMany({ where: { token }, data: { enabled: false } });
      }
      throw new Error(`FCM ${response.status}: ${body.slice(0, 500)}`);
    }
  }
}

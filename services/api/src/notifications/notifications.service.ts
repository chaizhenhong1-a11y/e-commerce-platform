import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionalEmailService } from './transactional-email.service';
import { PushNotificationsService } from './push-notifications.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: TransactionalEmailService,
    private readonly push: PushNotificationsService,
  ) {}

  async create(input: {
    userId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    orderNumber?: string;
    actionPath?: string;
    eventKey?: string;
  }) {
    if (!input.userId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, email: true, firstName: true },
    });
    if (!user) return null;

    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        orderNumber: input.orderNumber,
        actionPath: input.actionPath,
      },
    });

    const eventKey = input.eventKey ?? `notification:${notification.id}`;
    void this.email.deliver({
      userId: user.id,
      notificationId: notification.id,
      eventKey,
      to: user.email,
      firstName: user.firstName,
      subject: input.title,
      message: input.message,
      actionPath: input.actionPath,
    }).catch(() => undefined);
    void this.push.deliver({
      userId: user.id, eventKey, title: input.title, message: input.message, actionPath: input.actionPath, orderNumber: input.orderNumber,
    }).catch(() => undefined);
    return notification;
  }

  async list(userId: string) {
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { unreadCount, items };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

type OrderAccessTarget = {
  id: string;
  orderNumber: string;
  userId: string | null;
};

@Injectable()
export class OrderAccessService {
  constructor(private readonly configService: ConfigService) {}

  issueGuestToken(order: OrderAccessTarget): string | null {
    if (order.userId) {
      return null;
    }

    return this.sign(order);
  }

  assertCanAccess(
    order: OrderAccessTarget,
    userId?: string,
    guestToken?: string,
  ) {
    if (order.userId) {
      if (userId === order.userId) {
        return;
      }

      throw new NotFoundException('Order not found.');
    }

    if (!guestToken || !this.verify(order, guestToken)) {
      throw new NotFoundException('Order not found.');
    }
  }

  private verify(order: OrderAccessTarget, token: string) {
    const expected = Buffer.from(this.sign(order));
    const received = Buffer.from(token);

    return (
      expected.length === received.length &&
      timingSafeEqual(expected, received)
    );
  }

  private sign(order: OrderAccessTarget) {
    const secret = this.configService.getOrThrow<string>(
      'ORDER_ACCESS_SECRET',
    );

    return createHmac('sha256', secret)
      .update(`guest-order:v1:${order.id}:${order.orderNumber}`)
      .digest('base64url');
  }
}

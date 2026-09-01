import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  ReturnDisposition,
  ReturnItemCondition,
  ReturnReason,
  ReturnStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RefundsService } from '../refunds/refunds.service';

type ReturnItemInput = {
  orderItemId: string;
  quantity: number;
};

type InspectReturnItemInput = {
  returnItemId: string;
  condition: ReturnItemCondition;
  disposition: ReturnDisposition;
};

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refundsService: RefundsService,
  ) {}

  async request(
    orderNumber: string,
    reason: string,
    note: string | undefined,
    items: ReturnItemInput[],
    userId?: string,
  ) {
    if (!userId) {
      throw new ForbiddenException(
        'Sign in to request a return for a fulfilled order.',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        returnRequests: {
          where: {
            status: {
              notIn: [ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
            },
          },
          include: { items: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found.');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('This order does not belong to your account.');
    }
    if (!['DELIVERED', 'FULFILLED'].includes(order.status)) {
      throw new BadRequestException(
        'Returns can only be requested after an order is fulfilled.',
      );
    }
    if (
      order.paymentStatus !== PaymentStatus.PAID &&
      order.paymentStatus !== PaymentStatus.PARTIALLY_REFUNDED
    ) {
      throw new BadRequestException(
        'This order is not eligible for a return in its current payment state.',
      );
    }
    if (
      order.returnRequests.some((request) =>
        (
          [
            ReturnStatus.REQUESTED,
            ReturnStatus.APPROVED,
            ReturnStatus.IN_TRANSIT,
            ReturnStatus.RECEIVED,
          ] as ReturnStatus[]
        ).includes(request.status),
      )
   ) {
      throw new BadRequestException(
        'An active return already exists for this order.',
      );
    }

    const alreadyCommitted = new Map<string, number>();
    for (const request of order.returnRequests) {
      for (const item of request.items) {
        alreadyCommitted.set(
          item.orderItemId,
          (alreadyCommitted.get(item.orderItemId) ?? 0) + item.quantity,
        );
      }
    }

    const requestedIds = new Set<string>();
    const normalizedItems = items.map((requested) => {
      if (requestedIds.has(requested.orderItemId)) {
        throw new BadRequestException(
          'Each order item can only appear once in a return request.',
        );
      }
      requestedIds.add(requested.orderItemId);

      const orderItem = order.items.find(
        (item) => item.id === requested.orderItemId,
      );
      if (!orderItem) {
        throw new BadRequestException(
          'A selected return item does not belong to this order.',
        );
      }

      const remainingQuantity =
        orderItem.quantity - (alreadyCommitted.get(orderItem.id) ?? 0);
      if (requested.quantity > remainingQuantity) {
        throw new BadRequestException(
          `Return quantity exceeds the remaining returnable quantity for ${orderItem.productName}.`,
        );
      }

      return {
        orderItemId: orderItem.id,
        quantity: requested.quantity,
      };
    });

    return this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        status: ReturnStatus.REQUESTED,
        reason: reason as ReturnReason,
        customerNote: note?.trim() || null,
        items: {
          create: normalizedItems,
        },
      },
      include: {
        items: {
          include: { orderItem: true },
        },
      },
    });
  }

  async cancel(orderNumber: string, returnId: string, userId?: string) {
    if (!userId) {
      throw new ForbiddenException('Sign in to manage this return.');
    }

    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { order: true },
    });

    if (!request || request.order.orderNumber !== orderNumber) {
      throw new NotFoundException('Return request not found.');
    }
    if (request.order.userId !== userId) {
      throw new ForbiddenException('This return does not belong to your account.');
    }
    if (request.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException(
        'Only a return that is still awaiting review can be cancelled.',
      );
    }

    return this.prisma.returnRequest.update({
      where: { id: request.id },
      data: { status: ReturnStatus.CANCELLED },
    });
  }

  async listForStaff(status?: ReturnStatus) {
    if (status && !Object.values(ReturnStatus).includes(status)) {
      throw new BadRequestException('Unknown return status filter.');
    }

    return this.prisma.returnRequest.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            email: true,
            currency: true,
            totalCents: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
        items: {
          include: { orderItem: true },
          orderBy: { createdAt: 'asc' },
        },
        refund: true,
      },
    });
  }

  async getForStaff(returnId: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: {
            payments: {
              where: {
                status: {
                  in: [
                    PaymentStatus.PAID,
                    PaymentStatus.PARTIALLY_REFUNDED,
                    PaymentStatus.REFUNDED,
                  ],
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        items: {
          include: { orderItem: true },
          orderBy: { createdAt: 'asc' },
        },
        refund: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Return request not found.');
    }
    return request;
  }

  async approve(returnId: string, note?: string) {
    const request = await this.getForStaff(returnId);
    this.assertStatus(request.status, ReturnStatus.REQUESTED);

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.APPROVED,
        approvedAt: new Date(),
        staffNote: note?.trim() || null,
      },
    });
  }

  async reject(returnId: string, note?: string) {
    const request = await this.getForStaff(returnId);
    this.assertStatus(request.status, ReturnStatus.REQUESTED);

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.REJECTED,
        staffNote: note?.trim() || null,
      },
    });
  }

  async markInTransit(returnId: string) {
    const request = await this.getForStaff(returnId);
    this.assertStatus(request.status, ReturnStatus.APPROVED);

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: { status: ReturnStatus.IN_TRANSIT },
    });
  }

  async receive(returnId: string) {
    const request = await this.getForStaff(returnId);
    if (
      request.status !== ReturnStatus.APPROVED &&
      request.status !== ReturnStatus.IN_TRANSIT
    ) {
      throw new BadRequestException(
        'Only approved or in-transit returns can be received.',
      );
    }

    return this.prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: ReturnStatus.RECEIVED,
        receivedAt: new Date(),
      },
    });
  }

  async inspect(returnId: string, items: InspectReturnItemInput[]) {
    const request = await this.getForStaff(returnId);
    this.assertStatus(request.status, ReturnStatus.RECEIVED);

    const expectedIds = new Set(request.items.map((item) => item.id));
    const suppliedIds = new Set(items.map((item) => item.returnItemId));
    if (
      suppliedIds.size !== expectedIds.size ||
      [...expectedIds].some((id) => !suppliedIds.has(id))
    ) {
      throw new BadRequestException(
        'Every returned item must be inspected before completion.',
      );
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.returnItem.update({
          where: { id: item.returnItemId },
          data: {
            condition: item.condition,
            disposition: item.disposition,
            inspectedAt: new Date(),
          },
        }),
      ),
    );

    return this.getForStaff(returnId);
  }

  async complete(returnId: string) {
    const request = await this.getForStaff(returnId);
    this.assertStatus(request.status, ReturnStatus.RECEIVED);

    if (
      request.items.some(
        (item) => !item.condition || !item.disposition || !item.inspectedAt,
      )
    ) {
      throw new BadRequestException(
        'Inspect every return item and choose a disposition before completion.',
      );
    }

    const refund =
      request.refund ?? (await this.refundsService.issueForReturn(returnId));

    const refreshedRefund = await this.prisma.refund.findUnique({
      where: { id: refund.id },
    });
    if (!refreshedRefund || refreshedRefund.status !== 'REFUNDED') {
      return {
        status: ReturnStatus.RECEIVED,
        refundStatus: refreshedRefund?.status ?? refund.status,
        message:
          'Refund is still processing. Complete the return after the provider confirms it.',
      };
    }

    return this.prisma.$transaction(
      async (tx) => {
        const locked = await tx.returnRequest.findUnique({
          where: { id: returnId },
          include: {
            items: {
              include: { orderItem: true },
            },
          },
        });
        if (!locked) throw new NotFoundException('Return request not found.');
        if (locked.status === ReturnStatus.COMPLETED) return locked;
        this.assertStatus(locked.status, ReturnStatus.RECEIVED);

        for (const item of locked.items) {
          if (
            item.disposition === ReturnDisposition.RESTOCK &&
            !item.restockedAt
          ) {
            const inventory = await tx.inventory.findUnique({
              where: { variantId: item.orderItem.variantId },
            });
            if (!inventory) {
              throw new BadRequestException(
                `Inventory record is missing for ${item.orderItem.productName}.`,
              );
            }

            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { increment: item.quantity } },
            });
            await tx.returnItem.update({
              where: { id: item.id },
              data: { restockedAt: new Date() },
            });
          }
        }

        return tx.returnRequest.update({
          where: { id: returnId },
          data: {
            status: ReturnStatus.COMPLETED,
            completedAt: new Date(),
          },
          include: {
            items: { include: { orderItem: true } },
            refund: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private assertStatus(actual: ReturnStatus, expected: ReturnStatus) {
    if (actual !== expected) {
      throw new BadRequestException(
        `Return must be ${expected} before this action can be performed.`,
      );
    }
  }
}

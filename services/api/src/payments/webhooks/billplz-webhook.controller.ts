import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { PaymentsService } from '../payments.service';
import { BillplzPaymentProvider } from '../providers/billplz.provider';

type BillplzCallback = Record<string, string | undefined> & {
  id?: string;
  paid?: string;
  state?: string;
  amount?: string;
  x_signature?: string;
};

@Controller('payments/webhooks/billplz')
export class BillplzWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly billplzProvider: BillplzPaymentProvider,
  ) {}

  @Post()
  async handle(@Body() body: BillplzCallback) {
    this.verifySignature(body);

    const providerRef = body.id?.trim();
    const amountCents = Number(body.amount);
    const paid = body.paid === 'true' && body.state === 'paid';

    if (!providerRef || !Number.isInteger(amountCents) || amountCents < 1) {
      throw new BadRequestException('Invalid Billplz callback payload.');
    }

    await this.paymentsService.confirmBillplzCallback(providerRef, amountCents, paid);
    return { received: true };
  }

  private verifySignature(body: BillplzCallback) {
    const supplied = body.x_signature?.trim().toLowerCase();
    if (!supplied || !/^[a-f0-9]{64}$/.test(supplied)) {
      throw new BadRequestException('Missing or invalid Billplz X Signature.');
    }

    const source = Object.entries(body)
      .filter(([key]) => key !== 'x_signature')
      .map(([key, value]) => `${key}${value ?? ''}`)
      .sort((left, right) => left.toLowerCase().localeCompare(right.toLowerCase()))
      .join('|');

    const expected = createHmac('sha256', this.billplzProvider.getXSignatureKey())
      .update(source)
      .digest('hex');

    const suppliedBuffer = Buffer.from(supplied, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      throw new BadRequestException('Billplz X Signature verification failed.');
    }
  }
}

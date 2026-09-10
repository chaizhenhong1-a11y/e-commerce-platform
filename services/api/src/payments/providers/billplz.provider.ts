import {
  BadRequestException,
  Injectable,
  NotImplementedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import {
  PaymentProviderAdapter,
  PaymentRefundRequest,
  PaymentRefundResult,
  PaymentSessionRequest,
  PaymentSessionResult,
  PaymentSessionResumeResult,
} from './payment-provider';

type BillplzBill = {
  id: string;
  url: string;
  paid: boolean;
  state: 'due' | 'paid' | 'deleted';
  amount: number;
};

@Injectable()
export class BillplzPaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.BILLPLZ;

  constructor(private readonly configService: ConfigService) {}

  async createSession(request: PaymentSessionRequest): Promise<PaymentSessionResult> {
    if (request.currency.toUpperCase() !== 'MYR') {
      throw new BadRequestException('Billplz FPX only supports MYR payments.');
    }

    const apiBaseUrl = this.getApiBaseUrl();
    const callbackBaseUrl = this.getCallbackBaseUrl();
    const storefrontUrl = this.configService.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000';
    const collectionId = this.requireConfig('BILLPLZ_COLLECTION_ID');

    const body = new URLSearchParams({
      collection_id: collectionId,
      email: request.customerEmail,
      name: request.customerName,
      amount: String(request.amountCents),
      description: `Elvane order ${request.orderNumber}`,
      callback_url: `${callbackBaseUrl}/payments/webhooks/billplz`,
      redirect_url: `${storefrontUrl}/orders/${encodeURIComponent(request.orderNumber)}?payment=return`,
      reference_1_label: 'Order',
      reference_1: request.orderNumber,
      reference_2_label: 'Payment',
      reference_2: request.paymentId,
      deliver: 'false',
    });

    const response = await fetch(`${apiBaseUrl}/v3/bills`, {
      method: 'POST',
      headers: {
        Authorization: this.getAuthorizationHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    });

    const bill = await this.readBillResponse(response, 'create');

    return {
      provider: this.provider,
      providerRef: bill.id,
      checkoutUrl: bill.url,
      metadata: {
        billplzBillId: bill.id,
        billplzMode: this.getMode(),
      },
    };
  }

  async resumeSession(providerRef: string): Promise<PaymentSessionResumeResult> {
    const bill = await this.getBill(providerRef);

    if (bill.paid || bill.state === 'paid') {
      return { state: 'PAID', checkoutUrl: null };
    }

    if (bill.state === 'deleted') {
      return { state: 'EXPIRED', checkoutUrl: null };
    }

    return { state: 'OPEN', checkoutUrl: bill.url };
  }

  async cancelSession(providerRef: string): Promise<void> {
    const bill = await this.getBill(providerRef);
    if (bill.paid || bill.state !== 'due') return;

    const response = await fetch(`${this.getApiBaseUrl()}/v3/bills/${encodeURIComponent(providerRef)}`, {
      method: 'DELETE',
      headers: {
        Authorization: this.getAuthorizationHeader(),
        Accept: 'application/json',
      },
    });

    if (!response.ok && response.status !== 404 && response.status !== 422) {
      throw new ServiceUnavailableException('Unable to cancel the Billplz payment session.');
    }
  }

  async refund(_request: PaymentRefundRequest): Promise<PaymentRefundResult> {
    throw new NotImplementedException('Billplz refunds are not enabled in Elvane yet.');
  }

  getXSignatureKey(): string {
    return this.requireConfig('BILLPLZ_X_SIGNATURE_KEY');
  }

  private async getBill(providerRef: string): Promise<BillplzBill> {
    const response = await fetch(`${this.getApiBaseUrl()}/v3/bills/${encodeURIComponent(providerRef)}`, {
      headers: {
        Authorization: this.getAuthorizationHeader(),
        Accept: 'application/json',
      },
    });
    return this.readBillResponse(response, 'retrieve');
  }

  private async readBillResponse(response: Response, action: string): Promise<BillplzBill> {
    const body = (await response.json().catch(() => null)) as Partial<BillplzBill> & { error?: unknown } | null;
    if (!response.ok || !body?.id || !body.url) {
      throw new ServiceUnavailableException(`Billplz could not ${action} the payment bill.`);
    }
    return body as BillplzBill;
  }

  private getAuthorizationHeader(): string {
    const secret = this.requireConfig('BILLPLZ_SECRET_KEY');
    return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
  }

  private getApiBaseUrl(): string {
    return this.getMode() === 'LIVE'
      ? 'https://www.billplz.com/api'
      : 'https://www.billplz-sandbox.com/api';
  }

  private getCallbackBaseUrl(): string {
    const value = this.requireConfig('BILLPLZ_CALLBACK_BASE_URL');
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') throw new Error();
      return url.toString().replace(/\/$/, '');
    } catch {
      throw new ServiceUnavailableException('BILLPLZ_CALLBACK_BASE_URL must be a public HTTPS URL.');
    }
  }

  private getMode(): 'SANDBOX' | 'LIVE' {
    const mode = (this.configService.get<string>('BILLPLZ_MODE') ?? 'SANDBOX').toUpperCase();
    if (mode !== 'SANDBOX' && mode !== 'LIVE') {
      throw new ServiceUnavailableException('BILLPLZ_MODE must be SANDBOX or LIVE.');
    }
    return mode;
  }

  private requireConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();
    if (!value) throw new ServiceUnavailableException(`${key} is not configured.`);
    return value;
  }
}

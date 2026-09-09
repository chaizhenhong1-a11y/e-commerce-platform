import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StaffAuthGuard } from '../auth/guards/staff-auth.guard';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ManualTestPaymentProvider } from './providers/manual-test.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { StripePaymentProvider } from './providers/stripe.provider';
import { BillplzPaymentProvider } from './providers/billplz.provider';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';
import { BillplzWebhookController } from './webhooks/billplz-webhook.controller';
import { RefundsController } from './refunds/refunds.controller';
import { StaffRefundsController } from './refunds/staff-refunds.controller';
import { RefundsService } from './refunds/refunds.service';
import { ReturnsController } from './returns/returns.controller';
import { StaffReturnsController } from './returns/staff-returns.controller';
import { ReturnsService } from './returns/returns.service';

@Module({
  imports: [PrismaModule, AuthModule, OrdersModule],
  controllers: [
    PaymentsController,
    StripeWebhookController,
    BillplzWebhookController,
    RefundsController,
    StaffRefundsController,
    ReturnsController,
    StaffReturnsController,
  ],
  providers: [
    PaymentsService,
    ManualTestPaymentProvider,
    StripePaymentProvider,
    BillplzPaymentProvider,
    PaymentProviderRegistry,
    RefundsService,
    ReturnsService,
    StaffAuthGuard,
  ],
})
export class PaymentsModule {}

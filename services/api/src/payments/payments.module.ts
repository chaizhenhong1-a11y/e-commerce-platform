import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { ManualTestPaymentProvider } from './providers/manual-test.provider';
import { PaymentProviderRegistry } from './providers/payment-provider.registry';
import { StripePaymentProvider } from './providers/stripe.provider';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';

@Module({
  imports: [PrismaModule, AuthModule, OrdersModule],
  controllers: [
    PaymentsController,
    StripeWebhookController,
  ],
  providers: [
    PaymentsService,
    ManualTestPaymentProvider,
    StripePaymentProvider,
    PaymentProviderRegistry,
  ],
})
export class PaymentsModule {}

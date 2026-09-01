import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { CheckoutModule } from './checkout/checkout.module';
import {
  resolveApiEnvFiles,
  validateEnvironment,
} from './config/environment';
import { CustomersModule } from './customers/customers.module';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PromotionsModule } from './promotions/promotions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveApiEnvFiles(),
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    NotificationsModule,
    HealthModule,
    MediaModule,
    ProductsModule,
    CategoriesModule,
    PromotionsModule,
    CartModule,
    CustomersModule,
    CheckoutModule,
    PaymentsModule,
    ScheduleModule.forRoot(),
    OrdersModule,
    WishlistModule,
    ReviewsModule,
  ],
})
export class AppModule {}

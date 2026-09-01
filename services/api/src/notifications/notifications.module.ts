import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TransactionalEmailService } from './transactional-email.service';
import { PushNotificationsService } from './push-notifications.service';
import { PushDevicesController } from './push-devices.controller';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController, PushDevicesController],
  providers: [NotificationsService, TransactionalEmailService, PushNotificationsService],
  exports: [NotificationsService, TransactionalEmailService, PushNotificationsService],
})
export class NotificationsModule {}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AccountEmailService {
  private readonly logger = new Logger(AccountEmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmailVerification(input: {
    email: string;
    firstName: string;
    token: string;
  }) {
    const url = this.accountUrl('/account/verify-email', input.token);
    await this.deliver({
      to: input.email,
      subject: 'Verify your TextShop email',
      text: `Hi ${input.firstName}, verify your TextShop email: ${url}`,
      developmentUrl: url,
    });
  }

  async sendPasswordReset(input: {
    email: string;
    firstName: string;
    token: string;
  }) {
    const url = this.accountUrl('/account/reset-password', input.token);
    await this.deliver({
      to: input.email,
      subject: 'Reset your TextShop password',
      text: `Hi ${input.firstName}, reset your TextShop password: ${url}`,
      developmentUrl: url,
    });
  }

  private accountUrl(path: string, token: string) {
    const storefrontUrl =
      this.configService.get<string>('STOREFRONT_URL') ??
      'http://localhost:3000';
    const url = new URL(path, `${storefrontUrl.replace(/\/$/, '')}/`);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private async deliver(input: {
    to: string;
    subject: string;
    text: string;
    developmentUrl: string;
  }) {
    const mode =
      this.configService.get<string>('EMAIL_DELIVERY_MODE') ?? 'CONSOLE';

    if (mode === 'CONSOLE') {
      this.logger.log(`${input.subject} for ${input.to}: ${input.developmentUrl}`);
      return;
    }

    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT') ?? 587;
    const secure = this.configService.get<boolean>('SMTP_SECURE') ?? false;
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');
    const from = this.configService.getOrThrow<string>('EMAIL_FROM');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user && password ? { user, pass: password } : undefined,
    });

    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
  }
}

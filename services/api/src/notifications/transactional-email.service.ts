import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionalEmailService {
  private readonly logger = new Logger(TransactionalEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async deliver(input: {
    userId: string;
    notificationId?: string;
    eventKey: string;
    to: string;
    firstName?: string | null;
    subject: string;
    message: string;
    actionPath?: string | null;
  }) {
    const existing = await this.prisma.emailDelivery.findUnique({
      where: { eventKey: input.eventKey },
    });
    if (existing?.status === 'SENT' || existing?.status === 'PENDING') return existing;

    const delivery = existing ?? await this.prisma.emailDelivery.create({
      data: {
        userId: input.userId,
        notificationId: input.notificationId ?? null,
        eventKey: input.eventKey,
        toEmail: input.to,
        subject: input.subject,
      },
    });

    try {
      const storefront = (this.config.get<string>('STOREFRONT_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
      const actionUrl = input.actionPath ? `${storefront}${input.actionPath.startsWith('/') ? '' : '/'}${input.actionPath}` : storefront;
      const greeting = input.firstName?.trim() ? `Hi ${input.firstName.trim()},` : 'Hi,';
      const text = `${greeting}\n\n${input.message}\n\nView in TextShop: ${actionUrl}`;
      const html = `<!doctype html><html><body style="margin:0;background:#f6f7fb;font-family:Arial,sans-serif;color:#171717"><div style="max-width:600px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e7e7ee;border-radius:16px;padding:28px"><div style="font-size:22px;font-weight:700;margin-bottom:22px">TextShop</div><p>${this.escape(greeting)}</p><p style="line-height:1.6">${this.escape(input.message)}</p><p style="margin-top:28px"><a href="${this.escape(actionUrl)}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px">View update</a></p><p style="margin-top:28px;color:#6b7280;font-size:13px">This is a transactional message about your TextShop account or order.</p></div></div></body></html>`;

      const mode = this.config.get<string>('EMAIL_DELIVERY_MODE') ?? 'CONSOLE';
      if (mode === 'CONSOLE') {
        this.logger.log(`[email:${input.eventKey}] ${input.subject} -> ${input.to} | ${actionUrl}`);
      } else {
        const host = this.config.getOrThrow<string>('SMTP_HOST');
        const port = this.config.get<number>('SMTP_PORT') ?? 587;
        const secure = this.config.get<boolean>('SMTP_SECURE') ?? false;
        const user = this.config.get<string>('SMTP_USER');
        const password = this.config.get<string>('SMTP_PASSWORD');
        const from = this.config.getOrThrow<string>('EMAIL_FROM');
        const transporter = nodemailer.createTransport({
          host, port, secure, auth: user && password ? { user, pass: password } : undefined,
        });
        await transporter.sendMail({ from, to: input.to, subject: input.subject, text, html });
      }

      return this.prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: 'SENT', sentAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : 'Email delivery failed.';
      this.logger.error(`Transactional email failed for ${input.eventKey}: ${message}`);
      return this.prisma.emailDelivery.update({
        where: { id: delivery.id },
        data: { status: 'FAILED', errorMessage: message },
      });
    }
  }

  private escape(value: string) {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AccountTokenType, UserRole, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AccountEmailService } from './account-email.service';
import type { AccessTokenPayload, AuthenticatedUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_HASH_ROUNDS = 12;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const PASSWORD_RESET_TTL_MINUTES = 30;
const TOKEN_REQUEST_COOLDOWN_SECONDS = 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly accountEmailService: AccountEmailService,
  ) {}

  async register(input: RegisterDto, userAgent?: string) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('An account already exists for this email.');
    }

    const passwordHash = await hash(input.password, PASSWORD_HASH_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
      },
    });

    const verificationToken = await this.issueAccountToken(
      user.id,
      AccountTokenType.EMAIL_VERIFICATION,
      EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
      userAgent,
    );

    await this.accountEmailService.sendEmailVerification({
      email: user.email,
      firstName: user.firstName,
      token: verificationToken,
    });

    return this.createSession(user, userAgent);
  }

  async login(input: LoginDto, userAgent?: string) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !(await compare(input.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }

    return this.createSession(user, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Refresh session is invalid or expired.');
    }

    const nextRefreshToken = this.generateToken();
    const expiresAt = this.createRefreshExpiry();

    await this.prisma.$transaction([
      this.prisma.authSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.authSession.create({
        data: {
          userId: session.user.id,
          tokenHash: this.hashToken(nextRefreshToken),
          expiresAt,
          userAgent: userAgent?.slice(0, 500) || session.userAgent,
        },
      }),
    ]);

    return {
      user: this.toPublicUser(session.user),
      accessToken: await this.createAccessToken(session.user),
      refreshToken: nextRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.authSession.updateMany({
      where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async resendEmailVerification(userId: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is unavailable.');
    }
    if (user.emailVerifiedAt) {
      return { accepted: true, alreadyVerified: true };
    }

    const allowed = await this.canIssueToken(
      user.id,
      AccountTokenType.EMAIL_VERIFICATION,
    );
    if (!allowed) {
      return { accepted: true, alreadyVerified: false };
    }

    const token = await this.issueAccountToken(
      user.id,
      AccountTokenType.EMAIL_VERIFICATION,
      EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
      userAgent,
    );
    await this.accountEmailService.sendEmailVerification({
      email: user.email,
      firstName: user.firstName,
      token,
    });
    return { accepted: true, alreadyVerified: false };
  }

  async verifyEmail(token: string) {
    const tokenHash = this.hashToken(token);
    const now = new Date();
    const accountToken = await this.prisma.accountToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !accountToken ||
      accountToken.type !== AccountTokenType.EMAIL_VERIFICATION ||
      accountToken.consumedAt ||
      accountToken.expiresAt <= now ||
      accountToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new NotFoundException('Verification link is invalid or expired.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: accountToken.userId },
        data: { emailVerifiedAt: accountToken.user.emailVerifiedAt ?? now },
      }),
      this.prisma.accountToken.updateMany({
        where: {
          userId: accountToken.userId,
          type: AccountTokenType.EMAIL_VERIFICATION,
          consumedAt: null,
        },
        data: { consumedAt: now },
      }),
    ]);

    return { success: true };
  }

  async forgotPassword(emailInput: string, userAgent?: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return { accepted: true };
    }

    const allowed = await this.canIssueToken(
      user.id,
      AccountTokenType.PASSWORD_RESET,
    );
    if (!allowed) {
      return { accepted: true };
    }

    const token = await this.issueAccountToken(
      user.id,
      AccountTokenType.PASSWORD_RESET,
      PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
      userAgent,
    );
    await this.accountEmailService.sendPasswordReset({
      email: user.email,
      firstName: user.firstName,
      token,
    });

    return { accepted: true };
  }

  async resetPassword(input: ResetPasswordDto) {
    const tokenHash = this.hashToken(input.token);
    const now = new Date();
    const accountToken = await this.prisma.accountToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !accountToken ||
      accountToken.type !== AccountTokenType.PASSWORD_RESET ||
      accountToken.consumedAt ||
      accountToken.expiresAt <= now ||
      accountToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new NotFoundException('Password reset link is invalid or expired.');
    }

    const passwordHash = await hash(input.password, PASSWORD_HASH_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: accountToken.userId },
        data: { passwordHash },
      }),
      this.prisma.accountToken.updateMany({
        where: {
          userId: accountToken.userId,
          type: AccountTokenType.PASSWORD_RESET,
          consumedAt: null,
        },
        data: { consumedAt: now },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: accountToken.userId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);

    return { success: true };
  }

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is unavailable.');
    }
    return this.toPublicUser(user);
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        { secret: this.getJwtSecret() },
      );
      if (payload.type !== 'access' || !payload.sub) {
        throw new UnauthorizedException('Access token is invalid.');
      }
      return this.getAuthenticatedUser(payload.sub);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
  }

  private async canIssueToken(userId: string, type: AccountTokenType) {
    const since = new Date(Date.now() - TOKEN_REQUEST_COOLDOWN_SECONDS * 1000);
    const recent = await this.prisma.accountToken.findFirst({
      where: { userId, type, createdAt: { gte: since } },
      select: { id: true },
    });
    return !recent;
  }

  private async issueAccountToken(
    userId: string,
    type: AccountTokenType,
    ttlMs: number,
    userAgent?: string,
  ) {
    const rawToken = this.generateToken();
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.accountToken.updateMany({
        where: { userId, type, consumedAt: null },
        data: { consumedAt: now },
      }),
      this.prisma.accountToken.create({
        data: {
          userId,
          type,
          tokenHash: this.hashToken(rawToken),
          expiresAt: new Date(now.getTime() + ttlMs),
          userAgent: userAgent?.slice(0, 500) || null,
        },
      }),
    ]);
    return rawToken;
  }

  private async createSession(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string | null;
      emailVerifiedAt?: Date | null;
      role: UserRole;
    },
    userAgent?: string,
  ) {
    const refreshToken = this.generateToken();
    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.createRefreshExpiry(),
        userAgent: userAgent?.slice(0, 500) || null,
      },
    });
    return {
      user: this.toPublicUser(user),
      accessToken: await this.createAccessToken(user),
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private async createAccessToken(user: { id: string; email: string }) {
    return this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'access' } satisfies AccessTokenPayload,
      { secret: this.getJwtSecret(), expiresIn: ACCESS_TOKEN_TTL_SECONDS },
    );
  }

  private getJwtSecret() {
    const secret = this.configService.get<string>('AUTH_JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('AUTH_JWT_SECRET must be configured with at least 32 characters.');
    }
    return secret;
  }

  private generateToken() {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private createRefreshExpiry() {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    emailVerifiedAt?: Date | null;
    role: UserRole;
  }): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: Boolean(user.emailVerifiedAt),
      role: user.role,
    };
  }
}

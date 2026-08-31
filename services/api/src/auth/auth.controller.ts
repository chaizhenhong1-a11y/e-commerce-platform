import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.register(body, userAgent);
  }

  @Post('login')
  login(@Body() body: LoginDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.login(body, userAgent);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshDto, @Headers('user-agent') userAgent?: string) {
    return this.authService.refresh(body.refreshToken, userAgent);
  }

  @Post('logout')
  logout(@Body() body: RefreshDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Post('email/verify')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('email/resend')
  @UseGuards(JwtAuthGuard)
  resendEmailVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.resendEmailVerification(user.id, userAgent);
  }

  @Post('password/forgot')
  forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.forgotPassword(body.email, userAgent);
  }

  @Post('password/reset')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}

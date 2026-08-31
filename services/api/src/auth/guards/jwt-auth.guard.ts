import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();

    const token = this.readBearerToken(
      request.headers.authorization,
    );

    if (!token) {
      throw new UnauthorizedException(
        'Authentication is required.',
      );
    }

    request.user =
      await this.authService.verifyAccessToken(token);

    return true;
  }

  protected readBearerToken(
    authorization?: string,
  ): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');

    if (
      scheme?.toLowerCase() !== 'bearer' ||
      !token
    ) {
      return null;
    }

    return token;
  }
}

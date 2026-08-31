import {
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class OptionalJwtAuthGuard extends JwtAuthGuard {
  constructor(authService: AuthService) {
    super(authService);
  }

  override async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();

    const token = this.readBearerToken(
      request.headers.authorization,
    );

    if (!token) {
      return true;
    }

    return super.canActivate(context);
  }
}

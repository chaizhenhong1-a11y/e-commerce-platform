import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth.types';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class StaffAuthGuard implements CanActivate {
  constructor(private readonly jwtAuthGuard: JwtAuthGuard) {}

  async canActivate(context: ExecutionContext) {
    const authenticated = await this.jwtAuthGuard.canActivate(context);
    if (!authenticated) return false;

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>();
    const role = request.user?.role;

    if (role !== 'STAFF' && role !== 'ADMIN') {
      throw new ForbiddenException('Staff access is required.');
    }

    return true;
  }
}

import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/auth.types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestReturnDto } from './dto/request-return.dto';
import { ReturnsService } from './returns.service';

@Controller('orders/:orderNumber/returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  request(
    @Param('orderNumber') orderNumber: string,
    @Body() dto: RequestReturnDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.returnsService.request(
      orderNumber,
      dto.reason,
      dto.note,
      dto.items,
      user.id,
    );
  }

  @Post(':returnId/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('orderNumber') orderNumber: string,
    @Param('returnId') returnId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.returnsService.cancel(orderNumber, returnId, user.id);
  }
}

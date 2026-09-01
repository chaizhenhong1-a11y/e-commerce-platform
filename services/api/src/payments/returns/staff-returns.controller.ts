import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { ReturnStatus } from '@prisma/client';
import { StaffAuthGuard } from '../../auth/guards/staff-auth.guard';
import { InspectReturnDto } from './dto/inspect-return.dto';
import { ReviewReturnDto } from './dto/review-return.dto';
import { ReturnsService } from './returns.service';

@Controller('staff/returns')
@UseGuards(StaffAuthGuard)
export class StaffReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  list(@Query('status') status?: ReturnStatus) {
    return this.returnsService.listForStaff(status);
  }

  @Get(':returnId')
  get(@Param('returnId') returnId: string) {
    return this.returnsService.getForStaff(returnId);
  }

  @Post(':returnId/approve')
  approve(@Param('returnId') returnId: string, @Body() dto: ReviewReturnDto) {
    return this.returnsService.approve(returnId, dto.note);
  }

  @Post(':returnId/reject')
  reject(@Param('returnId') returnId: string, @Body() dto: ReviewReturnDto) {
    return this.returnsService.reject(returnId, dto.note);
  }

  @Post(':returnId/in-transit')
  markInTransit(@Param('returnId') returnId: string) {
    return this.returnsService.markInTransit(returnId);
  }

  @Post(':returnId/receive')
  receive(@Param('returnId') returnId: string) {
    return this.returnsService.receive(returnId);
  }

  @Post(':returnId/inspect')
  inspect(@Param('returnId') returnId: string, @Body() dto: InspectReturnDto) {
    return this.returnsService.inspect(returnId, dto.items);
  }

  @Post(':returnId/complete')
  complete(@Param('returnId') returnId: string) {
    return this.returnsService.complete(returnId);
  }
}

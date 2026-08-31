import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { UpsertReviewDto } from './dto/upsert-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  getProductReviews(
    @Param('productId') productId: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.reviewsService.getProductReviews(productId, user?.id);
  }

  @Post('product/:productId')
  @UseGuards(JwtAuthGuard)
  upsertReview(
    @Param('productId') productId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertReviewDto,
  ) {
    return this.reviewsService.upsertReview(user.id, productId, dto);
  }

  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  removeReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reviewsService.removeReview(user.id, reviewId);
  }
}

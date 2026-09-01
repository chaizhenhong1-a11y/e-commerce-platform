import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

type AddCartItemBody = {
  variantId: string;
  quantity: number;
};

type UpdateCartItemBody = {
  quantity: number;
};

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':sessionId')
  getCart(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.getOrCreate(sessionId, user.id);
  }

  @Post(':sessionId/items')
  addItem(
    @Param('sessionId') sessionId: string,
    @Body() body: AddCartItemBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.addItem(
      sessionId,
      body.variantId,
      body.quantity,
      user.id,
    );
  }

  @Patch(':sessionId/items/:itemId')
  updateItem(
    @Param('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpdateCartItemBody,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.updateItem(
      sessionId,
      itemId,
      body.quantity,
      user.id,
    );
  }

  @Delete(':sessionId/items/:itemId')
  removeItem(
    @Param('sessionId') sessionId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cartService.removeItem(
      sessionId,
      itemId,
      user.id,
    );
  }
}

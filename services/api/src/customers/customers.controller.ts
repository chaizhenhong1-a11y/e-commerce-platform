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
import { CustomersService } from './customers.service';
import {
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from './dto/address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('customers/me')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.customersService.updateProfile(user.id, body);
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.listAddresses(user.id);
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCustomerAddressDto,
  ) {
    return this.customersService.createAddress(user.id, body);
  }

  @Patch('addresses/:addressId')
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
    @Body() body: UpdateCustomerAddressDto,
  ) {
    return this.customersService.updateAddress(user.id, addressId, body);
  }

  @Post('addresses/:addressId/default')
  setDefaultAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.setDefaultAddress(user.id, addressId);
  }

  @Delete('addresses/:addressId')
  deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.deleteAddress(user.id, addressId);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerAddressDto, UpdateCustomerAddressDto } from './dto/address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const MAX_ADDRESSES = 10;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: input.firstName.trim(),
        lastName: input.lastName?.trim() || null,
      },
    });

    if (user.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('Account not found.');
    }

    return this.toProfile(user);
  }

  async listAddresses(userId: string) {
    return this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createAddress(userId: string, input: CreateCustomerAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const count = await tx.customerAddress.count({ where: { userId } });
      if (count >= MAX_ADDRESSES) {
        throw new BadRequestException(
          `You can save up to ${MAX_ADDRESSES} addresses.`,
        );
      }

      const shouldBeDefault = Boolean(input.isDefault) || count === 0;
      if (shouldBeDefault) {
        await tx.customerAddress.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: this.addressData(userId, input, shouldBeDefault),
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async updateAddress(
    userId: string,
    addressId: string,
    input: UpdateCustomerAddressDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findFirst({
        where: { id: addressId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Address not found.');
      }

      const shouldBeDefault = Boolean(input.isDefault) || existing.isDefault;
      if (shouldBeDefault) {
        await tx.customerAddress.updateMany({
          where: { userId, isDefault: true, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.update({
        where: { id: addressId },
        data: {
          ...this.addressFields(input),
          isDefault: shouldBeDefault,
        },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findFirst({
        where: { id: addressId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Address not found.');
      }

      await tx.customerAddress.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });

      return tx.customerAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async deleteAddress(userId: string, addressId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.customerAddress.findFirst({
        where: { id: addressId, userId },
      });
      if (!existing) {
        throw new NotFoundException('Address not found.');
      }

      await tx.customerAddress.delete({ where: { id: addressId } });

      if (existing.isDefault) {
        const replacement = await tx.customerAddress.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });
        if (replacement) {
          await tx.customerAddress.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }

      return { success: true };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  private addressData(
    userId: string,
    input: CreateCustomerAddressDto,
    isDefault: boolean,
  ) {
    return {
      userId,
      ...this.addressFields(input),
      isDefault,
    };
  }

  private addressFields(input: CreateCustomerAddressDto) {
    return {
      label: input.label.trim(),
      recipientName: input.recipientName.trim(),
      phone: input.phone.trim(),
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      state: input.state.trim(),
      postcode: input.postcode.trim(),
      countryCode: input.countryCode || 'MY',
    };
  }

  private toProfile(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }
}

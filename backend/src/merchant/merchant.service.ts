import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMerchantDto: CreateMerchantDto) {
    return this.prisma.merchant.create({
      data: createMerchantDto,
    });
  }

  async findAll() {
    return this.prisma.merchant.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { id },
    });
    if (!merchant) {
      throw new NotFoundException(`Merchant with ID ${id} not found`);
    }
    return merchant;
  }

  async update(id: string, updateMerchantDto: UpdateMerchantDto) {
    await this.findOne(id);
    return this.prisma.merchant.update({
      where: { id },
      data: updateMerchantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.merchant.delete({
      where: { id },
    });
  }
}

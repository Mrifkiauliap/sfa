import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentMethodService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.prisma.paymentMethod.create({
      data: createPaymentMethodDto,
    });
  }

  async findAll() {
    return this.prisma.paymentMethod.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`PaymentMethod with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async update(id: string, updatePaymentMethodDto: UpdatePaymentMethodDto) {
    await this.findOne(id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: updatePaymentMethodDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.paymentMethod.delete({
      where: { id },
    });
  }
}

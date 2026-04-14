import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payment Methods')
@Controller('payment-method')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @ApiOperation({ summary: 'Buat metode pembayaran baru' })
  @Post()
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @ApiOperation({ summary: 'Ambil semua data metode pembayaran' })
  @Get()
  findAll() {
    return this.paymentMethodService.findAll();
  }

  @ApiOperation({ summary: 'Ambil metode pembayaran berdasarkan ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentMethodService.findOne(id);
  }

  @ApiOperation({ summary: 'Update metode pembayaran' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePaymentMethodDto: UpdatePaymentMethodDto,
  ) {
    return this.paymentMethodService.update(id, updatePaymentMethodDto);
  }

  @ApiOperation({ summary: 'Hapus metode pembayaran' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentMethodService.remove(id);
  }
}

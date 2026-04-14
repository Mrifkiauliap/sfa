import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Simpan transaksi pengeluaran baru' })
  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @ApiOperation({ summary: 'Ambil semua transaksi' })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter spesifik 1 Mahasiswa',
  })
  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) return this.transactionService.findAllByUser(userId);
    return this.transactionService.findAll();
  }

  @ApiOperation({ summary: 'Ambil detail transaksi berdasarkan ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(id);
  }

  @ApiOperation({ summary: 'Update transaksi pengeluaran' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @ApiOperation({ summary: 'Hapus transaksi' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(id);
  }
}

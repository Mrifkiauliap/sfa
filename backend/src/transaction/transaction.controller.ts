import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';

@ApiTags('Transactions')
@Controller('transaction')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: 'Simpan transaksi pengeluaran baru' })
  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @ApiOperation({ summary: 'Ambil semua transaksi (dengan paginasi)' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = parseInt(page || '1');
    const l = parseInt(limit || '10');
    if (userId) return this.transactionService.findAllByUser(userId, p, l);
    return this.transactionService.findAll();
  }

  @ApiOperation({
    summary:
      'Ringkasan Dashboard: total bulan ini, breakdown kategori, transaksi terbaru',
  })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @Get('dashboard')
  getDashboardSummary(@Query('userId') userId: string) {
    return this.transactionService.getDashboardSummary(userId);
  }

  @ApiOperation({ summary: 'Cari transaksi via Semantic Web (SPARQL hybrid)' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Keyword pencarian (merchant / kategori)',
  })
  @ApiQuery({ name: 'userId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('search')
  search(
    @Query('q') keyword: string,
    @Query('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = parseInt(page || '1');
    const l = parseInt(limit || '10');
    return this.transactionService.searchTransactions(userId, keyword, p, l);
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

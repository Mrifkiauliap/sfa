import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    example: '11111111-2222-3333-4444-555555555555',
    description:
      'ID Mahasiswa (Nanti idealnya di-extract dari token JWT backend)',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    example: '11111111-2222-3333-4444-555555555555',
    description: 'ID Kategori Pengeluaran (Didapat dari GET /category)',
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    example: '11111111-2222-3333-4444-555555555555',
    description: 'ID Merchant (Didapat dari GET /merchant)',
  })
  @IsNotEmpty()
  @IsUUID()
  merchantId: string;

  @ApiProperty({
    example: '11111111-2222-3333-4444-555555555555',
    description: 'ID Metode Pembayaran (Didapat dari GET /payment-method)',
  })
  @IsNotEmpty()
  @IsUUID()
  paymentMethodId: string;

  @ApiProperty({ example: 25000, description: 'Nominal Total Pengeluaran' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    example: '2023-11-20T14:30:00Z',
    description: 'Tanggal & Waktu Transaksi (Opsional, Default Now)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 'Makan siang kantin bareng teman',
    description: 'Keterangan tambahan (Opsional)',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

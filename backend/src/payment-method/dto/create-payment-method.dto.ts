import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'QRIS', description: 'Nama metode pembayaran' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Dompet Digital e-Wallet',
    description: 'Deskripsi metode pembayaran',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

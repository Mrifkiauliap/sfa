import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMerchantDto {
  @ApiProperty({
    example: 'Kantin Fakultas',
    description: 'Nama merchant/tempat',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Tempat makan siang utama mahasiswa',
    description: 'Deskripsi merchant',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'Area Kampus',
    description: 'Lokasi merchant (untuk Knowledge Graph)',
  })
  @IsOptional()
  @IsString()
  location?: string;
}

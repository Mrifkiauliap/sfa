import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Makan & Minum',
    description: 'Nama kategori pengeluaran',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Kebutuhan makan harian',
    description: 'Deskripsi kategori',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

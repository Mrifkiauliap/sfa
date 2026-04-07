import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Username unik untuk login',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Nama lengkap mahasiswa',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  fullname: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password minimal 6 karakter',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Semester saat ini (1–14)',
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  semester?: number;

  @ApiPropertyOptional({
    example: 'Teknik Informatika',
    description: 'Program studi / jurusan mahasiswa',
  })
  @IsString()
  @IsOptional()
  major?: string;

  @ApiPropertyOptional({
    example: 1500000,
    description: 'Uang saku bulanan (dalam Rupiah)',
  })
  @IsNumber()
  @IsOptional()
  monthlyAllowance?: number;

  @ApiPropertyOptional({
    example: 'Kos',
    description: 'Tipe tempat tinggal: Kos | Asrama | Rumah',
    enum: ['Kos', 'Asrama', 'Rumah'],
  })
  @IsString()
  @IsOptional()
  residenceType?: string;
}

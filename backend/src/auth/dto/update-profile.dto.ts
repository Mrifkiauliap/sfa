import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'johndoe123' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semester?: number;

  @ApiPropertyOptional({ example: 'Teknik Komputer' })
  @IsOptional()
  @IsString()
  major?: string;

  @ApiPropertyOptional({ example: 'Kos' })
  @IsOptional()
  @IsString()
  residenceType?: string;
}

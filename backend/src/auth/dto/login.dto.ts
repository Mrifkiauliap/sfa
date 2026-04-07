import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Username akun yang terdaftar',
  })
  @IsString()
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password minimal 6 karakter',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}

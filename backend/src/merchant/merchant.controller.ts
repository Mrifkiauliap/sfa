import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Merchants')
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @ApiOperation({ summary: 'Buat merchant baru' })
  @Post()
  create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantService.create(createMerchantDto);
  }

  @ApiOperation({ summary: 'Ambil semua data merchant' })
  @Get()
  findAll() {
    return this.merchantService.findAll();
  }

  @ApiOperation({ summary: 'Ambil data merchant berdasarkan ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.merchantService.findOne(id);
  }

  @ApiOperation({ summary: 'Update merchant' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMerchantDto: UpdateMerchantDto,
  ) {
    return this.merchantService.update(id, updateMerchantDto);
  }

  @ApiOperation({ summary: 'Hapus merchant' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.merchantService.remove(id);
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RdfService } from './rdf.service';

@Controller('rdf')
@UseGuards(JwtAuthGuard)
export class RdfController {
  constructor(private readonly rdfService: RdfService) {}

  @Get('graph-data')
  async fetchGraphData() {
    return await this.rdfService.getGraphData();
  }
}

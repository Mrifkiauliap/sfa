import { Module } from '@nestjs/common';
import { RdfService } from './rdf.service';
import { RdfController } from './rdf.controller';

@Module({
  providers: [RdfService],
  exports: [RdfService],
  controllers: [RdfController], // Di-export agar TransactionService bisa memakai module ini
})
export class RdfModule {}

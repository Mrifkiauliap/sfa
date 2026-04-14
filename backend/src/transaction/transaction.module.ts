import { Module } from '@nestjs/common';
import { RdfModule } from '../rdf/rdf.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

@Module({
  imports: [RdfModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}

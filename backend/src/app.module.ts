import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { PrismaModule } from './prisma/prisma.module';
import { CategoryModule } from './category/category.module';
import { AuthModule } from './auth/auth.module';
import { winstonConfig } from './common/logger/winston.config';
import { MerchantModule } from './merchant/merchant.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { TransactionModule } from './transaction/transaction.module';
import { RdfModule } from './rdf/rdf.module';
import { AnalysisModule } from './analysis/analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    PrismaModule,
    AuthModule,
    CategoryModule,
    MerchantModule,
    PaymentMethodModule,
    TransactionModule,
    RdfModule,
    AnalysisModule,
  ],
})
export class AppModule {}

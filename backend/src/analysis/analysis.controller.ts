import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
@UseGuards(JwtAuthGuard)
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('apriori')
  async generateRules(
    @Request() req,
    @Body()
    body: {
      minSupport?: number;
      minConfidence?: number;
      basketPeriod?: 'weekly' | 'monthly';
    },
  ) {
    const userId = req.user.id;
    const result = await this.analysisService.generateAprioriRules(
      userId,
      body.minSupport ? body.minSupport / 100 : undefined,
      body.minConfidence ? body.minConfidence / 100 : undefined,
      body.basketPeriod,
    );
    return { data: result };
  }

  @Get('apriori')
  async getLatestRules(@Request() req) {
    const userId = req.user.id;
    const result = await this.analysisService.getLatestAprioriResult(userId);
    return { data: result };
  }

  @Get('history')
  async getHistory(@Request() req) {
    const userId = req.user.id;
    const results = await this.analysisService.getAnalysisHistory(userId);
    return { data: results };
  }

  @Get('apriori/graph-overlay')
  async getAprioriGraphOverlay(@Request() req) {
    const userId = req.user.id;
    const result = await this.analysisService.getAprioriGraphOverlay(userId);
    return { data: result };
  }
}

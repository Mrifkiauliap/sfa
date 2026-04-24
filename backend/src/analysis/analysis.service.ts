import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { PrismaService } from '../prisma/prisma.service';

dayjs.extend(isoWeek);

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main function to execute Apriori algorithm natively
   */
  async generateAprioriRules(
    userId: string,
    minSupport: number = 0.3,
    minConfidence: number = 0.5,
    basketPeriod: 'weekly' | 'monthly' = 'weekly',
  ) {
    this.logger.log(`Starting Apriori for User: ${userId} (${basketPeriod})`);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true, merchant: true, paymentMethod: true },
      orderBy: { date: 'asc' },
    });

    if (!transactions || transactions.length < 5) {
      throw new BadRequestException(
        'Data transaksi belum cukup (kurang dari 5). Perbanyak input transaksi untuk menghasilkan rekomendasi Apriori.',
      );
    }

    const basketsMap = new Map<string, Set<string>>();

    transactions.forEach((t) => {
      let periodKey = '';
      const d = dayjs(t.date);
      if (basketPeriod === 'weekly') {
        periodKey = `${d.year()}-W${d.isoWeek()}`;
      } else {
        periodKey = `${d.year()}-${d.format('MM')}`;
      }

      let basket = basketsMap.get(periodKey);
      if (!basket) {
        basket = new Set<string>();
        basketsMap.set(periodKey, basket);
      }

      if (t.category) basket.add(`Kategori: ${t.category.name}`);
      if (t.merchant) basket.add(`Tempat: ${t.merchant.name}`);
    });

    const baskets = Array.from(basketsMap.values()).map((set) =>
      Array.from(set),
    );
    const totalBaskets = baskets.length;

    this.logger.log(`Total Baskets terbentuk: ${totalBaskets}`);

    const countSupport = (itemset: string[]) => {
      let count = 0;
      for (const basket of baskets) {
        if (itemset.every((item) => basket.includes(item))) {
          count++;
        }
      }
      return count / totalBaskets;
    };

    const itemCounts = new Map<string, number>();
    baskets.forEach((basket) => {
      basket.forEach((item) => {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      });
    });

    const L1: string[] = [];
    itemCounts.forEach((count, item) => {
      const support = count / totalBaskets;
      if (support >= minSupport) {
        L1.push(item);
      }
    });

    const L2: string[][] = [];
    for (let i = 0; i < L1.length; i++) {
      for (let j = i + 1; j < L1.length; j++) {
        const pair = [L1[i], L1[j]];
        const support = countSupport(pair);
        if (support >= minSupport) {
          L2.push(pair);
        }
      }
    }

    const rules: any[] = [];
    L2.forEach((pair) => {
      const [itemA, itemB] = pair;
      const supportAB = countSupport(pair);

      const supportA = countSupport([itemA]);
      const confAB = supportAB / supportA;
      if (confAB >= minConfidence) {
        rules.push({
          antecedent: itemA,
          consequent: itemB,
          support: parseFloat((supportAB * 100).toFixed(2)),
          confidence: parseFloat((confAB * 100).toFixed(2)),
        });
      }

      const supportB = countSupport([itemB]);
      const confBA = supportAB / supportB;
      if (confBA >= minConfidence) {
        rules.push({
          antecedent: itemB,
          consequent: itemA,
          support: parseFloat((supportAB * 100).toFixed(2)),
          confidence: parseFloat((confBA * 100).toFixed(2)),
        });
      }
    });

    rules.sort((a, b) => b.confidence - a.confidence);

    const resultRecord = await this.prisma.analysisResult.create({
      data: {
        userId,
        resultType: 'APRIORI',
        data: {
          period: basketPeriod,
          totalBaskets,
          minSupport: minSupport * 100,
          minConfidence: minConfidence * 100,
          rules,
        },
      },
    });

    this.logger.log(`Apriori Rules Mined: ${rules.length} rules.`);
    return resultRecord;
  }

  /**
   * Mengambil hasil analisis terakhir
   */
  async getLatestAprioriResult(userId: string) {
    const result = await this.prisma.analysisResult.findFirst({
      where: { userId, resultType: 'APRIORI' },
      orderBy: { createdAt: 'desc' },
    });
    if (!result) {
      throw new NotFoundException('Tidak ada hasil analisis.');
    }
    return result;
  }

  /**
   * Mengambil semua riwayat hasil analisis Apriori user
   */
  async getAnalysisHistory(userId: string) {
    return this.prisma.analysisResult.findMany({
      where: { userId, resultType: 'APRIORI' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Mengambil hasil analisis Apriori terakhir dan memformatnya
   * sebagai edge-edge overlay untuk visualisasi Knowledge Graph.
   */
  async getAprioriGraphOverlay(userId: string) {
    const result = await this.prisma.analysisResult.findFirst({
      where: { userId, resultType: 'APRIORI' },
      orderBy: { createdAt: 'desc' },
    });

    if (!result) {
      return { overlayEdges: [], meta: null };
    }

    const data = result.data as any;
    const rules: any[] = data?.rules ?? [];
    const sfaNs = 'http://student-finance-analyzer.com/ontology#';

    const categoryNames = new Set<string>();
    const merchantNames = new Set<string>();

    rules.forEach((rule: any) => {
      [rule.antecedent, rule.consequent].forEach((item: string) => {
        if (item.startsWith('Kategori: '))
          categoryNames.add(item.replace('Kategori: ', ''));
        if (item.startsWith('Tempat: '))
          merchantNames.add(item.replace('Tempat: ', ''));
      });
    });

    const [cats, merchants] = await Promise.all([
      categoryNames.size > 0
        ? this.prisma.category.findMany({
            where: { name: { in: Array.from(categoryNames) } },
            select: { id: true, name: true },
          })
        : [],
      merchantNames.size > 0
        ? this.prisma.merchant.findMany({
            where: { name: { in: Array.from(merchantNames) } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const nameToNodeId = new Map<string, string>();
    (cats as { id: string; name: string }[]).forEach((c) =>
      nameToNodeId.set(`Kategori: ${c.name}`, `${sfaNs}Category_${c.id}`),
    );
    (merchants as { id: string; name: string }[]).forEach((m) =>
      nameToNodeId.set(`Tempat: ${m.name}`, `${sfaNs}Merchant_${m.id}`),
    );

    const overlayEdges = rules
      .map((rule: any, idx: number) => {
        const fromNodeId = nameToNodeId.get(rule.antecedent);
        const toNodeId = nameToNodeId.get(rule.consequent);
        if (!fromNodeId || !toNodeId) return null;
        return {
          id: `apriori_edge_${idx}`,
          antecedentLabel: rule.antecedent,
          consequentLabel: rule.consequent,
          fromNodeId,
          toNodeId,
          confidence: rule.confidence,
          support: rule.support,
        };
      })
      .filter(Boolean);

    return {
      overlayEdges,
      meta: {
        totalRules: rules.length,
        resolvedEdges: overlayEdges.length,
        period: data?.period,
        minSupport: data?.minSupport,
        minConfidence: data?.minConfidence,
        generatedAt: result.createdAt,
      },
    };
  }
}

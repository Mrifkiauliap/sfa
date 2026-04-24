import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RdfService } from '../rdf/rdf.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rdfService: RdfService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { date, ...rest } = createTransactionDto;
    const transaction = await this.prisma.transaction.create({
      data: {
        ...rest,
        ...(date && { date: new Date(date) }),
      },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
      },
    });

    this.rdfService.pushTransactionToKG(transaction);
    return transaction;
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
        user: { select: { id: true, fullname: true, username: true } },
      },
    });
  }

  async findAllByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          category: true,
          merchant: true,
          paymentMethod: true,
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Dashboard Summary: kalkulasi agregat di sisi server.
   */
  async getDashboardSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [thisMonthTxns, lastMonthTxns, recentTxns] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth } },
        select: {
          amount: true,
          category: { select: { id: true, name: true } },
        },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true, merchant: true, paymentMethod: true },
      }),
    ]);

    const totalThisMonth = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);

    const categoryMap = new Map<string, { name: string; total: number }>();
    for (const t of thisMonthTxns) {
      if (!t.category) continue;
      const key = t.category.id;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name: t.category.name, total: 0 });
      }
      categoryMap.get(key)!.total += t.amount;
    }

    const categoryBreakdown = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .map((c) => ({
        ...c,
        percentage:
          totalThisMonth > 0 ? Math.round((c.total / totalThisMonth) * 100) : 0,
      }));

    return {
      totalThisMonth,
      totalLastMonth: lastMonthTxns._sum.amount ?? 0,
      categoryBreakdown,
      recentTransactions: recentTxns,
    };
  }

  /**
   * Smart Semantic Search (NLP + SPARQL + Prisma)
   */
  async searchTransactions(
    userId: string,
    keyword: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const { NlpUtil } = require('../common/utils/nlp.util');
    const parsedQuery = NlpUtil.parseQuery(keyword);

    const kwFilter = parsedQuery.tokens.map((t: string) => ({
      name: { contains: t, mode: 'insensitive' },
    }));
    const orKwFilter = kwFilter.length > 0 ? { OR: kwFilter } : {};

    const [
      matchedCategories,
      matchedMerchants,
      matchedPayments,
      descriptionMatches,
    ] = await Promise.all([
      kwFilter.length > 0
        ? this.prisma.category.findMany({
            where: orKwFilter,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      kwFilter.length > 0
        ? this.prisma.merchant.findMany({
            where: {
              OR: [
                ...kwFilter,
                ...parsedQuery.tokens.map((t: string) => ({
                  location: { contains: t, mode: 'insensitive' },
                })),
              ],
            },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      kwFilter.length > 0
        ? this.prisma.paymentMethod.findMany({
            where: orKwFilter,
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      parsedQuery.tokens.length > 0
        ? this.prisma.transaction.findMany({
            where: {
              userId,
              OR: parsedQuery.tokens.map((t: string) => ({
                description: { contains: t, mode: 'insensitive' },
              })),
            },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const categoryIds = matchedCategories.map((c: any) => c.id);
    const merchantIds = matchedMerchants.map((m: any) => m.id);
    const paymentIds = matchedPayments.map((p: any) => p.id);
    const descIds = descriptionMatches.map((t: any) => t.id);

    const sparqlIds = await this.rdfService.searchTransactionIdsBySPARQL(
      userId,
      categoryIds,
      merchantIds,
      paymentIds,
    );

    let whereClause: any = { userId };
    let searchSource = '';
    let suggestion: string | null = null;

    const combinedIds = [...new Set([...sparqlIds, ...descIds])];

    if (combinedIds.length > 0) {
      whereClause.id = { in: combinedIds };
      if (sparqlIds.length > 0) searchSource = 'Semantic Web (SPARQL)';
      else searchSource = 'Keterangan (Prisma)';
    } else if (parsedQuery.tokens.length > 0) {
      searchSource = 'Prisma Fallback';
      const andClauses: any[] = [];
      if (categoryIds.length > 0) andClauses.push({ categoryId: { in: categoryIds } });
      if (merchantIds.length > 0) andClauses.push({ merchantId: { in: merchantIds } });
      if (paymentIds.length > 0) andClauses.push({ paymentMethodId: { in: paymentIds } });

      if (andClauses.length === 0) {
        andClauses.push({
          OR: parsedQuery.tokens.map((t: string) => ({
            description: { contains: t, mode: 'insensitive' },
          })),
        });
      }
      whereClause.AND = andClauses;
    }

    if (parsedQuery.dateRange) {
      whereClause.date = {
        gte: parsedQuery.dateRange.start,
        lte: parsedQuery.dateRange.end,
      };
      if (!searchSource) searchSource = 'Date Filter Only';
    }

    let [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { category: true, merchant: true, paymentMethod: true },
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    if (total === 0) {
      if (merchantIds.length > 0 || categoryIds.length > 0) {
        const insightQuery = await this.prisma.transaction.groupBy({
          by: ['paymentMethodId'],
          where: {
            userId,
            OR: [
              ...(merchantIds.length > 0 ? [{ merchantId: { in: merchantIds } }] : []),
              ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
            ],
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 1,
        });

        if (insightQuery.length > 0) {
          const topPaymentMethod = await this.prisma.paymentMethod.findUnique({
            where: { id: insightQuery[0].paymentMethodId },
          });

          const entityName = matchedMerchants[0]?.name || matchedCategories[0]?.name || 'item ini';
          if (topPaymentMethod) {
            suggestion = `Tidak ditemukan transaksi ${entityName} dengan filter ini. Namun, sejarah mencatat Anda sering membayarnya menggunakan ${topPaymentMethod.name}.`;
          }
        }
      } else {
        const generalInsight = await this.prisma.transaction.groupBy({
          by: ['paymentMethodId'],
          where: { userId },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 1,
        });

        if (generalInsight.length > 0) {
          const topPaymentMethod = await this.prisma.paymentMethod.findUnique({
            where: { id: generalInsight[0].paymentMethodId },
          });

          if (topPaymentMethod) {
            suggestion = `Data tidak ditemukan. Anda sepertinya belum pernah bertransaksi untuk hal tersebut. Sekadar info, metode pembayaran paling favorit Anda sejauh ini adalah ${topPaymentMethod.name}.`;
          }
        }
      }
    } else {
      const entityName = matchedMerchants[0]?.name || matchedCategories[0]?.name;
      if (entityName) {
        const aprioriResult = await this.prisma.analysisResult.findFirst({
          where: { userId, resultType: 'APRIORI' },
          orderBy: { createdAt: 'desc' },
        });

        let foundApriori = false;
        if (aprioriResult && aprioriResult.data) {
          try {
            const rules: any[] = typeof aprioriResult.data === 'string'
              ? JSON.parse(aprioriResult.data)
              : aprioriResult.data;
            
            const matchedRule = rules.find((r: any) => {
              const lhs = r.antecedents || r.lhs || [];
              return lhs.some((item: string) => item.toLowerCase() === entityName.toLowerCase());
            });

            if (matchedRule) {
              const rhs = matchedRule.consequents || matchedRule.rhs || [];
              const confidence = Math.round((matchedRule.confidence || 0) * 100);
              if (rhs.length > 0) {
                suggestion = `💡 Berdasarkan pola Apriori Anda: Biasanya saat Anda membeli ${entityName}, Anda juga membeli ${rhs.join(', ')} (Akurasi: ${confidence}%).`;
                foundApriori = true;
              }
            }
          } catch (e) {}
        }

        if (!foundApriori) {
          const statInsight = await this.prisma.transaction.aggregate({
            where: {
              userId,
              OR: [
                ...(merchantIds.length > 0 ? [{ merchantId: { in: merchantIds } }] : []),
                ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
              ],
            },
            _sum: { amount: true },
            _count: { id: true },
          });

          if (statInsight._count.id > 0) {
            suggestion = `📈 Insight: Anda telah melakukan ${statInsight._count.id}x transaksi untuk ${entityName} dengan total pengeluaran Rp ${(statInsight._sum.amount || 0).toLocaleString('id-ID')}.`;
          }
        }
      }
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        keyword: parsedQuery.originalQuery,
        searchSource: searchSource || 'All Data',
        suggestion,
        parsedTokens: parsedQuery.tokens,
      },
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
      },
    });
    if (!transaction) throw new NotFoundException(`Transaction with ID ${id} not found`);
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    await this.findOne(id);

    const { date, ...rest } = updateTransactionDto;
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        ...rest,
        ...(date && { date: new Date(date) }),
      },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
      },
    });

    this.rdfService.pushTransactionToKG(updatedTransaction);
    return updatedTransaction;
  }

  async remove(id: string) {
    const transaction = await this.findOne(id);
    await this.prisma.transaction.delete({ where: { id } });
    return transaction;
  }
}

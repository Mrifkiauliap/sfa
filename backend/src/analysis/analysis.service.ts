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
    minSupport: number = 0.3, // 30% default
    minConfidence: number = 0.5, // 50% default
    basketPeriod: 'weekly' | 'monthly' = 'weekly',
  ) {
    this.logger.log(`Starting Apriori for User: ${userId} (${basketPeriod})`);

    // 1. Fetch Transaksi (Eager load relasinya)
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

    // 2. Kelompokkan menjadi Baskets (Keranjang Belanja)
    // Keranjang di sini didefinisikan sebagai aktivitas selama 1 minggu atau 1 bulan
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

      // Masukkan item ke dalam keranjang
      // Agar unik, kita format stringnya. Kita fokus ke relasi Kategori dan Merchant
      if (t.category) basket.add(`Kategori: ${t.category.name}`);
      // if (t.merchant) basket.add(`Merchant: ${t.merchant.name}`);
      // Merchant bisa ditambahkan jika ingin pola yang sangat spesifik, tapi untuk permulaan Kategori jauh lebih general.
      // Mari kita pakai Kategori saja dulu agar rules-nya tidak terlalu langka (sparse).
      // Edit: Sesuai janji, agar lebih asik kita masukkan Pilihan Kategori dan Merchant.
      if (t.merchant) basket.add(`Tempat: ${t.merchant.name}`);
    });

    // Convert Set of Baskets ke Array of Array
    const baskets = Array.from(basketsMap.values()).map((set) =>
      Array.from(set),
    );
    const totalBaskets = baskets.length;

    this.logger.log(`Total Baskets terbentuk: ${totalBaskets}`);

    // --- ALGORITMA APRIORI CORE ---

    // Fungsi pembantu: hitung kemunculan sekumpulan item di dalam semua Baskets
    const countSupport = (itemset: string[]) => {
      let count = 0;
      for (const basket of baskets) {
        // Cek apakah SEMUA elemen itemset ada di dalam keranjang ini
        if (itemset.every((item) => basket.includes(item))) {
          count++;
        }
      }
      return count / totalBaskets;
    };

    // Tahap 1: Temukan Item yang sering muncul secara individu (Frequent 1-Itemsets)
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

    // Tahap 2: Buat Pasangan 2-Itemsets (Karena kita fokus ke relasi biner A => B)
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

    // Tahap 3: Hasilkan Association Rules dari pasangan L2
    const rules: any[] = [];

    L2.forEach((pair) => {
      const [itemA, itemB] = pair;
      const supportAB = countSupport(pair);

      // Hitung Confidence untuk A => B
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

      // Hitung Confidence untuk B => A
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

    // Urutkan berdasarkan Confidence tertinggi
    rules.sort((a, b) => b.confidence - a.confidence);

    // 4. Simpan hasil ke Database PostgreSQL (Simpan JSON-nya)
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
    const results = await this.prisma.analysisResult.findMany({
      where: { userId, resultType: 'APRIORI' },
      orderBy: { createdAt: 'desc' },
      take: 20, // Batasi 20 hasil terakhir
    });
    return results;
  }
}

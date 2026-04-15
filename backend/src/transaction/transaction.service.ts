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
        // Konversi string ISO date menjadi Object Date JS yang dimengerti PostgreSQL
        ...(date && { date: new Date(date) }),
      },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
      },
    });

    // PUSH KE FUSEKI SEMANTIC WEB
    // Tidak di-await (asinkron) agar request API pengguna tidak tertunda
    this.rdfService.pushTransactionToKG(transaction);

    return transaction;
  }

  async findAll() {
    return this.prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      // Include master data supaya saat GET muncul nama Kategori & Merchantnya, bukan cuma ID (Knowledge Graph Prep!)
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
   * Lebih efisien daripada kirim semua transaksi mentah ke frontend.
   * Returns:
   *   - totalThisMonth: total pengeluaran bulan berjalan
   *   - totalLastMonth: total pengeluaran bulan lalu (untuk perbandingan)
   *   - categoryBreakdown: per-kategori nominal bulan ini
   *   - recentTransactions: 5 transaksi terakhir untuk preview
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
      // Semua transaksi bulan ini (hanya ambil field yg perlu untuk kalkulasi)
      this.prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth } },
        select: {
          amount: true,
          category: { select: { id: true, name: true } },
        },
      }),
      // Total bulan lalu
      this.prisma.transaction.aggregate({
        where: { userId, date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      // 5 transaksi terbaru untuk preview card
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true, merchant: true, paymentMethod: true },
      }),
    ]);

    // Hitung total bulan ini
    const totalThisMonth = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);

    // Breakdown per kategori
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
   * Hybrid Semantic Search:
   * 1. Cari category & merchant IDs yg cocok keyword via Prisma
   * 2. Query SPARQL ke Fuseki untuk menemukan Transaction URI yg relevan
  /**
   * Hybrid Semantic Search:
   * 1. Resolve keyword → Category & Merchant IDs via Prisma
   * 2. SPARQL ke Fuseki → cari Transaction URI yang berelasi (Semantic Web)
   * 3. Prisma description search → cari transaksi yang keterangannya cocok
   * 4. UNION hasil SPARQL + description search → bersihkan duplikat
   * 5. Jika kedua sumber kosong (Fuseki mati & tidak ada deskripsi cocok)
   *    → pure Prisma fallback (OR category | merchant | description)
   */
  async searchTransactions(
    userId: string,
    keyword: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const kw = keyword.trim();

    // Step 1: Resolve keyword → Category & Merchant IDs
    const [matchedCategories, matchedMerchants, descriptionMatches] =
      await Promise.all([
        this.prisma.category.findMany({
          where: { name: { contains: kw, mode: 'insensitive' } },
          select: { id: true },
        }),
        this.prisma.merchant.findMany({
          where: {
            OR: [
              { name: { contains: kw, mode: 'insensitive' } },
              { location: { contains: kw, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        }),
        // Step 2b: Cari keterangan yang cocok langsung via Prisma
        // (description tidak disimpan sebagai RDF triple di Fuseki)
        this.prisma.transaction.findMany({
          where: {
            userId,
            description: { contains: kw, mode: 'insensitive' },
          },
          select: { id: true },
        }),
      ]);

    const categoryIds = matchedCategories.map((c) => c.id);
    const merchantIds = matchedMerchants.map((m) => m.id);
    const descIds = descriptionMatches.map((t) => t.id);

    // Step 2a: SPARQL Query ke Fuseki (Semantic Web) untuk relasi cat/merchant
    const sparqlIds = await this.rdfService.searchTransactionIdsBySPARQL(
      userId,
      categoryIds,
      merchantIds,
    );

    let whereClause: any;
    let searchSource: string;

    // Step 3: UNION hasil SPARQL + description Prisma
    const combinedIds = [...new Set([...sparqlIds, ...descIds])];

    if (combinedIds.length > 0) {
      // Ada hasil dari SPARQL atau description match
      const hasSparql = sparqlIds.length > 0;
      const hasDesc = descIds.length > 0;
      if (hasSparql && hasDesc) searchSource = 'SPARQL + Keterangan';
      else if (hasSparql) searchSource = 'SPARQL (Semantic Web)';
      else searchSource = 'Keterangan (Prisma)';

      whereClause = { userId, id: { in: combinedIds } };
    } else {
      // Pure fallback: Fuseki mati & tidak ada deskripsi cocok
      searchSource = 'Prisma Fallback';
      whereClause = {
        userId,
        OR: [
          { category: { name: { contains: kw, mode: 'insensitive' } } },
          { merchant: { name: { contains: kw, mode: 'insensitive' } } },
          { description: { contains: kw, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { category: true, merchant: true, paymentMethod: true },
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        keyword: kw,
        searchSource,
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
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto) {
    await this.findOne(id); // Validasi exist atau gak

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

    // SINKRONISASI ULANG KE FUSEKI
    this.rdfService.pushTransactionToKG(updatedTransaction);

    return updatedTransaction;
  }

  async remove(id: string) {
    const transaction = await this.findOne(id); // Validasi
    await this.prisma.transaction.delete({
      where: { id },
    });
    // Menghapus data dari Fuseki itu agak lebih kompleks (DELETE DATA SPARQL),
    // Untuk tahap ini fokus men-push (INSERT) data ke Semantic Web.
    return transaction;
  }
}

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

  async findAllByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        category: true,
        merchant: true,
        paymentMethod: true,
      },
    });
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

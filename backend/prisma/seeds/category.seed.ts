import { PrismaClient } from '@prisma/client';

export default async function categorySeed(prisma: PrismaClient) {
  console.log('Seeding Categories...');
  const categories = [
    {
      name: 'Makan & Minum',
      description: 'Pengeluaran kebutuhan konsumsi sehari-hari',
    },
    { name: 'Transportasi', description: 'Biaya BBM, ongkos ojek/angkot' },
    {
      name: 'Pendidikan',
      description: 'Beli buku, print tugas, fotokopi, UKT',
    },
    {
      name: 'Kos/Tempat Tinggal',
      description: 'Pembayaran sewa tempat tinggal atau listrik',
    },
    { name: 'Hiburan', description: 'Nonton, langganan film/musik, nongkrong' },
    { name: 'Kesehatan', description: 'Obat, vitamin, biaya periksa' },
    { name: 'Lainnya', description: 'Pengeluaran tak terduga' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
}

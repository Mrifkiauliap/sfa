import { PrismaClient } from '@prisma/client';

export default async function categorySeed(prisma: PrismaClient) {
  console.log('Seeding Categories...');
  const categories = [
    {
      name: 'Makan & Minum',
      description: 'Pengeluaran makan, minum, jajan harian mahasiswa',
    },
    {
      name: 'Transportasi',
      description: 'Bensin, ojek online, angkot, parkir',
    },
    {
      name: 'Pendidikan',
      description: 'Print tugas, fotokopi, beli buku, alat tulis, bayar UKT',
    },
    {
      name: 'Kos & Utilitas',
      description: 'Bayar sewa kos, listrik, air, Wi-Fi bulanan',
    },
    {
      name: 'Hiburan & Sosial',
      description: 'Nonton bioskop, nongkrong, karaoke, event kampus',
    },
    {
      name: 'Kesehatan',
      description: 'Beli obat, vitamin, klinik, apotek',
    },
    {
      name: 'Belanja & Kebutuhan',
      description: 'Beli pakaian, perlengkapan mandi, deterjen, dll.',
    },
    {
      name: 'Pulsa & Internet',
      description: 'Top up pulsa, beli paket data internet',
    },
    {
      name: 'Lainnya',
      description: 'Pengeluaran tak terduga atau tidak masuk kategori lain',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
}

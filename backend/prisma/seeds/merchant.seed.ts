import { PrismaClient } from '@prisma/client';

export default async function merchantSeed(prisma: PrismaClient) {
  console.log('Seeding Merchants...');
  const merchants = [
    // Spesifik untuk Use Case Knowledge Graph
    {
      name: 'Kantin Fakultas',
      description: 'Tempat makan siang mahasiswa',
      location: 'Area Kampus',
    },
    {
      name: 'Fotokopi Sumber Ilmu',
      description: 'Jasa nge-print dan fotokopi',
      location: 'Area Kampus',
    },
    {
      name: 'Warteg Kejayaan',
      description: 'Warteg langganan murah',
      location: 'Area Kampus',
    },
    // Lainnya
    {
      name: 'Rumah Makan Padang',
      description: 'Nasi padang dekat gerbang utama',
      location: 'Area Sekitar Luar Kampus',
    },
    {
      name: 'Minimarket 24 Jam',
      description: 'Beli jajan dan kebutuhan darurat',
      location: 'Area Kos',
    },
    {
      name: 'Kafe Anak Senja',
      description: 'Tempat nugas sambil ngopi',
      location: 'Pusat Kota',
    },
    {
      name: 'SPBU Terdekat',
      description: 'Isi BBM kendaraan',
      location: 'Jalan Raya',
    },
  ];

  for (const m of merchants) {
    await prisma.merchant.upsert({
      where: { name: m.name },
      update: { location: m.location, description: m.description },
      create: m,
    });
  }
}

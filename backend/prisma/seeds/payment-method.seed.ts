import { PrismaClient } from '@prisma/client';

export default async function paymentMethodSeed(prisma: PrismaClient) {
  console.log('Seeding Payment Methods...');
  const methods = [
    { name: 'Tunai', description: 'Membayar menggunakan uang fisik' },
    {
      name: 'QRIS',
      description: 'Dompet Digital (Gopay, OVO, Dana, ShopeePay)',
    },
    { name: 'Transfer Bank', description: 'M-Banking / ATM' },
    // Spesifik untuk Use Case Knowledge Graph
    {
      name: 'Kasbon / Paylater',
      description: 'Ngutang ke Ibu Kantin, Teman, atau aplikasi Paylater',
    },
  ];

  for (const pm of methods) {
    await prisma.paymentMethod.upsert({
      where: { name: pm.name },
      update: { description: pm.description },
      create: pm,
    });
  }
}

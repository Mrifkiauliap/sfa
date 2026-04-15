import { PrismaClient } from '@prisma/client';

export default async function paymentMethodSeed(prisma: PrismaClient) {
  console.log('Seeding Payment Methods...');
  const methods = [
    { name: 'Tunai', description: 'Membayar dengan uang fisik / cash' },
    { name: 'QRIS', description: 'Scan kode QR via GoPay, OVO, Dana, dll.' },
    {
      name: 'Transfer Bank',
      description: 'M-Banking, ATM, atau BI-Fast antar bank',
    },
    {
      name: 'GoPay',
      description: 'Dompet digital Gojek ecosystem',
    },
    {
      name: 'OVO',
      description: 'Dompet digital OVO, sering cashback di Grab',
    },
    {
      name: 'Dana',
      description: 'Dompet digital Dana, cocok untuk transfer',
    },
    {
      name: 'ShopeePay',
      description: 'Dompet digital Shopee, sering promo diskon',
    },
    {
      name: 'Kasbon / Paylater',
      description: 'Utang ke ibu kantin, teman, atau Spaylater/Kredivo',
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

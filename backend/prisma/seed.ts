import { PrismaClient } from '@prisma/client';

import categorySeed from './seeds/category.seed';
import massiveSeed from './seeds/massive.seed';
import merchantSeed from './seeds/merchant.seed';
import paymentMethodSeed from './seeds/payment-method.seed';
import userSeed from './seeds/user.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('============ Seeding Database ============');

  await categorySeed(prisma);
  await merchantSeed(prisma);
  await paymentMethodSeed(prisma);
  await userSeed(prisma);

  // Data Massive untuk Analisis & KG
  await massiveSeed(prisma);

  console.log('============ Seeding Berhasil! ============');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

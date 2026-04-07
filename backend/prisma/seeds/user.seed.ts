import * as bcrypt from 'bcrypt';

export default async function userSeed(prisma) {
  const password = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: {
      fullname: 'Super Admin',
      username: 'admin',
      password,
      semester: 6,
      major: 'Informatika',
      monthlyAllowance: 1000000,
      residenceType: 'Kos',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

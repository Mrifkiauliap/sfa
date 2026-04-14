import * as bcrypt from 'bcrypt';

export default async function userSeed(prisma) {
  console.log('Seeding Admin...');
  const password = await bcrypt.hash('123456', 10);

  const users = [
    {
      fullname: 'Muhammad Rifki Aulia Pratama',
      username: 'rifki',
      password,
      semester: 6,
      major: 'Informatika',
      monthlyAllowance: 2000000,
      residenceType: 'Rumah',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // {
    //   fullname: 'Super Admin',
    //   username: 'admin',
    //   password,
    //   semester: 1,
    //   major: 'Informatika',
    //   monthlyAllowance: 1000000,
    //   residenceType: 'Kos',
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: { password },
      create: {
        fullname: user.fullname,
        username: user.username,
        password: user.password,
        semester: user.semester,
        major: user.major,
        monthlyAllowance: user.monthlyAllowance,
        residenceType: user.residenceType,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}

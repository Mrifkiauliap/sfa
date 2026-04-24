import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dayjs from 'dayjs';
import { DataFactory, Writer } from 'n3';

const { namedNode, literal } = DataFactory;

export default async function massiveSeed(prisma: PrismaClient) {
  console.log('--- Memulai Massive Realistic Transaction Seeding ---');

  // Load Env Configuration
  const fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
  const fusekiDataset = process.env.FUSEKI_DATASET || 'sfa_dataset';
  const username = process.env.FUSEKI_USERNAME;
  const password = process.env.FUSEKI_PASSWORD;
  const updateEndpoint = `${fusekiUrl}/${fusekiDataset}/update`;

  const authHeader =
    username && password ? { auth: { username, password } } : {};

  // 1. Cleaning Knowledge Graph
  console.log(`Cleaning Knowledge Graph at ${fusekiDataset}...`);
  try {
    const sparqlClearQuery = 'DELETE WHERE { ?s ?p ?o }';
    await axios.post(
      updateEndpoint,
      `update=${encodeURIComponent(sparqlClearQuery)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        ...authHeader,
      },
    );
    console.log('Knowledge Graph cleaned.');
  } catch (e: any) {
    console.log('Failed to clean Fuseki:', e.response?.statusText || e.message);
    console.log('Proceeding with DB seeding anyway...');
  }

  // 2. Clear Existing Transactions & Analysis
  console.log('Cleaning existing transactions & analysis in DB...');
  await prisma.analysisResult.deleteMany({});
  await prisma.transaction.deleteMany({});

  // 3. Ambil data master
  const users = await prisma.user.findMany();
  const categories = await prisma.category.findMany();
  const merchants = await prisma.merchant.findMany();
  const paymentMethods = await prisma.paymentMethod.findMany();

  if (
    !users.length ||
    !categories.length ||
    !merchants.length ||
    !paymentMethods.length
  ) {
    console.error('❌ Master data belum lengkap. Jalankan master seeder dulu!');
    return;
  }

  // Helper functions
  const findCat = (name: string) => categories.find((c) => c.name === name);
  const findMerch = (name: string) => merchants.find((m) => m.name === name);
  const findPay = (name: string) => paymentMethods.find((p) => p.name === name);
  const randPay = () =>
    paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  const randBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;
  const chance = (prob: number) => Math.random() < prob;
  const pickRandom = <T>(arr: T[]): T =>
    arr[Math.floor(Math.random() * arr.length)];

  // Define Payload Types
  type TrxDef = {
    cat: string;
    merch: string;
    pay?: string;
    amount: number;
    desc: string;
    hour: number;
  };

  const generatedTransactions: {
    userId: string;
    categoryId: string;
    merchantId: string;
    paymentMethodId: string;
    amount: number;
    date: Date;
    description: string;
  }[] = [];

  const daysToSimulate = 60;

  for (const user of users) {
    console.log(`Generating daily life for user: ${user.username}...`);
    let startDate = dayjs().subtract(daysToSimulate, 'day');

    for (let day = 0; day <= daysToSimulate; day++) {
      const currentDay = startDate.add(day, 'day');
      const isWeekend = currentDay.day() === 0 || currentDay.day() === 6;
      const dateNum = currentDay.date();

      const dayTrxs: TrxDef[] = [];

      // ---------------------------------------------------------
      // BUNDLE 1: Monthly Bills (Bayar Kos & Utilitas)
      // Terjadi di awal bulan (tgl 1-3) atau akhir bulan (tgl 25-28)
      // ---------------------------------------------------------
      if ((dateNum >= 1 && dateNum <= 3) || (dateNum >= 25 && dateNum <= 28)) {
        if (chance(0.2)) {
          // 20% chance to pay bills on these days
          dayTrxs.push({
            cat: 'Kos & Utilitas',
            merch: 'Bu Ratna Kos',
            pay: 'Transfer Bank',
            amount: 500000,
            desc: 'Bayar sewa kos bulan ini',
            hour: 9,
          });
          dayTrxs.push({
            cat: 'Kos & Utilitas',
            merch: 'PLN Mobile',
            pay: 'GoPay',
            amount: 100000,
            desc: 'Isi token listrik bulanan',
            hour: 10,
          });
          dayTrxs.push({
            cat: 'Belanja & Kebutuhan',
            merch: 'Alfamart',
            pay: 'Tunai',
            amount: 80000,
            desc: 'Belanja bulanan sabun, sampo, dsb',
            hour: 16,
          });
          dayTrxs.push({
            cat: 'Pulsa & Internet',
            merch: 'Konter Pulsa Jaya',
            pay: 'Tunai',
            amount: 50000,
            desc: 'Beli paket data',
            hour: 17,
          });
        }
      }

      // ---------------------------------------------------------
      // BUNDLE 2: Weekend Hangout (Sangat Kuat untuk Apriori)
      // Kalau weekend, ada 60% peluang keluar main.
      // Jika main ke Cinema XXI, kemungkinan besar makan McDonalds.
      // ---------------------------------------------------------
      if (isWeekend) {
        if (chance(0.6)) {
          // Siang/Sore: Nonton
          dayTrxs.push({
            cat: 'Hiburan & Sosial',
            merch: 'Cinema XXI',
            pay: 'GoPay',
            amount: randBetween(35000, 50000),
            desc: 'Nonton film bareng teman',
            hour: pickRandom([14, 15, 16]),
          });

          // Malam: Makan (Korelasi Kuat dengan Cinema XXI)
          dayTrxs.push({
            cat: 'Makan & Minum',
            merch: 'McDonalds',
            pay: 'Debit BCA',
            amount: randBetween(40000, 75000),
            desc: 'Makan malam habis nonton',
            hour: pickRandom([18, 19, 20]),
          });

          // Transport
          if (chance(0.5)) {
            dayTrxs.push({
              cat: 'Transportasi',
              merch: 'Grab',
              pay: 'GoPay',
              amount: randBetween(15000, 30000),
              desc: 'GrabCar patungan pulang',
              hour: 21,
            });
          }
        } else {
          // Weekend santai di kos
          dayTrxs.push({
            cat: 'Makan & Minum',
            merch: 'Geprek Bensu',
            pay: 'GoPay',
            amount: randBetween(15000, 25000),
            desc: 'Delivery gofood malam',
            hour: 19,
          });
          dayTrxs.push({
            cat: 'Makan & Minum',
            merch: 'Kopi Kenangan',
            pay: 'GoPay',
            amount: randBetween(18000, 25000),
            desc: 'Kopi nemenin nugas weekend',
            hour: 15,
          });
        }
      }
      // ---------------------------------------------------------
      // BUNDLE 3: Weekday Routine
      // ---------------------------------------------------------
      else {
        // Makan Siang
        const lunchMerch = pickRandom([
          'Kantin Fakultas',
          'Warteg Pak Udin',
          'Mie Ayam Pak Slamet',
        ]);
        dayTrxs.push({
          cat: 'Makan & Minum',
          merch: lunchMerch,
          pay: 'Tunai',
          amount: randBetween(10000, 20000),
          desc: `Makan siang di ${lunchMerch}`,
          hour: pickRandom([12, 13]),
        });

        // Makan Malam
        if (chance(0.8)) {
          const dinnerMerch = pickRandom([
            'Gacoan',
            'Geprek Bensu',
            'Warteg Pak Udin',
          ]);
          dayTrxs.push({
            cat: 'Makan & Minum',
            merch: dinnerMerch,
            pay: dinnerMerch === 'Warteg Pak Udin' ? 'Tunai' : 'GoPay',
            amount: randBetween(15000, 30000),
            desc: 'Makan malam',
            hour: pickRandom([18, 19, 20]),
          });
        }

        // Bensin (10% chance tiap hari biasa)
        if (chance(0.1)) {
          dayTrxs.push({
            cat: 'Transportasi',
            merch: 'SPBU Shell',
            pay: 'Tunai',
            amount: 30000,
            desc: 'Isi bensin motor',
            hour: pickRandom([7, 8, 16]),
          });
        }

        // Kebutuhan Kuliah (15% chance)
        if (chance(0.15)) {
          dayTrxs.push({
            cat: 'Pendidikan',
            merch: 'Fotokopi Sumber Ilmu',
            pay: 'Tunai',
            amount: randBetween(3000, 15000),
            desc: 'Print dan jilid tugas',
            hour: pickRandom([10, 14]),
          });
        }

        // Nongkrong Kafe (20% chance)
        if (chance(0.2)) {
          dayTrxs.push({
            cat: 'Hiburan & Sosial',
            merch: 'Kafe Anak Senja',
            pay: 'Debit BCA',
            amount: randBetween(30000, 50000),
            desc: 'Nugas sambil ngopi',
            hour: pickRandom([16, 17, 19]),
          });
        }
      }

      // ---------------------------------------------------------
      // RESOLVE AND PUSH
      // ---------------------------------------------------------
      for (const t of dayTrxs) {
        const catNode = findCat(t.cat);
        const merchNode = findMerch(t.merch);
        const payNode = t.pay ? findPay(t.pay) : randPay();

        if (catNode && merchNode && payNode) {
          // Randomize minute
          const trxDate = currentDay
            .hour(t.hour)
            .minute(randBetween(0, 59))
            .second(0)
            .toDate();

          generatedTransactions.push({
            userId: user.id,
            categoryId: catNode.id,
            merchantId: merchNode.id,
            paymentMethodId: payNode.id,
            amount: t.amount,
            description: t.desc,
            date: trxDate,
          });
        }
      }
    }
  }

  console.log(
    `Menyimpan ${generatedTransactions.length} transaksi ke PostgreSQL...`,
  );

  // Karena kita butuh ID transaksi untuk Fuseki, kita harus pakai createManyAndReturn (Prisma >5.x)
  // Atau iterasi satu-satu dalam transaction.
  const createdTransactions: any[] = [];

  // Kita insert per chunk agar tidak memberatkan memori
  const chunkSize = 50;
  for (let i = 0; i < generatedTransactions.length; i += chunkSize) {
    const chunk = generatedTransactions.slice(i, i + chunkSize);
    const results = await prisma.$transaction(
      chunk.map((data) => prisma.transaction.create({ data })),
    );
    createdTransactions.push(...results);
  }

  console.log(
    `Berhasil menyimpan ${createdTransactions.length} transaksi ke DB.`,
  );

  // ---------------------------------------------------------
  // SYNC TO FUSEKI (RDF Generation in BATCH)
  // ---------------------------------------------------------
  console.log(`Generating N-Triples untuk Knowledge Graph...`);
  const sfa = 'http://student-finance-analyzer.com/ontology#';
  const writer = new Writer({ format: 'N-Triples' });

  for (const trx of createdTransactions) {
    const trxNode = namedNode(`${sfa}Transaction_${trx.id}`);
    const userNode = namedNode(`${sfa}User_${trx.userId}`);

    writer.addQuad(userNode, namedNode(`${sfa}hasExpense`), trxNode);
    writer.addQuad(
      trxNode,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode(`${sfa}Transaction`),
    );
    writer.addQuad(trxNode, namedNode(`${sfa}amount`), literal(trx.amount));
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}date`),
      literal(
        trx.date.toISOString(),
        namedNode('http://www.w3.org/2001/XMLSchema#dateTime'),
      ),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}hasCategory`),
      namedNode(`${sfa}Category_${trx.categoryId}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}hasMerchant`),
      namedNode(`${sfa}Merchant_${trx.merchantId}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}paidUsing`),
      namedNode(`${sfa}PaymentMethod_${trx.paymentMethodId}`),
    );
  }

  await new Promise<void>((resolve) => {
    writer.end(async (error, triplesString) => {
      if (!error && triplesString) {
        console.log(`Mengirim massive SPARQL INSERT DATA ke Fuseki...`);
        const sparqlInsert = `INSERT DATA {\n${triplesString}\n}`;
        try {
          await axios.post(
            updateEndpoint,
            `update=${encodeURIComponent(sparqlInsert)}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              ...authHeader,
            },
          );
          console.log(`Berhasil sync Knowledge Graph.`);
        } catch (e: any) {
          console.error(
            `Gagal sync Fuseki:`,
            e.response?.statusText || e.message,
          );
        }
      }
      resolve();
    });
  });

  console.log('✅ Massive Seeding Selesai!');
}

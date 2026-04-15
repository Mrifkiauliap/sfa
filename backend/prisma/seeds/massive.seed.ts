import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { DataFactory, Writer } from 'n3';

const { namedNode, literal } = DataFactory;

export default async function massiveSeed(prisma: PrismaClient) {
  console.log('--- Memulai Massive Transaction Seeding ---');

  // Load Env Configuration
  const fusekiUrl = process.env.FUSEKI_URL || 'http://localhost:3030';
  const fusekiDataset = process.env.FUSEKI_DATASET || 'sfa_dataset';
  const username = process.env.FUSEKI_USERNAME;
  const password = process.env.FUSEKI_PASSWORD;
  const updateEndpoint = `${fusekiUrl}/${fusekiDataset}/update`;
  const transactionsToCreate = 100;

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

  // 2. Clear Existing Transactions
  console.log('Cleaning existing transactions in DB...');
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Peta Konteks Realistis: setiap template mendeskripsikan SATU JENIS transaksi
  // yang secara nyata dilakukan mahasiswa. Merchant SELALU sesuai kategorinya.
  // ─────────────────────────────────────────────────────────────────────────────
  type TrxTemplate = {
    category: string;
    merchant: string;
    minAmount: number;
    maxAmount: number;
    description: string;
    paymentMethod?: string; // jika diisi, metode bayar akan dikunci
    weight: number; // probabilitas relatif (lebih tinggi = lebih sering)
  };

  const templates: TrxTemplate[] = [
    // ── Makan & Minum (paling dominan) ───────────────────────────────────────
    {
      category: 'Makan & Minum',
      merchant: 'Kantin Fakultas',
      minAmount: 8000,
      maxAmount: 20000,
      description: 'Makan siang di kantin kampus',
      weight: 15,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Warteg Pak Udin',
      minAmount: 8000,
      maxAmount: 18000,
      description: 'Nasi rames warteg dekat kos',
      weight: 14,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Gacoan',
      minAmount: 15000,
      maxAmount: 35000,
      description: 'Makan mie pedas level favorit',
      weight: 10,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Geprek Bensu',
      minAmount: 15000,
      maxAmount: 30000,
      description: 'Ayam geprek krispy kala lapar malam',
      weight: 9,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Mie Ayam Pak Slamet',
      minAmount: 10000,
      maxAmount: 20000,
      description: 'Mie ayam bakso dekat kos',
      weight: 8,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Kopi Kenangan',
      minAmount: 18000,
      maxAmount: 40000,
      description: 'Kopi kekinian sambil nugas',
      weight: 10,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Bakso Malang Bakar',
      minAmount: 10000,
      maxAmount: 25000,
      description: 'Jajan sore bakso bakar area kampus',
      weight: 7,
    },
    {
      category: 'Makan & Minum',
      merchant: 'McDonalds',
      minAmount: 30000,
      maxAmount: 75000,
      description: 'Treat diri sendiri atau makan bareng',
      weight: 4,
    },
    {
      category: 'Makan & Minum',
      merchant: 'Indomaret',
      minAmount: 5000,
      maxAmount: 30000,
      description: 'Beli cemilan dan minuman di minimarket',
      weight: 8,
    },

    // ── Pendidikan ────────────────────────────────────────────────────────────
    {
      category: 'Pendidikan',
      merchant: 'Fotokopi Sumber Ilmu',
      minAmount: 3000,
      maxAmount: 20000,
      description: 'Print & fotokopi tugas kuliah',
      weight: 12,
    },
    {
      category: 'Pendidikan',
      merchant: 'Print Center Kampus',
      minAmount: 2000,
      maxAmount: 15000,
      description: 'Ngeprint laporan/skripsi di lab',
      weight: 10,
    },
    {
      category: 'Pendidikan',
      merchant: 'Gramedia',
      minAmount: 25000,
      maxAmount: 150000,
      description: 'Beli buku referensi atau alat tulis',
      weight: 5,
    },
    {
      category: 'Pendidikan',
      merchant: 'Fotokopi Sumber Ilmu',
      minAmount: 5000,
      maxAmount: 30000,
      description: 'Jilid laporan praktikum',
      weight: 6,
    },

    // ── Transportasi ──────────────────────────────────────────────────────────
    {
      category: 'Transportasi',
      merchant: 'SPBU Shell',
      minAmount: 20000,
      maxAmount: 80000,
      description: 'Isi bensin motor',
      weight: 8,
    },
    {
      category: 'Transportasi',
      merchant: 'Gojek',
      minAmount: 8000,
      maxAmount: 35000,
      description: 'GoRide ke kampus atau kondangan',
      weight: 7,
    },
    {
      category: 'Transportasi',
      merchant: 'Grab',
      minAmount: 10000,
      maxAmount: 40000,
      description: 'GrabBike pulang malam dari kampus',
      weight: 6,
    },

    // ── Kos & Utilitas ────────────────────────────────────────────────────────
    {
      category: 'Kos & Utilitas',
      merchant: 'Bu Ratna Kos',
      minAmount: 400000,
      maxAmount: 800000,
      description: 'Bayar sewa kos bulan ini',
      paymentMethod: 'Transfer Bank',
      weight: 3,
    },
    {
      category: 'Kos & Utilitas',
      merchant: 'PLN Mobile',
      minAmount: 50000,
      maxAmount: 150000,
      description: 'Beli token listrik kamar kos',
      paymentMethod: 'GoPay',
      weight: 4,
    },

    // ── Belanja & Kebutuhan ───────────────────────────────────────────────────
    {
      category: 'Belanja & Kebutuhan',
      merchant: 'Alfamart',
      minAmount: 15000,
      maxAmount: 80000,
      description: 'Belanja sabun, sampo, kebutuhan mandi',
      weight: 6,
    },
    {
      category: 'Belanja & Kebutuhan',
      merchant: 'Indomaret',
      minAmount: 10000,
      maxAmount: 60000,
      description: 'Beli deterjen dan perlengkapan kos',
      weight: 5,
    },
    {
      category: 'Belanja & Kebutuhan',
      merchant: 'Shopee',
      minAmount: 30000,
      maxAmount: 250000,
      description: 'Order pakaian/barang dari Shopee',
      paymentMethod: 'ShopeePay',
      weight: 4,
    },

    // ── Hiburan & Sosial ──────────────────────────────────────────────────────
    {
      category: 'Hiburan & Sosial',
      merchant: 'Kafe Anak Senja',
      minAmount: 25000,
      maxAmount: 80000,
      description: 'Nongkrong dan kerja tugas di kafe',
      weight: 6,
    },
    {
      category: 'Hiburan & Sosial',
      merchant: 'Cinema XXI',
      minAmount: 30000,
      maxAmount: 80000,
      description: 'Nonton film terbaru bareng teman',
      weight: 3,
    },
    {
      category: 'Hiburan & Sosial',
      merchant: 'Timezone',
      minAmount: 50000,
      maxAmount: 150000,
      description: 'Main games di Timezone saat weekend',
      weight: 2,
    },

    // ── Kesehatan ─────────────────────────────────────────────────────────────
    {
      category: 'Kesehatan',
      merchant: 'Apotek K-24',
      minAmount: 10000,
      maxAmount: 60000,
      description: 'Beli obat flu/vitamin setelah begadang',
      weight: 4,
    },
    {
      category: 'Kesehatan',
      merchant: 'Klinik Sehat Kampus',
      minAmount: 20000,
      maxAmount: 80000,
      description: 'Periksa ke klinik kampus',
      weight: 2,
    },

    // ── Pulsa & Internet ──────────────────────────────────────────────────────
    {
      category: 'Pulsa & Internet',
      merchant: 'Konter Pulsa Jaya',
      minAmount: 10000,
      maxAmount: 100000,
      description: 'Beli paket data internet bulanan',
      paymentMethod: 'Tunai',
      weight: 7,
    },
    {
      category: 'Pulsa & Internet',
      merchant: 'Gojek',
      minAmount: 10000,
      maxAmount: 50000,
      description: 'Top up kuota lewat aplikasi Gojek',
      paymentMethod: 'GoPay',
      weight: 5,
    },
  ];

  // Bangun weighted list untuk weighted random pick
  const weightedList: TrxTemplate[] = [];
  for (const t of templates) {
    for (let w = 0; w < t.weight; w++) weightedList.push(t);
  }

  const sfa = 'http://student-finance-analyzer.com/ontology#';

  console.log(
    `Generating ${transactionsToCreate} contextual transactions & Syncing to Fuseki...`,
  );

  for (let i = 0; i < transactionsToCreate; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];

    // Pilih template secara weighted random
    const template =
      weightedList[Math.floor(Math.random() * weightedList.length)];

    const cat = findCat(template.category);
    const merch = findMerch(template.merchant);
    const pay = template.paymentMethod
      ? (findPay(template.paymentMethod) ?? randPay())
      : randPay();

    if (!cat || !merch || !pay) {
      console.warn(
        `⚠ Skipping: master data tidak ditemukan [${template.category} / ${template.merchant}]`,
      );
      continue;
    }

    const amount = randBetween(template.minAmount, template.maxAmount);

    // Tanggal acak dalam 60 hari terakhir, jam antara 06:00–23:00
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    date.setHours(
      Math.floor(Math.random() * 17) + 6,
      Math.floor(Math.random() * 60),
    );

    // CREATE IN DB
    const transaction = await prisma.transaction.create({
      data: {
        userId: randomUser.id,
        categoryId: cat.id,
        merchantId: merch.id,
        paymentMethodId: pay.id,
        amount,
        date,
        description: template.description,
      },
    });

    // SYNC TO FUSEKI (RDF Generation)
    const writer = new Writer({ format: 'N-Triples' });
    const trxNode = namedNode(`${sfa}Transaction_${transaction.id}`);
    const userNode = namedNode(`${sfa}User_${transaction.userId}`);

    writer.addQuad(userNode, namedNode(`${sfa}hasExpense`), trxNode);
    writer.addQuad(
      trxNode,
      namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      namedNode(`${sfa}Transaction`),
    );
    writer.addQuad(trxNode, namedNode(`${sfa}amount`), literal(amount));
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}date`),
      literal(
        date.toISOString(),
        namedNode('http://www.w3.org/2001/XMLSchema#dateTime'),
      ),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}hasCategory`),
      namedNode(`${sfa}Category_${cat.id}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}hasMerchant`),
      namedNode(`${sfa}Merchant_${merch.id}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}paidUsing`),
      namedNode(`${sfa}PaymentMethod_${pay.id}`),
    );

    await new Promise<void>((resolve) => {
      writer.end(async (error, triplesString) => {
        if (!error) {
          const sparqlInsert = `INSERT DATA { ${triplesString} }`;
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
          } catch (_) {
            // Silently fail RDF sync jika Fuseki tidak aktif
          }
        }
        resolve();
      });
    });

    if ((i + 1) % 10 === 0)
      console.log(
        `  ✔ ${i + 1}/${transactionsToCreate} transaksi berhasil dibuat & disinkron...`,
      );
  }

  console.log('✅ Massive Seeding Selesai!');
}

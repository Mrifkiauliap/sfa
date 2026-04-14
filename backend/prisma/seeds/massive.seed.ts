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
  const transactionsToCreate = 20;

  const authHeader =
    username && password
      ? {
          auth: {
            username,
            password,
          },
        }
      : {};

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

  console.log(
    `Generating ${transactionsToCreate} random transactions & Syncing to Fuseki...`,
  );

  const descriptions = [
    'Makan siang enak',
    'Beli cemilan',
    'Print tugas kuliah',
    'Top up saldo',
    'Nongkrong sore',
    'Beli bensin',
    'Fotokopi modul',
    'Makan malam bareng',
    'Belanja bulanan',
    'Beli paket data',
    'Bayar uang kas',
    'Jajan cilok',
  ];

  const sfa = 'http://student-finance-analyzer.com/ontology#';

  for (let i = 0; i < transactionsToCreate; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomMerch = merchants[Math.floor(Math.random() * merchants.length)];
    const randomPay =
      paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    // Logic nominal
    let amount = 15000;
    if (randomCat.name.includes('Makan'))
      amount = Math.floor(Math.random() * (60000 - 10000) + 10000);
    else if (randomCat.name.includes('Transport'))
      amount = Math.floor(Math.random() * (30000 - 5000) + 5000);
    else if (randomCat.name.includes('Pendidikan'))
      amount = Math.floor(Math.random() * (150000 - 5000) + 5000);
    else amount = Math.floor(Math.random() * (100000 - 10000) + 10000);

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    date.setHours(
      Math.floor(Math.random() * 24),
      Math.floor(Math.random() * 60),
    );

    const description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    // CREATE IN DB
    const transaction = await prisma.transaction.create({
      data: {
        userId: randomUser.id,
        categoryId: randomCat.id,
        merchantId: randomMerch.id,
        paymentMethodId: randomPay.id,
        amount: amount,
        date: date,
        description: description,
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
      namedNode(`${sfa}Category_${randomCat.id}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}hasMerchant`),
      namedNode(`${sfa}Merchant_${randomMerch.id}`),
    );
    writer.addQuad(
      trxNode,
      namedNode(`${sfa}paidUsing`),
      namedNode(`${sfa}PaymentMethod_${randomPay.id}`),
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
          } catch (err) {
            // Silently fail RDF sync if server error
          }
        }
        resolve();
      });
    });

    if ((i + 1) % 50 === 0)
      console.log(`Step: ${i + 1} transactions created & synced to RDF...`);
  }

  console.log('Massive Seeding Finish!');
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DataFactory, Writer } from 'n3';

const { namedNode, literal } = DataFactory;

@Injectable()
export class RdfService {
  private readonly logger = new Logger(RdfService.name);
  private readonly fusekiUrl: string;
  private readonly fusekiDataset: string;
  private readonly authConfig: any = {};

  // Custom Namespace untuk Skripsi / Knowledge Graph kita
  private readonly sfa = 'http://student-finance-analyzer.com/ontology#';

  constructor(private readonly configService: ConfigService) {
    this.fusekiUrl =
      this.configService.get<string>('FUSEKI_URL') || 'http://localhost:3030';
    this.fusekiDataset =
      this.configService.get<string>('FUSEKI_DATASET') || 'sfa_dataset';

    // Opsional Autentikasi Fuseki
    const username = this.configService.get<string>('FUSEKI_USERNAME');
    const password = this.configService.get<string>('FUSEKI_PASSWORD');
    if (username && password) {
      this.authConfig = {
        auth: {
          username,
          password,
        },
      };
    }
  }

  /**
   * Mengkonversi object JSON Transaction dari PostgreSQL
   * menjadi serangkaian kalimat N-Triples (RDF)
   */
  private async convertTransactionToTriplesString(
    transaction: any,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Kita pakai format N-Triples karena strukturnya aman untuk blok INSERT DATA SPARQL
      const writer = new Writer({ format: 'N-Triples' });

      const trxNode = namedNode(`${this.sfa}Transaction_${transaction.id}`);
      const userNode = namedNode(`${this.sfa}User_${transaction.userId}`);

      // --- TRIPLE 1: Relasi User ke Transaksi ---
      writer.addQuad(userNode, namedNode(`${this.sfa}hasExpense`), trxNode);

      // --- TRIPLE 2 & 3: Metadata Transaksi (Tipe, Nominal, Tanggal) ---
      writer.addQuad(
        trxNode,
        namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        namedNode(`${this.sfa}Transaction`),
      );
      writer.addQuad(
        trxNode,
        namedNode(`${this.sfa}amount`),
        literal(transaction.amount),
      );

      const dateString = transaction.date
        ? new Date(transaction.date).toISOString()
        : new Date().toISOString();
      writer.addQuad(
        trxNode,
        namedNode(`${this.sfa}date`),
        literal(
          dateString,
          namedNode('http://www.w3.org/2001/XMLSchema#dateTime'),
        ),
      );

      // --- TRIPLE 4: Relasi ke Kategori ---
      if (transaction.categoryId) {
        const catNode = namedNode(
          `${this.sfa}Category_${transaction.categoryId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}hasCategory`), catNode);
      }

      // --- TRIPLE 5: Relasi ke Merchant ---
      if (transaction.merchantId) {
        const merchNode = namedNode(
          `${this.sfa}Merchant_${transaction.merchantId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}hasMerchant`), merchNode);
      }

      // --- TRIPLE 6: Relasi ke Metode Pembayaran ---
      if (transaction.paymentMethodId) {
        const payNode = namedNode(
          `${this.sfa}PaymentMethod_${transaction.paymentMethodId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}paidUsing`), payNode);
      }

      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result); // Berisi string syntax <Subject> <Predicate> <Object> .
      });
    });
  }

  /**
   * Menghapus seluruh data dari Knowledge Graph (Fuseki)
   * Berguna saat proses re-seeding agar data tidak duplikat/menumpuk
   */
  async clearKG() {
    try {
      this.logger.log(
        `Membersihkan Knowledge Graph di dataset: ${this.fusekiDataset}...`,
      );
      const updateEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/update`;
      const sparqlClearQuery = 'DELETE WHERE { ?s ?p ?o }';

      await axios.post(
        updateEndpoint,
        `update=${encodeURIComponent(sparqlClearQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          ...this.authConfig,
        },
      );
      this.logger.log('[SUCCESS] Knowledge Graph telah dibersihkan.');
    } catch (error) {
      this.logger.error(
        `❌ [FAILED] Gagal membersihkan Knowledge Graph`,
        error?.response?.data || error?.message || error,
      );
    }
  }

  /**
   * Fungsi pamungkas untuk dipanggil oleh transaction.service.ts
   * Melakukan SPARQL HTTP POST UPDATE ke server Apache Fuseki
   */
  async pushTransactionToKG(transaction: any) {
    try {
      this.logger.log(
        `Memulai konversi RDF & Sinkronisasi ke Fuseki untuk Transaksi ID: ${transaction.id}...`,
      );

      // 1. Generate NTriples String
      const triplesString =
        await this.convertTransactionToTriplesString(transaction);

      // 2. Bungkus ke dalam syntax SPARQL UPDATE (INSERT DATA)
      // Karena NTriples sudah berisi full absolute URI berlapis kurung siku <http://...>,
      // kita tidak butuh mendefinisikan PREFIX di atasnya lagi.
      const sparqlUpdateQuery = `INSERT DATA { \n${triplesString}\n }`;

      // 3. Endpoint Update Fuseki (secara default di /dataset_name/update)
      const updateEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/update`;

      // 4. Eksekusi Axios POST
      await axios.post(
        updateEndpoint,
        `update=${encodeURIComponent(sparqlUpdateQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          ...this.authConfig, // inject username/password basic auth jika ada di .env
        },
      );

      this.logger.log(
        `[SUCCESS] Knowledge Graph Fuseki Diperbarui! Triples untuk transaksi ${transaction.id} berhasil ditambahkan.`,
      );
    } catch (error) {
      this.logger.error(
        `❌ [FAILED] Gagal push RDF ke Fuseki untuk transaksi ${transaction.id}`,
        error?.response?.data || error?.message || error,
      );
      // Kita log saja errornya, sebisa mungkin tidak menge-stop / meng-crash API PostgreSQL utama kamu
      // (Mekanisme Fail-Safe).
    }
  }

  /**
   * Mengambil data Knowledge Graph dari Fuseki dan mengubahnya
   * ke bentuk Nodes & Edges yang dipahami oleh vis-network di Frontend.
   */
  async getGraphData() {
    try {
      this.logger.log('Mengambil data relasi (Nodes & Edges) dari Fuseki...');
      const queryEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/query`;

      // Ambil maksimum 1500 relasi agar browser tidak hang karena visualisasi terlalu berat.
      const sparqlQuery = `
        SELECT ?s ?p ?o
        WHERE { ?s ?p ?o }
        LIMIT 1500
      `;

      const response = await axios.post(
        queryEndpoint,
        `query=${encodeURIComponent(sparqlQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/sparql-results+json',
          },
          ...this.authConfig,
        },
      );

      const bindings = response.data.results.bindings;

      const nodesMap = new Map();
      const edges: any[] = [];
      let literalCounter = 0;

      // Helper function untuk mengambil bagian akhir dari URL sebagai Label
      const extractLabel = (uri: string): string => {
        if (!uri) return '';
        if (uri.includes('#')) return uri.split('#').pop() || uri;
        if (uri.includes('/')) return uri.split('/').pop() || uri;
        return uri;
      };

      // Tentukan kelompok node (untuk memberi warna yang berbeda di vis-network frontend)
      const getGroup = (label: string) => {
        if (label.startsWith('Transaction')) return 'transaction';
        if (label.startsWith('User')) return 'user';
        if (label.startsWith('Category')) return 'category';
        if (label.startsWith('Merchant')) return 'merchant';
        if (label.startsWith('PaymentMethod')) return 'payment';
        return 'default';
      };

      bindings.forEach((b: any) => {
        const s = b.s.value;
        const p = b.p.value;
        const o = b.o.value;
        const pLabel = extractLabel(p);

        // Abaikan tipe 'type' karena sering menebalkan node dengan node abstrak bawaan W3C
        if (pLabel === 'type') return;

        // Registrasi Node Subjek
        if (!nodesMap.has(s)) {
          const sLabel = extractLabel(s);
          nodesMap.set(s, { id: s, label: sLabel, group: getGroup(sLabel) });
        }

        if (b.o.type === 'uri') {
          // Object berupa Entitas (Node Merah, Biru, dll)
          if (!nodesMap.has(o)) {
            const oLabel = extractLabel(o);
            nodesMap.set(o, { id: o, label: oLabel, group: getGroup(oLabel) });
          }
          edges.push({
            from: s,
            to: o,
            label: pLabel,
          });
        } else {
          // Object berupa Literal (Teks, Angka, Tanggal) -> Kita buat node khusus berbentuk kotak
          literalCounter++;
          const literalId = `literal_node_${literalCounter}`;
          nodesMap.set(literalId, {
            id: literalId,
            label: o,
            shape: 'box',
            group: 'literal',
          });
          edges.push({
            from: s,
            to: literalId,
            label: pLabel,
          });
        }
      });

      return {
        nodes: Array.from(nodesMap.values()),
        edges,
      };
    } catch (error) {
      this.logger.error(
        `❌ [FAILED] Gagal mengambil Graph Data dari Fuseki`,
        error?.response?.data || error?.message || error,
      );
      throw error;
    }
  }

  /**
   * Mencari ID transaksi milik user yang berelasi dengan
   * kategori atau merchant yang cocok keyword — via SPARQL ke Fuseki.
   * Ini adalah inti dari "Semantic Web Search."
   *
   * Cara kerjanya (Hybrid Approach):
   * 1. Resolver: Temukan Category/Merchant IDs yang namanya cocok keyword (via param)
   * 2. SPARQL Query: Tanya Fuseki — transaksi mana (milik user ini) yang punya
   *    relasi sfa:hasCategory atau sfa:hasMerchant ke ID-ID tersebut?
   * 3. Return: Daftar UUID transaksi yang cocok
   */
  async searchTransactionIdsBySPARQL(
    userId: string,
    categoryIds: string[],
    merchantIds: string[],
  ): Promise<string[]> {
    try {
      const queryEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/query`;
      const userNode = `<${this.sfa}User_${userId}>`;

      // Bangun UNION filter berdasarkan kategori dan/atau merchant IDs
      const catFilters = categoryIds.map(
        (id) => `{ ?trx <${this.sfa}hasCategory> <${this.sfa}Category_${id}> }`,
      );
      const merFilters = merchantIds.map(
        (id) => `{ ?trx <${this.sfa}hasMerchant> <${this.sfa}Merchant_${id}> }`,
      );
      const allFilters = [...catFilters, ...merFilters];

      if (allFilters.length === 0) return [];

      const sparqlQuery = `
        PREFIX sfa: <${this.sfa}>
        SELECT DISTINCT ?trx WHERE {
          ${userNode} sfa:hasExpense ?trx .
          { ${allFilters.join(' UNION ')} }
        }
      `;

      const response = await axios.post(
        queryEndpoint,
        `query=${encodeURIComponent(sparqlQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/sparql-results+json',
          },
          ...this.authConfig,
        },
      );

      const bindings = response.data?.results?.bindings ?? [];

      // Extract UUID dari URI format: sfa:Transaction_<uuid>
      return bindings
        .map((b: any) => {
          const uri: string = b.trx?.value ?? '';
          return uri.split('Transaction_')[1] ?? null;
        })
        .filter(Boolean);
    } catch (error) {
      this.logger.error(
        '❌ [FAILED] SPARQL Search gagal, fallback ke Prisma',
        error?.response?.data || error?.message,
      );
      return []; // Kembalikan kosong agar service bisa fallback ke Prisma
    }
  }
}

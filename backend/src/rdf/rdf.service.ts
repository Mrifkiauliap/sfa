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
  private readonly sfa = 'http://student-finance-analyzer.com/ontology#';

  constructor(private readonly configService: ConfigService) {
    this.fusekiUrl =
      this.configService.get<string>('FUSEKI_URL') || 'http://localhost:3030';
    this.fusekiDataset =
      this.configService.get<string>('FUSEKI_DATASET') || 'sfa_dataset';

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
      const writer = new Writer({ format: 'N-Triples' });

      const trxNode = namedNode(`${this.sfa}Transaction_${transaction.id}`);
      const userNode = namedNode(`${this.sfa}User_${transaction.userId}`);

      writer.addQuad(userNode, namedNode(`${this.sfa}hasExpense`), trxNode);

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

      if (transaction.categoryId) {
        const catNode = namedNode(
          `${this.sfa}Category_${transaction.categoryId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}hasCategory`), catNode);
      }

      if (transaction.merchantId) {
        const merchNode = namedNode(
          `${this.sfa}Merchant_${transaction.merchantId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}hasMerchant`), merchNode);
      }

      if (transaction.paymentMethodId) {
        const payNode = namedNode(
          `${this.sfa}PaymentMethod_${transaction.paymentMethodId}`,
        );
        writer.addQuad(trxNode, namedNode(`${this.sfa}paidUsing`), payNode);
      }

      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });
  }

  /**
   * Menghapus seluruh data dari Knowledge Graph (Fuseki)
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
   * Melakukan SPARQL HTTP POST UPDATE ke server Apache Fuseki
   */
  async pushTransactionToKG(transaction: any) {
    try {
      this.logger.log(
        `Memulai konversi RDF & Sinkronisasi ke Fuseki untuk Transaksi ID: ${transaction.id}...`,
      );

      const triplesString =
        await this.convertTransactionToTriplesString(transaction);

      const sparqlUpdateQuery = `INSERT DATA { \n${triplesString}\n }`;
      const updateEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/update`;

      await axios.post(
        updateEndpoint,
        `update=${encodeURIComponent(sparqlUpdateQuery)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          ...this.authConfig,
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

      const extractLabel = (uri: string): string => {
        if (!uri) return '';
        if (uri.includes('#')) return uri.split('#').pop() || uri;
        if (uri.includes('/')) return uri.split('/').pop() || uri;
        return uri;
      };

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

        if (pLabel === 'type') return;

        if (!nodesMap.has(s)) {
          const sLabel = extractLabel(s);
          nodesMap.set(s, { id: s, label: sLabel, group: getGroup(sLabel) });
        }

        if (b.o.type === 'uri') {
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
   */
  async searchTransactionIdsBySPARQL(
    userId: string,
    categoryIds: string[],
    merchantIds: string[],
    paymentMethodIds: string[] = [],
  ): Promise<string[]> {
    try {
      const queryEndpoint = `${this.fusekiUrl}/${this.fusekiDataset}/query`;
      const userNode = `<${this.sfa}User_${userId}>`;

      if (
        !categoryIds.length &&
        !merchantIds.length &&
        !paymentMethodIds.length
      )
        return [];

      let filters = '';

      if (categoryIds.length > 0) {
        const uris = categoryIds
          .map((id) => `<${this.sfa}Category_${id}>`)
          .join(' ');
        filters += `
          ?trx <${this.sfa}hasCategory> ?cat .
          VALUES ?cat { ${uris} }
        `;
      }

      if (merchantIds.length > 0) {
        const uris = merchantIds
          .map((id) => `<${this.sfa}Merchant_${id}>`)
          .join(' ');
        filters += `
          ?trx <${this.sfa}hasMerchant> ?mer .
          VALUES ?mer { ${uris} }
        `;
      }

      if (paymentMethodIds.length > 0) {
        const uris = paymentMethodIds
          .map((id) => `<${this.sfa}PaymentMethod_${id}>`)
          .join(' ');
        filters += `
          ?trx <${this.sfa}paidUsing> ?pay .
          VALUES ?pay { ${uris} }
        `;
      }

      const sparqlQuery = `
        PREFIX sfa: <${this.sfa}>
        SELECT DISTINCT ?trx WHERE {
          ${userNode} sfa:hasExpense ?trx .
          ${filters}
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
      return [];
    }
  }
}

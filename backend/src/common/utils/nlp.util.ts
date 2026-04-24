import dayjs from 'dayjs';

export interface NlpResult {
  dateRange: { start: Date; end: Date } | null;
  tokens: string[];
  originalQuery: string;
}

export class NlpUtil {
  private static readonly stopWords = [
    'dan',
    'dengan',
    'pakai',
    'pake',
    'menggunakan',
    'di',
    'ke',
    'dari',
    'untuk',
    'yang',
    'beli',
    'bayar',
    'buat',
    'hari',
    'ini',
    'kemarin',
    'minggu',
    'lalu',
    'bulan',
  ];

  public static parseQuery(query: string): NlpResult {
    const lowerQuery = query.toLowerCase().trim();
    let dateRange: { start: Date; end: Date } | null = null;
    const now = dayjs();
    let usedPhrase = '';

    const daysAgoMatch = lowerQuery.match(/(\d+)\s*hari\s*lalu/);

    if (lowerQuery.includes('hari ini')) {
      dateRange = {
        start: now.startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      };
      usedPhrase = 'hari ini';
    } else if (lowerQuery.includes('kemarin')) {
      const yesterday = now.subtract(1, 'day');
      dateRange = {
        start: yesterday.startOf('day').toDate(),
        end: yesterday.endOf('day').toDate(),
      };
      usedPhrase = 'kemarin';
    } else if (daysAgoMatch) {
      const days = parseInt(daysAgoMatch[1]);
      const target = now.subtract(days, 'day');
      dateRange = {
        start: target.startOf('day').toDate(),
        end: target.endOf('day').toDate(),
      };
      usedPhrase = daysAgoMatch[0];
    } else if (lowerQuery.includes('minggu lalu')) {
      const lastWeek = now.subtract(1, 'week');
      dateRange = {
        start: lastWeek.startOf('week').toDate(),
        end: lastWeek.endOf('week').toDate(),
      };
      usedPhrase = 'minggu lalu';
    } else if (lowerQuery.includes('minggu ini')) {
      dateRange = {
        start: now.startOf('week').toDate(),
        end: now.endOf('week').toDate(),
      };
      usedPhrase = 'minggu ini';
    } else if (lowerQuery.includes('bulan lalu')) {
      const lastMonth = now.subtract(1, 'month');
      dateRange = {
        start: lastMonth.startOf('month').toDate(),
        end: lastMonth.endOf('month').toDate(),
      };
      usedPhrase = 'bulan lalu';
    } else if (lowerQuery.includes('bulan ini')) {
      dateRange = {
        start: now.startOf('month').toDate(),
        end: now.endOf('month').toDate(),
      };
      usedPhrase = 'bulan ini';
    } else if (lowerQuery.includes('tahun ini')) {
      dateRange = {
        start: now.startOf('year').toDate(),
        end: now.endOf('year').toDate(),
      };
      usedPhrase = 'tahun ini';
    }

    let cleanQuery = lowerQuery;
    if (usedPhrase) {
      cleanQuery = lowerQuery.replace(usedPhrase, '').trim();
    }
    cleanQuery = cleanQuery.replace(/[^\w\s]/g, ' ');

    const rawTokens = cleanQuery.split(/\s+/).filter((t) => t.length > 1);
    const filteredRaw = rawTokens.filter((t) => !this.stopWords.includes(t));

    if (filteredRaw.length === 0) {
      return { tokens: [], dateRange, originalQuery: query };
    }

    const tokens: string[] = [...filteredRaw];
    for (let i = 0; i < filteredRaw.length - 1; i++) {
      tokens.push(`${filteredRaw[i]} ${filteredRaw[i + 1]}`);
    }
    for (let i = 0; i < filteredRaw.length - 2; i++) {
      tokens.push(
        `${filteredRaw[i]} ${filteredRaw[i + 1]} ${filteredRaw[i + 2]}`,
      );
    }

    return {
      tokens: [...new Set(tokens)],
      dateRange,
      originalQuery: query,
    };
  }
}

import { PrismaClient } from '@prisma/client';

export default async function merchantSeed(prisma: PrismaClient) {
  console.log('Seeding Merchants...');
  const merchants = [
    // ── Makan & Minum ──────────────────────────────────────────────
    {
      name: 'Gacoan',
      description: 'Mie pedas favorit mahasiswa',
      location: 'Pusat Kota',
    },
    {
      name: 'Kantin Fakultas',
      description: 'Kantin resmi area kampus, menu lengkap',
      location: 'Area Kampus',
    },
    {
      name: 'Warteg Pak Udin',
      description: 'Warteg murah nasi rames lauk pilihan',
      location: 'Area Kos',
    },
    {
      name: 'Kopi Kenangan',
      description: 'Kopi kekinian buat begadang atau nugas',
      location: 'Pusat Kota',
    },
    {
      name: 'Geprek Bensu',
      description: 'Ayam geprek crispy, harga terjangkau',
      location: 'Area Sekitar Kampus',
    },
    {
      name: 'Mie Ayam Pak Slamet',
      description: 'Mie ayam bakso legendaris dekat kos',
      location: 'Area Kos',
    },
    {
      name: 'McDonalds',
      description: 'Fast food burger, treat diri sendiri',
      location: 'Mall Terdekat',
    },
    {
      name: 'Bakso Malang Bakar',
      description: 'Jajanan sore favorit mahasiswa',
      location: 'Area Kampus',
    },

    // ── Pendidikan ─────────────────────────────────────────────────
    {
      name: 'Fotokopi Sumber Ilmu',
      description: 'Print, fotokopi, jilid skripsi',
      location: 'Area Kampus',
    },
    {
      name: 'Gramedia',
      description: 'Toko buku dan alat tulis',
      location: 'Pusat Kota',
    },
    {
      name: 'Print Center Kampus',
      description: 'Tempat print tepat guna dekat lab',
      location: 'Area Kampus',
    },

    // ── Transportasi ───────────────────────────────────────────────
    {
      name: 'SPBU Shell',
      description: 'Isi bensin kendaraan pribadi',
      location: 'Jalan Raya',
    },
    {
      name: 'Gojek',
      description: 'Ojek online, GoFood, GoRide',
      location: 'Online',
    },
    {
      name: 'Grab',
      description: 'Ojek dan taksi online',
      location: 'Online',
    },

    // ── Kos & Utilitas ─────────────────────────────────────────────
    {
      name: 'Bu Ratna Kos',
      description: 'Pembayaran sewa kamar kos bulanan',
      location: 'Area Kos',
    },
    {
      name: 'PLN Mobile',
      description: 'Token listrik kos',
      location: 'Online',
    },

    // ── Belanja & Kebutuhan ────────────────────────────────────────
    {
      name: 'Indomaret',
      description: 'Minimarket kebutuhan sehari-hari',
      location: 'Area Kos',
    },
    {
      name: 'Alfamart',
      description: 'Minimarket 24 jam serba ada',
      location: 'Area Kampus',
    },
    {
      name: 'Shopee',
      description: 'Belanja online kebutuhan pakaian & barang',
      location: 'Online',
    },

    // ── Hiburan & Sosial ───────────────────────────────────────────
    {
      name: 'Cinema XXI',
      description: 'Bioskop nonton film terbaru',
      location: 'Mall Terdekat',
    },
    {
      name: 'Kafe Anak Senja',
      description: 'Kafe estetik, cocok nugas atau nongkrong',
      location: 'Pusat Kota',
    },
    {
      name: 'Timezone',
      description: 'Arena permainan hiburan keluarga dan teman',
      location: 'Mall Terdekat',
    },

    // ── Kesehatan ──────────────────────────────────────────────────
    {
      name: 'Apotek K-24',
      description: 'Beli obat dan vitamin 24 jam',
      location: 'Area Kos',
    },
    {
      name: 'Klinik Sehat Kampus',
      description: 'Periksa kesehatan ringan untuk mahasiswa',
      location: 'Area Kampus',
    },

    // ── Pulsa & Internet ───────────────────────────────────────────
    {
      name: 'Konter Pulsa Jaya',
      description: 'Top up pulsa dan paket data semua operator',
      location: 'Area Kos',
    },
  ];

  for (const m of merchants) {
    await prisma.merchant.upsert({
      where: { name: m.name },
      update: { location: m.location, description: m.description },
      create: m,
    });
  }
}

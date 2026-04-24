# Student Finance Analyzer (SFA)

**Rancang Bangun Sistem Analisis Pola Pengeluaran Mahasiswa Menggunakan Financial Knowledge Graph dan Algoritma Apriori**

Proyek ini adalah sistem analisis keuangan berbasis _Semantic Web_ dan _Data Mining_ yang dirancang untuk membantu mahasiswa memahami pola pengeluaran mereka melalui visualisasi graf yang interaktif dan algoritma asosiasi.

---

## Informasi Penting (Penyimpanan Source Code)

**PENTING:** Repository ini tidak menyediakan folder _source code_ secara terbuka (unzipped) untuk keperluan efisiensi penyimpanan dan struktur folder tertentu.

Untuk mendapatkan kode lengkap proyek ini:

1. Jangan gunakan perintah `git clone`.
2. Silakan **Download file .zip** yang tersedia di repository ini atau cek di bagian **Releases**.
3. Ekstrak file ZIP tersebut di komputer lokal Anda untuk melihat folder `frontend` dan `backend`.

---

## Fitur Utama

- **Financial Knowledge Graph:** Visualisasi data transaksi dalam bentuk graf menggunakan RDF (Resource Description Framework) dan Apache Fuseki.
- **Algoritma Apriori:** Penemuan pola kebiasaan belanja otomatis melalui _Market Basket Analysis_ (Association Rules).
- **Hybrid Semantic Search:** Pencarian transaksi cerdas berbasis NLP (Natural Language Processing) yang menggabungkan query SQL (PostgreSQL) dan SPARQL (Fuseki).
- **Interactive Visualization:** Graf interaktif menggunakan `vis-network` dengan _overlay_ garis emas untuk pola Apriori.

## Tech Stack

### Frontend

- **Framework:** Nuxt 4 (Vue.js 3)
- **Styling:** Tailwind CSS v4
- **Components:** Shadcn-Vue & Reka UI
- **Graph:** vis-network

### Backend

- **Framework:** NestJS (Node.js)
- **ORM:** Prisma
- **RDF Parser:** n3
- **Auth:** JWT (JSON Web Token)

### Databases

- **Relational:** PostgreSQL (Data Transaksional)
- **Graph:** Apache Jena Fuseki (Data Semantik)

## Cara Menjalankan (Local Setup)

Setelah mengekstrak file ZIP:

1. **Setup Database:**
   - Pastikan PostgreSQL dan Apache Fuseki sudah berjalan.
   - Buat dataset di Fuseki dengan nama yang sesuai di `.env`.

2. **Backend:**

   ```bash
   cd backend
   npm install
   npx prisma generate
   npm run start:dev
   ```

3. Frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

# Tongkrongan ST04 — Platform Manajemen Kelas & Angkatan Mahasiswa

**Tongkrongan ST04** adalah aplikasi web modern berbasis **Next.js 15, TypeScript, Tailwind CSS, Shadcn UI, Firebase, dan Chart.js** untuk mengelola informasi akademik, kolaborasi kelompok, transparansi kas kelas, buku angkatan digital, dan dokumentasi untuk **100 mahasiswa kelas ST04 IPB University**.

---

## Fitur Utama & Modul Terintegrasi

1. **MODUL 1 — Dashboard Utama**: Metrik real-time (100 mahasiswa, 6 MK aktif, saldo kas, deadline terdekat), widget progres kolektibilitas kas, komposisi fakultas, jadwal hari ini, dan pengumuman terbaru.
2. **MODUL 2 — Portal Kelas**: Papan pengumuman berprioritas (filter: *Akademik, Keuangan, Acara*) dengan lampiran, kalender kegiatan (*Jadwal kuliah, Praktikum, Kegiatan kelas, Deadline tugas*), dan 5 link penting (*LMS, Google Drive, WhatsApp Group, Telegram, Zoom*).
3. **MODUL 3 — Kas Kelas**: Dashboard keuangan (Saldo, Pemasukan, Pengeluaran), CRUD transaksi 5 kategori, matriks status iuran 100 mahasiswa, 3 grafik analitik Chart.js, serta export **PDF & Excel**.
4. **MODUL 4 — Group Manager**: Penyimpanan kelompok praktikum & tugas per mata kuliah beserta fitur **Pencarian Mahasiswa Lintas Mata Kuliah** (ketik *"Moch"* untuk melihat seluruh kelompoknya di Biokimia, Botani, Statistika, dan Agronomi).
5. **MODUL 5 — Randomizer Kelompok**: Generator kelompok pintar dengan **5 Mode** (*Random biasa, Gender, Fakultas, Prodi, dan Anti-duplikasi anggota*), riwayat randomisasi tersimpan, serta export **PDF, Excel, dan Copy to Clipboard**.
6. **MODUL 6 — Buku Angkatan Digital**: Direktori lengkap 100 mahasiswa ST04 dengan biodata, kontak, motto hidup, minat, hobi, keahlian, prestasi, serta pencarian multi-kriteria.
7. **MODUL 7 — Manajemen Dokumen**: Repositori 4 folder (*Materi kuliah, Modul praktikum, Soal tahun lalu, Template laporan*) dengan fitur upload, download counter, search, dan filter tag kategori.
8. **MODUL 8 — Profil Mahasiswa**: Halaman profil pribadi dengan editor biodata, riwayat kelompok, riwayat pembayaran kas, jadwal kuliah, dan portofolio aktivitas kelas.
9. **MODUL 10 — Panel Admin (RBAC)**: Area khusus pengurus (*Komti, Wakomti, Bendahara, Sekretaris*) untuk CRUD data mahasiswa, pengaturan role pengguna, pengelolaan mata kuliah, pengumuman, dan kas.

---

## Cara Menjalankan Proyek Secara Lokal

```bash
# 1. Masuk ke direktori proyek
cd tongkrongan-st04

# 2. Instal dependensi
npm install

# 3. (Opsional) Salin .env.example menjadi .env.local dan isi kredensial Firebase Anda
cp .env.example .env.local

# 4. Jalankan server pengembangan
npm run dev
```

Buka `http://localhost:3000` di browser Anda.

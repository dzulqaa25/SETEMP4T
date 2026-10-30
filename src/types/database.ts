/**
 * TONGKRONGAN ST04 - DATABASE SCHEMA & TYPESCRIPT INTERFACES
 * Relasi database dinormalisasi dengan Primary Key (id) dan Foreign Key (*Id / *Ids)
 * Siap digunakan untuk Firestore Collections maupun SQL/PostgreSQL.
 */

export type UserRole = 'komti' | 'wakomti' | 'bendahara' | 'sekretaris' | 'mahasiswa';

export type GenderType = 'L' | 'P';

export type FakultasIPB =
  | 'Fakultas Pertanian'
  | 'Fakultas Perikanan dan Ilmu Kelautan'
  | 'Fakultas Matematika dan Ilmu Pengetahuan Alam'
  | 'Fakultas Kedokteran Hewan'
  | 'Fakultas Peternakan'
  | 'Fakultas Kehutanan dan Lingkungan'
  | 'Fakultas Teknologi Pertanian'
  | 'Fakultas Ekonomi dan Manajemen'
  | 'Fakultas Ekologi Manusia'
  | 'Sekolah Bisnis';

export type JalurMasukIPB = 'SNBP' | 'SNBT' | 'MANDIRI';

export interface TentangSaya {
  mottoHidup: string;
  hobi: string[];
  minat: string[];
  keahlian: string[];
  prestasi: string[];
}

export interface AktivitasMahasiswa {
  id: string;
  judul: string;
  tanggal: string;
  kategori: 'Akademik' | 'Organisasi' | 'Kepanitiaan' | 'Kompetisi';
  peran: string;
}

/**
 * ENTITAS 1: Mahasiswa
 * Menyimpan profil lengkap mahasiswa ST04 (~100 mahasiswa), role pengguna, dan buku angkatan.
 */
export interface Mahasiswa {
  id: string;
  nim: string;
  namaLengkap: string;
  namaPanggilan: string;
  fotoUrl: string;
  gender: GenderType;
  fakultas: FakultasIPB;
  programStudi: string;
  kelas: string; // Default: "ST04"
  domisili: string; // Asrama / Kost / Rumah
  asalDaerah: string;
  tanggalLahir?: string;
  jalurMasuk?: JalurMasukIPB;
  password?: string;
  email: string;
  whatsapp: string;
  instagram: string;
  linkedin: string;
  tentangSaya: TentangSaya;
  role: UserRole;
  statusAktif: boolean;
  aktivitasKelas: AktivitasMahasiswa[];
  createdAt: string;
  updatedAt: string;
}

/**
 * ENTITAS 2: MataKuliah
 * Menyimpan daftar mata kuliah aktif yang diambil kelas ST04.
 */
export interface MataKuliah {
  id: string;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  dosenKoordinator: string;
  hariKuliah: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  jamKuliah: string;
  ruangan: string;
  hariPraktikum?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamPraktikum?: string;
  ruangPraktikum?: string;
  warnaLabel: string;
  isActive: boolean;
}

/**
 * ENTITAS 3: Kelompok
 * Menyimpan kelompok tugas dan praktikum dengan relasi ke MataKuliah dan Mahasiswa.
 */
export interface Kelompok {
  id: string;
  mataKuliahId: string; // FK -> MataKuliah.id
  namaKelompok: string; // Contoh: "Kelompok 1"
  jenis: 'Praktikum' | 'Tugas';
  ketuaId: string; // FK -> Mahasiswa.id
  anggotaIds: string[]; // FK -> Mahasiswa.id[]
  topikTugas?: string;
  createdAt: string;
}

export type StatusPembayaranKas = 'Lunas' | 'Belum Lunas' | 'Menunggu Verifikasi';

/**
 * ENTITAS 4: PembayaranKas
 * Menyimpan status iuran kas bulanan masing-masing mahasiswa (Relasi Many-to-One ke Mahasiswa).
 */
export interface PembayaranKas {
  id: string;
  mahasiswaId: string; // FK -> Mahasiswa.id
  bulan: string; // Contoh: "Oktober 2026"
  periodeKey: string; // Contoh: "2026-10"
  nominal: number;
  status: StatusPembayaranKas;
  tanggalPembayaran: string | null;
  metodePembayaran?: 'QRIS' | 'Transfer Bank' | 'Tunai';
  catatan?: string;
  verifiedById?: string; // FK -> Mahasiswa.id (Bendahara/Komti)
}

export type KategoriTransaksiKas =
  | 'Iuran kelas'
  | 'Konsumsi'
  | 'Acara'
  | 'Operasional'
  | 'Lainnya';

/**
 * ENTITAS 5: TransaksiKas
 * Menyimpan arus kas pemasukan dan pengeluaran kelas ST04.
 */
export interface TransaksiKas {
  id: string;
  tanggal: string; // YYYY-MM-DD
  judul: string;
  deskripsi: string;
  tipe: 'Pemasukan' | 'Pengeluaran';
  kategori: KategoriTransaksiKas;
  nominal: number;
  createdById: string; // FK -> Mahasiswa.id
  buktiUrl?: string;
  createdAt: string;
}

export type KategoriPengumuman = 'Akademik' | 'Keuangan' | 'Acara';
export type PrioritasPengumuman = 'Tinggi' | 'Sedang' | 'Rendah';

export interface LampiranPengumuman {
  nama: string;
  url: string;
  ukuran: string;
  tipe: 'PDF' | 'DOCX' | 'IMAGE' | 'LINK';
}

/**
 * ENTITAS 6: Pengumuman
 * Menyimpan pengumuman kelas beserta lampiran, kategori, dan prioritas.
 */
export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  tanggal: string; // YYYY-MM-DD
  kategori: KategoriPengumuman;
  prioritas: PrioritasPengumuman;
  lampiran: LampiranPengumuman[];
  penulisId: string; // FK -> Mahasiswa.id
  penulisNama: string;
  penulisRole: UserRole;
  isPinned?: boolean;
}

export type JenisJadwal =
  | 'Jadwal kuliah'
  | 'Praktikum'
  | 'Kegiatan kelas'
  | 'Deadline tugas';

/**
 * ENTITAS 7: Jadwal
 * Menyimpan jadwal kuliah harian, praktikum, kegiatan kelas, dan deadline tugas terdekat.
 */
export interface Jadwal {
  id: string;
  judul: string;
  deskripsi: string;
  jenis: JenisJadwal;
  mataKuliahId?: string; // Optional FK -> MataKuliah.id
  tanggal: string; // YYYY-MM-DD
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  waktuMulai: string; // HH:mm
  waktuSelesai: string; // HH:mm
  lokasi: string;
  isRecurringWeekly?: boolean;
}

export type FolderDokumen =
  | 'Materi kuliah'
  | 'Modul praktikum'
  | 'Soal tahun lalu'
  | 'Template laporan';

/**
 * ENTITAS 8: Dokumen
 * Menyimpan repositori dokumen akademik dan administrasi kelas ST04.
 */
export interface Dokumen {
  id: string;
  judul: string;
  deskripsi: string;
  folder: FolderDokumen;
  mataKuliahId?: string; // Optional FK -> MataKuliah.id
  tags: string[];
  namaFile: string;
  ukuranFile: string;
  tipeFile: 'PDF' | 'DOCX' | 'PPTX' | 'XLSX' | 'ZIP';
  fileUrl: string;
  uploadedById: string; // FK -> Mahasiswa.id
  uploadedByNama: string;
  tanggalUpload: string; // YYYY-MM-DD
  jumlahDownload: number;
}

export type ModeRandomizer =
  | 'Random biasa'
  | 'Random berdasarkan Gender'
  | 'Random berdasarkan Fakultas'
  | 'Random berdasarkan Prodi'
  | 'Anti-duplikasi anggota';

export interface HasilKelompokRandomizer {
  nomorKelompok: number;
  namaKelompok: string;
  ketuaId: string; // FK -> Mahasiswa.id
  anggotaIds: string[]; // FK -> Mahasiswa.id[]
}

/**
 * ENTITAS 9: RiwayatRandomisasi
 * Menyimpan histori pembagian kelompok otomatis untuk analisis dan fitur anti-duplikasi.
 */
export interface RiwayatRandomisasi {
  id: string;
  judul: string;
  mataKuliahId?: string; // Optional FK -> MataKuliah.id
  tanggal: string; // ISO string / YYYY-MM-DD HH:mm
  mode: ModeRandomizer;
  jumlahKelompok: number;
  targetAnggotaPerKelompok: number;
  totalMahasiswa: number;
  skorAntiDuplikasi: number; // 0 - 100%
  hasilKelompok: HasilKelompokRandomizer[];
  createdById: string; // FK -> Mahasiswa.id
}

/**
 * ENTITAS PENDUKUNG: LinkPenting (MODUL 2 - Portal Kelas)
 */
export interface LinkPenting {
  id: string;
  kategori: 'LMS' | 'Google Drive' | 'WhatsApp Group' | 'Telegram' | 'Zoom';
  judul: string;
  deskripsi: string;
  url: string;
  badgeText?: string;
}

/**
 * Navigasi Aplikasi SETEMP4T
 */
export type ActiveModuleId =
  | 'dashboard'
  | 'kas-kelas'
  | 'group-manager'
  | 'profil-mahasiswa'
  | 'panel-admin';

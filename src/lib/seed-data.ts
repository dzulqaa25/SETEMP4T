import {
  Dokumen,
  FakultasIPB,
  Jadwal,
  JalurMasukIPB,
  Kelompok,
  LinkPenting,
  Mahasiswa,
  MataKuliah,
  PembayaranKas,
  Pengumuman,
  RiwayatRandomisasi,
  TransaksiKas,
  UserRole,
} from '@/types/database';

/**
 * PEMETAAN KODE NIM IPB UNIVERSITY -> FAKULTAS & PROGRAM STUDI
 * Huruf pertama = Fakultas (A = FAPERTA, C = FPIK, G = FMIPA)
 * Angka setelahnya = Departemen / Program Studi
 */
export function getFakultasProdiFromNim(nim: string): {
  fakultas: FakultasIPB;
  prodi: string;
} {
  const code = nim.trim().toUpperCase().slice(0, 3);
  switch (code) {
    case 'A04':
      return {
        fakultas: 'Fakultas Pertanian',
        prodi: 'Smart Agriculture',
      };
    case 'A14':
      return {
        fakultas: 'Fakultas Pertanian',
        prodi: 'Manajemen Sumberdaya Lahan',
      };
    case 'A24':
      return {
        fakultas: 'Fakultas Pertanian',
        prodi: 'Agronomi dan Hortikultura',
      };
    case 'A34':
      return {
        fakultas: 'Fakultas Pertanian',
        prodi: 'Proteksi Tanaman',
      };
    case 'A44':
      return {
        fakultas: 'Fakultas Pertanian',
        prodi: 'Arsitektur Lanskap',
      };
    case 'C34':
      return {
        fakultas: 'Fakultas Perikanan dan Ilmu Kelautan',
        prodi: 'Teknologi Hasil Perairan',
      };
    case 'C54':
      return {
        fakultas: 'Fakultas Perikanan dan Ilmu Kelautan',
        prodi: 'Ilmu dan Teknologi Kelautan',
      };
    case 'G34':
      return {
        fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        prodi: 'Biologi',
      };
    default:
      if (code.startsWith('A')) {
        return { fakultas: 'Fakultas Pertanian', prodi: 'Fakultas Pertanian' };
      }
      if (code.startsWith('C')) {
        return {
          fakultas: 'Fakultas Perikanan dan Ilmu Kelautan',
          prodi: 'Fakultas Perikanan dan Ilmu Kelautan',
        };
      }
      return {
        fakultas: 'Fakultas Matematika dan Ilmu Pengetahuan Alam',
        prodi: 'Biologi',
      };
  }
}

interface ExtraCsvDetail {
  namaPanggilan?: string;
  asalDaerah?: string;
  domisili?: string;
  tanggalLahir?: string;
  jalurMasuk?: JalurMasukIPB;
  gender: 'L' | 'P';
  role?: UserRole;
}

/**
 * Detail tambahan dari CSV untuk mahasiswa yang sudah mengisi biodata awal
 */
const CSV_DETAILS_BY_NIM: Record<string, ExtraCsvDetail> = {
  C5401261032: { namaPanggilan: 'Raditya', asalDaerah: 'Depok / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-12-10', jalurMasuk: 'SNBP', gender: 'L', role: 'komti' },
  A2401261152: { namaPanggilan: 'Moch', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Rumah', tanggalLahir: '2008-02-05', jalurMasuk: 'SNBT', gender: 'L', role: 'wakomti' },
  C3401261024: { namaPanggilan: 'Putri', asalDaerah: 'Berastagi / Sumatera Utara', domisili: 'Asrama', tanggalLahir: '2007-10-08', jalurMasuk: 'SNBP', gender: 'P', role: 'bendahara' },
  A0401261014: { namaPanggilan: 'Cheryl', asalDaerah: 'Depok / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-06-19', jalurMasuk: 'SNBP', gender: 'P', role: 'sekretaris' },
  A0401261010: { namaPanggilan: 'Rizkia', asalDaerah: 'Cianjur / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-03-20', jalurMasuk: 'SNBP', gender: 'P' },
  A0401261039: { namaPanggilan: 'Agha', asalDaerah: 'Medan Johor / Sumatera Utara', domisili: 'Asrama', tanggalLahir: '2008-10-18', jalurMasuk: 'MANDIRI', gender: 'L' },
  A0401261040: { namaPanggilan: 'Rehan', asalDaerah: 'Depok / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-03-25', jalurMasuk: 'MANDIRI', gender: 'L' },
  A1401261008: { namaPanggilan: 'Dini', asalDaerah: 'Cibinong / Bogor', domisili: 'Kost', tanggalLahir: '2007-09-20', jalurMasuk: 'SNBP', gender: 'P' },
  A1401261029: { namaPanggilan: 'Shafa', asalDaerah: 'Kab. Pekalongan / Jawa Tengah', domisili: 'Asrama', tanggalLahir: '2008-05-31', jalurMasuk: 'SNBP', gender: 'P' },
  A1401261042: { namaPanggilan: 'Davina', asalDaerah: 'Palembang / Sumatera Selatan', domisili: 'Kost', tanggalLahir: '2008-10-04', jalurMasuk: 'SNBT', gender: 'P' },
  A1401261044: { namaPanggilan: 'Raihan', asalDaerah: 'Bekasi / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2007-10-10', jalurMasuk: 'SNBT', gender: 'L' },
  A1401261054: { namaPanggilan: 'Wanda', asalDaerah: 'Bandung / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-11-03', jalurMasuk: 'SNBT', gender: 'P' },
  A1401261082: { namaPanggilan: 'Syarif', asalDaerah: 'Citeureup, Bogor / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-10-20', jalurMasuk: 'MANDIRI', gender: 'L' },
  A1401261094: { namaPanggilan: 'Madelaine', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Rumah', tanggalLahir: '2008-08-14', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261015: { namaPanggilan: 'Abi', asalDaerah: 'Tuban / Jawa Timur', domisili: 'Asrama', tanggalLahir: '2008-01-10', jalurMasuk: 'SNBP', gender: 'L' },
  A2401261016: { namaPanggilan: 'Keysa', asalDaerah: 'Medan / Sumatera Utara', domisili: 'Asrama', tanggalLahir: '2008-04-05', jalurMasuk: 'SNBP', gender: 'P' },
  A2401261027: { namaPanggilan: 'Shofiyyah', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-01-31', jalurMasuk: 'SNBP', gender: 'P' },
  A2401261042: { namaPanggilan: 'Carissa', asalDaerah: 'Palabuhanratu / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-08-16', jalurMasuk: 'SNBP', gender: 'P' },
  A2401261069: { namaPanggilan: 'Istaufa', asalDaerah: 'Sragen / Jawa Tengah', domisili: 'Kost', tanggalLahir: '2007-07-31', jalurMasuk: 'SNBP', gender: 'P' },
  A2401261070: { namaPanggilan: 'Reza', asalDaerah: 'Garut / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-07-29', jalurMasuk: 'SNBP', gender: 'L' },
  A2401261085: { namaPanggilan: 'Shevta', asalDaerah: 'Siak / Riau', domisili: 'Asrama', tanggalLahir: '2007-09-04', jalurMasuk: 'SNBP', gender: 'P' },
  A2401261126: { namaPanggilan: 'Covenant', asalDaerah: 'Tangerang Selatan / Banten', domisili: 'Asrama', tanggalLahir: '2008-01-10', jalurMasuk: 'SNBT', gender: 'L' },
  A2401261143: { namaPanggilan: 'Nayara', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-06-19', jalurMasuk: 'SNBT', gender: 'P' },
  A2401261160: { namaPanggilan: 'Salman', asalDaerah: 'Jember / Jawa Timur', domisili: 'Kost', tanggalLahir: '2007-06-27', jalurMasuk: 'SNBT', gender: 'L' },
  A2401261162: { namaPanggilan: 'Huda', asalDaerah: 'Surabaya / Jawa Timur', domisili: 'Asrama', tanggalLahir: '2007-12-25', jalurMasuk: 'SNBT', gender: 'L' },
  A2401261170: { namaPanggilan: 'Seni', asalDaerah: 'Cimahpar, Bogor / Jawa Barat', domisili: 'Rumah', tanggalLahir: '2008-10-03', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261177: { namaPanggilan: 'Zidane', asalDaerah: 'Empat Lawang / Sumatera Selatan', domisili: 'Asrama', tanggalLahir: '2008-04-26', jalurMasuk: 'MANDIRI', gender: 'L' },
  A2401261187: { namaPanggilan: 'Faiza', asalDaerah: 'Jambi', domisili: 'Asrama', tanggalLahir: '2008-07-21', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261190: { namaPanggilan: 'Wira', asalDaerah: 'Semarang / Jawa Tengah', domisili: 'Asrama', tanggalLahir: '2008-05-02', jalurMasuk: 'MANDIRI', gender: 'L' },
  A2401261210: { namaPanggilan: 'Anggraini', asalDaerah: 'Purwakarta / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-12-25', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261244: { namaPanggilan: 'Adzra', asalDaerah: 'Depok / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-09-19', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261253: { namaPanggilan: 'Erlando', asalDaerah: 'Jambi', domisili: 'Kost', tanggalLahir: '2008-10-07', jalurMasuk: 'MANDIRI', gender: 'L' },
  A2401261255: { namaPanggilan: 'Elfarinka', asalDaerah: 'Jakarta Pusat / DKI Jakarta', domisili: 'Kost', tanggalLahir: '2008-02-15', jalurMasuk: 'MANDIRI', gender: 'P' },
  A2401261263: { namaPanggilan: 'Brigitha', asalDaerah: 'Jayapura / Papua', domisili: 'Asrama', tanggalLahir: '2008-04-12', jalurMasuk: 'MANDIRI', gender: 'P' },
  A3401261027: { namaPanggilan: 'Aisha', asalDaerah: 'Tangerang / Banten', domisili: 'Asrama', tanggalLahir: '2007-03-29', jalurMasuk: 'SNBP', gender: 'P' },
  A3401261037: { namaPanggilan: 'Zhafirah', asalDaerah: 'Pekanbaru / Riau', domisili: 'Kost', tanggalLahir: '2008-04-24', jalurMasuk: 'SNBP', gender: 'P' },
  A3401261080: { namaPanggilan: 'Arga', asalDaerah: 'Medan / Sumatera Utara', domisili: 'Kost', tanggalLahir: '2008-04-08', jalurMasuk: 'MANDIRI', gender: 'L' },
  A3401261091: { namaPanggilan: 'Nezara', asalDaerah: 'Palembang / Sumatera Selatan', domisili: 'Kost', tanggalLahir: '2008-12-05', jalurMasuk: 'MANDIRI', gender: 'P' },
  A4401261015: { namaPanggilan: 'Rehulina', asalDaerah: 'Jayapura / Papua', domisili: 'Asrama', tanggalLahir: '2008-05-22', jalurMasuk: 'SNBP', gender: 'P' },
  A4401261033: { namaPanggilan: 'Kinanti', asalDaerah: 'Bandung / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-10-21', jalurMasuk: 'SNBP', gender: 'P' },
  A4401261045: { namaPanggilan: 'Agiel', asalDaerah: 'Lampung', domisili: 'Kost', tanggalLahir: '2008-04-21', jalurMasuk: 'SNBT', gender: 'L' },
  A4401261077: { namaPanggilan: 'Sava', asalDaerah: 'Jakarta Selatan / DKI Jakarta', domisili: 'Asrama', tanggalLahir: '2007-10-09', jalurMasuk: 'MANDIRI', gender: 'P' },
  A4401261082: { namaPanggilan: 'Fathdry', asalDaerah: 'Kota Bogor / Jawa Barat', domisili: 'Rumah', tanggalLahir: '2008-03-10', jalurMasuk: 'MANDIRI', gender: 'L' },
  A4401261107: { namaPanggilan: 'Amirah', asalDaerah: 'Bekasi / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-10-20', jalurMasuk: 'MANDIRI', gender: 'P' },
  A4401261084: { namaPanggilan: 'Rizkynia', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2007-05-24', jalurMasuk: 'MANDIRI', gender: 'P' },
  C3401261016: { namaPanggilan: 'Haikal', asalDaerah: 'Pandeglang / Banten', domisili: 'Asrama', tanggalLahir: '2008-02-27', jalurMasuk: 'SNBP', gender: 'L' },
  C3401261034: { namaPanggilan: 'Hasna', asalDaerah: 'Bekasi / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-01-04', jalurMasuk: 'SNBP', gender: 'P' },
  C3401261044: { namaPanggilan: 'Aisyah', asalDaerah: 'Tangerang / Banten', domisili: 'Asrama', tanggalLahir: '2008-09-19', jalurMasuk: 'SNBP', gender: 'P' },
  C3401261053: { namaPanggilan: 'Yoga', asalDaerah: 'Jakarta Pusat / DKI Jakarta', domisili: 'Asrama', tanggalLahir: '2007-05-04', jalurMasuk: 'SNBT', gender: 'L' },
  C3401261098: { namaPanggilan: 'Bilal', asalDaerah: 'Cikarang / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-06-16', jalurMasuk: 'MANDIRI', gender: 'L' },
  C5401261002: { namaPanggilan: 'Nasywa', asalDaerah: 'Kota Bogor / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2007-03-20', jalurMasuk: 'SNBP', gender: 'P' },
  C5401261016: { namaPanggilan: 'Daviona', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-12-17', jalurMasuk: 'SNBP', gender: 'P' },
  C5401261033: { namaPanggilan: 'Arsitha', asalDaerah: 'Tabanan / Bali', domisili: 'Kost', tanggalLahir: '2007-10-20', jalurMasuk: 'SNBP', gender: 'P' },
  C5401261048: { namaPanggilan: 'Arfa', asalDaerah: 'Depok / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-06-07', jalurMasuk: 'SNBP', gender: 'L' },
  C5401261056: { namaPanggilan: 'Fadly', asalDaerah: 'Indramayu / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-11-02', jalurMasuk: 'SNBP', gender: 'L' },
  C5401261058: { namaPanggilan: 'Azka', asalDaerah: 'Medan / Sumatera Utara', domisili: 'Rumah', tanggalLahir: '2008-01-26', jalurMasuk: 'SNBT', gender: 'L' },
  C5401261059: { namaPanggilan: 'Hadi', asalDaerah: 'Sumatera Barat', domisili: 'Asrama', tanggalLahir: '2008-03-26', jalurMasuk: 'SNBT', gender: 'L' },
  C5401261064: { namaPanggilan: 'Naurah', asalDaerah: 'Tangerang Selatan / Banten', domisili: 'Kost', tanggalLahir: '2008-06-19', jalurMasuk: 'SNBT', gender: 'P' },
  C5401261096: { namaPanggilan: 'Farrel', asalDaerah: 'Jakarta Barat / DKI Jakarta', domisili: 'Kost', tanggalLahir: '2008-07-04', jalurMasuk: 'MANDIRI', gender: 'L' },
  C5401261112: { namaPanggilan: 'Tiara', asalDaerah: 'Bekasi / Jawa Barat', domisili: 'Kost', tanggalLahir: '2006-06-03', jalurMasuk: 'MANDIRI', gender: 'P' },
  C5401261130: { namaPanggilan: 'Quesar', asalDaerah: 'Indramayu / Jawa Barat', domisili: 'Kost', tanggalLahir: '2008-08-27', jalurMasuk: 'MANDIRI', gender: 'L' },
  C5401261132: { namaPanggilan: 'Khaira', asalDaerah: 'Jakarta Pusat / DKI Jakarta', domisili: 'Kost', tanggalLahir: '2008-11-09', jalurMasuk: 'MANDIRI', gender: 'P' },
  C5401261135: { namaPanggilan: 'Rasya', asalDaerah: 'Sukabumi / Jawa Barat', domisili: 'Kost', tanggalLahir: '2007-05-11', jalurMasuk: 'MANDIRI', gender: 'L' },
  G3401261023: { namaPanggilan: 'Fatiha', asalDaerah: 'Jakarta Timur / DKI Jakarta', domisili: 'Asrama', tanggalLahir: '2007-06-30', jalurMasuk: 'SNBP', gender: 'P' },
  G3401261035: { namaPanggilan: 'Avia', asalDaerah: 'Tangerang / Banten', domisili: 'Kost', tanggalLahir: '2008-05-26', jalurMasuk: 'SNBP', gender: 'P' },
  G3401261043: { namaPanggilan: 'Hersyathia', asalDaerah: 'Kotabaru / Kalimantan Selatan', domisili: 'Asrama', tanggalLahir: '2008-04-05', jalurMasuk: 'SNBP', gender: 'P' },
  G3401261048: { namaPanggilan: 'Mufahir', asalDaerah: 'Cianjur / Jawa Barat', domisili: 'Asrama', tanggalLahir: '2008-05-21', jalurMasuk: 'SNBP', gender: 'L' },
  G3401261066: { namaPanggilan: 'Arfandy', asalDaerah: 'Jakarta Selatan / DKI Jakarta', domisili: 'Asrama', tanggalLahir: '2008-09-28', jalurMasuk: 'SNBT', gender: 'L' },
  G3401261079: { namaPanggilan: 'Dellaluna', asalDaerah: 'Bogor / Jawa Barat', domisili: 'Rumah', tanggalLahir: '2008-03-23', jalurMasuk: 'SNBT', gender: 'P' },
  G3401261081: { namaPanggilan: 'Retno', asalDaerah: 'Bantul / DI Yogyakarta', domisili: 'Asrama', tanggalLahir: '2007-07-10', jalurMasuk: 'SNBT', gender: 'P' },
  G3401261096: { namaPanggilan: 'Alifa', asalDaerah: 'Banten', domisili: 'Asrama', tanggalLahir: '2008-06-06', jalurMasuk: 'MANDIRI', gender: 'P' },
  // 26 Mahasiswa tambahan dari daftar lengkap 97 anak kelas ST04 (jalurMasuk dikosongkan)
  A0401261004: { namaPanggilan: 'Aziz', gender: 'L' },
  A0401261030: { namaPanggilan: 'Irsyad', gender: 'L' },
  A1401261006: { namaPanggilan: 'Rayhan', gender: 'L' },
  A1401261022: { namaPanggilan: 'Sultan', gender: 'L' },
  A2401261005: { namaPanggilan: 'Hafiz', gender: 'L' },
  A2401261038: { namaPanggilan: 'Ilham', gender: 'L' },
  A2401261055: { namaPanggilan: 'Fathina', gender: 'P' },
  A2401261124: { namaPanggilan: 'Billy', gender: 'L' },
  A2401261148: { namaPanggilan: 'Batrisya', gender: 'P' },
  A3401261008: { namaPanggilan: 'Suci', gender: 'P' },
  A3401261018: { namaPanggilan: 'Citra', gender: 'P' },
  A3401261040: { namaPanggilan: 'Galih', gender: 'L' },
  A3401261054: { namaPanggilan: 'Nayla', gender: 'P' },
  A3401261060: { namaPanggilan: 'Prajna', gender: 'P' },
  A4401261002: { namaPanggilan: 'Jasmine', gender: 'P' },
  A4401261016: { namaPanggilan: 'Cristyan', gender: 'L' },
  A4401261024: { namaPanggilan: 'Asep', gender: 'L' },
  A4401261058: { namaPanggilan: 'Arvina', gender: 'P' },
  A4401261074: { namaPanggilan: 'Wismaya', gender: 'P' },
  C3401261026: { namaPanggilan: 'Adlan', gender: 'L' },
  C3401261040: { namaPanggilan: 'Raka', gender: 'L' },
  C3401261050: { namaPanggilan: 'Syifa', gender: 'P' },
  C5401261092: { namaPanggilan: 'Aqeela', gender: 'P' },
  G3401261010: { namaPanggilan: 'Nanda', gender: 'P' },
  G3401261061: { namaPanggilan: 'Renata', gender: 'P' },
  G3401261121: { namaPanggilan: 'Fildzah', gender: 'P' },
};

/**
 * DAFTAR LENGKAP 97 MAHASISWA KELAS ST04 IPB UNIVERSITY
 */
const FULL_97_STUDENTS_RAW: { namaLengkap: string; nim: string }[] = [
  { namaLengkap: 'Abdul Mufahir', nim: 'G3401261048' },
  { namaLengkap: 'Abdullah Salman', nim: 'A2401261160' },
  { namaLengkap: 'Adlan Anvi Muharram', nim: 'C3401261026' },
  { namaLengkap: 'Adzra Afifah Ramadhaniah', nim: 'A2401261244' },
  { namaLengkap: 'Ahmad Nurul Hadi', nim: 'C5401261059' },
  { namaLengkap: 'Aisha Azkia', nim: 'A3401261027' },
  { namaLengkap: 'Aisyah Salsabilah', nim: 'C3401261044' },
  { namaLengkap: 'Amirah Hamidah Agustian', nim: 'A4401261107' },
  { namaLengkap: 'Anggraini Cahya Ningrum', nim: 'A2401261210' },
  { namaLengkap: 'Antonia Kinanti Candraningtyas', nim: 'A4401261033' },
  { namaLengkap: 'Aqeela Kylafazia', nim: 'C5401261092' },
  { namaLengkap: 'Arfandy Altaf Ramadhan', nim: 'G3401261066' },
  { namaLengkap: 'Arvina Aulia Andin', nim: 'A4401261058' },
  { namaLengkap: 'Asep Akbar', nim: 'A4401261024' },
  { namaLengkap: 'Athaillah Abi Fahrenzi', nim: 'A2401261015' },
  { namaLengkap: 'Avia Dwinatania Pricia', nim: 'G3401261035' },
  { namaLengkap: 'Azka Wafdan Rangkuti', nim: 'C5401261058' },
  { namaLengkap: 'Aziz Al Farizy', nim: 'A0401261004' },
  { namaLengkap: 'Bagindo Hafiz Nasution', nim: 'A2401261005' },
  { namaLengkap: 'Batrisya Ratu Aisyah', nim: 'A2401261148' },
  { namaLengkap: 'Billy Gregorius N', nim: 'A2401261124' },
  { namaLengkap: 'Brigitha Marescotty Wihelmin Kocu', nim: 'A2401261263' },
  { namaLengkap: 'Carissa Sahnaz Azkyanisa', nim: 'A2401261042' },
  { namaLengkap: 'Cheryl Nabila Aiman', nim: 'A0401261014' },
  { namaLengkap: 'Christiano Erlando Togar Mattio Pardosi', nim: 'A2401261253' },
  { namaLengkap: 'Citra Amelia', nim: 'A3401261018' },
  { namaLengkap: 'Covenant Elshaloom Lingga', nim: 'A2401261126' },
  { namaLengkap: 'Cristyan Simanjuntak', nim: 'A4401261016' },
  { namaLengkap: 'Davina Fitria Sanjaya', nim: 'A1401261042' },
  { namaLengkap: 'Davina Putri Elfarinka', nim: 'A2401261255' },
  { namaLengkap: 'Daviona Mutiara Kayla', nim: 'C5401261016' },
  { namaLengkap: 'Dellaluna Nur Agustina', nim: 'G3401261079' },
  { namaLengkap: 'Dini Aulia Pratiwi', nim: 'A1401261008' },
  { namaLengkap: 'Fadly Nur Qolby', nim: 'C5401261056' },
  { namaLengkap: 'Fathina Hummairah Maulidya', nim: 'A2401261055' },
  { namaLengkap: 'Fatiha Yasmin Aisyabilla', nim: 'G3401261023' },
  { namaLengkap: 'Fildzah Valen Elfitrian', nim: 'G3401261121' },
  { namaLengkap: 'Galih Satrio', nim: 'A3401261040' },
  { namaLengkap: 'Hasna Hanifah Priyono', nim: 'C3401261034' },
  { namaLengkap: 'Hersyathia Safara Zahra', nim: 'G3401261043' },
  { namaLengkap: 'Irsyad Razaqi', nim: 'A0401261030' },
  { namaLengkap: 'Istaufa Sabilla', nim: 'A2401261069' },
  { namaLengkap: 'Keysa Herpauliana Siahaan', nim: 'A2401261016' },
  { namaLengkap: 'Khaira Zahia Ambarin', nim: 'C5401261132' },
  { namaLengkap: 'Madelaine Hetri Siahaan', nim: 'A1401261094' },
  { namaLengkap: 'Moch Dzulqarnain Serdy', nim: 'A2401261152' },
  { namaLengkap: 'Muhamad Haikal Efendi', nim: 'C3401261016' },
  { namaLengkap: 'Muhammad Agha Alhafiz Nasution', nim: 'A0401261039' },
  { namaLengkap: 'Muhammad Agiel Arka Putra Winanta', nim: 'A4401261045' },
  { namaLengkap: 'Muhammad Al-Fathdry', nim: 'A4401261082' },
  { namaLengkap: 'Muhammad Arfa Annabhan', nim: 'C5401261048' },
  { namaLengkap: 'Muhammad Arga Al Ikram Sitorus', nim: 'A3401261080' },
  { namaLengkap: 'Muhammad Bilal Arrafi', nim: 'C3401261098' },
  { namaLengkap: 'Muhammad Farrel Wicaksono', nim: 'C5401261096' },
  { namaLengkap: 'Muhammad Ilham Aufa', nim: 'A2401261038' },
  { namaLengkap: 'Muhammad Khoirul Huda', nim: 'A2401261162' },
  { namaLengkap: 'Muhammad Rayhan', nim: 'A1401261006' },
  { namaLengkap: 'Muhammad Rehan Ibnu Sasmito', nim: 'A0401261040' },
  { namaLengkap: 'Muhammad Syarif Azka Widodo', nim: 'A1401261082' },
  { namaLengkap: 'Nanda Rizqiatun Ibrahim', nim: 'G3401261010' },
  { namaLengkap: 'Nasywa Maulida', nim: 'C5401261002' },
  { namaLengkap: 'Naurah Khairunnisa', nim: 'C5401261064' },
  { namaLengkap: 'Nayara Ersatriani', nim: 'A2401261143' },
  { namaLengkap: 'Nayla Zhafira', nim: 'A3401261054' },
  { namaLengkap: 'Nezara Vigna Reticulata', nim: 'A3401261091' },
  { namaLengkap: 'Ni Luh Putu Arsitha Maharani', nim: 'C5401261033' },
  { namaLengkap: 'Nur Alifa Ayu Winahon', nim: 'G3401261096' },
  { namaLengkap: 'Nur Faiza Az-Zahrani', nim: 'A2401261187' },
  { namaLengkap: 'Prajna Ayu Tasyazatira', nim: 'A3401261060' },
  { namaLengkap: 'Putri Oktania', nim: 'C3401261024' },
  { namaLengkap: 'R. Quesar Mahawiwaha Suradiradja', nim: 'C5401261130' },
  { namaLengkap: 'R.A. Jasmine Najwa Aliyah', nim: 'A4401261002' },
  { namaLengkap: 'Raditya Zulfian Faris', nim: 'C5401261032' },
  { namaLengkap: 'Raihan Firdaus Ahmad', nim: 'A1401261044' },
  { namaLengkap: 'Raka Putra Patrika', nim: 'C3401261040' },
  { namaLengkap: 'Rasya Albani Putra', nim: 'C5401261135' },
  { namaLengkap: 'Razzaaqu Zidane Nugroho', nim: 'A2401261177' },
  { namaLengkap: 'Rehulina Karinana Perangin Angin', nim: 'A4401261015' },
  { namaLengkap: 'Renata Khanaya Putri Aruan', nim: 'G3401261061' },
  { namaLengkap: 'Retno Arum Lestari', nim: 'G3401261081' },
  { namaLengkap: 'Reza Fahrizal', nim: 'A2401261070' },
  { namaLengkap: 'Rizkia Nur Maulida', nim: 'A0401261010' },
  { namaLengkap: 'Rizkynia Derainis Salmanda', nim: 'A4401261084' },
  { namaLengkap: 'Sava Safitri Goesnadi', nim: 'A4401261077' },
  { namaLengkap: 'Seni Fatualia', nim: 'A2401261170' },
  { namaLengkap: 'Shafa Indriyani', nim: 'A1401261029' },
  { namaLengkap: 'Shevta Sri Arishki Br Hutabarat', nim: 'A2401261085' },
  { namaLengkap: 'Shofiyyah Mukhayadi', nim: 'A2401261027' },
  { namaLengkap: 'Suci Humairoh', nim: 'A3401261008' },
  { namaLengkap: 'Sultan Ihya Ulumudin Cemerlang', nim: 'A1401261022' },
  { namaLengkap: 'Syifa Azaria Widodo', nim: 'C3401261050' },
  { namaLengkap: 'Tiara Anindya Nurhasanah', nim: 'C5401261112' },
  { namaLengkap: 'Wanda Alya Azzahra', nim: 'A1401261054' },
  { namaLengkap: 'Wira Adyuta Sutanto', nim: 'A2401261190' },
  { namaLengkap: 'Wismaya Ardhiona Dewani', nim: 'A4401261074' },
  { namaLengkap: 'Yoga Saputra', nim: 'C3401261053' },
  { namaLengkap: 'Zhafirah Nafizah Putri', nim: 'A3401261037' },
];

const MINAT_POOL = [
  'Smart Agriculture & IoT',
  'Sains Kelautan & Konservasi',
  'Agronomi & Hortikultura',
  'Biologi & Riset Laboratorium',
  'Arsitektur Lanskap',
  'Manajemen Sumberdaya Lahan',
  'Teknologi Hasil Perairan',
  'Data Science & Statistika',
];

const HOBI_POOL = [
  'Diskusi & Belajar Bareng',
  'Olahraga & Badminton',
  'Fotografi Alam',
  'Membaca & Penulisan Ilmiah',
  'Eksplorasi Kuliner Bogor',
  'Musik & Seni',
];

const KEAHLIAN_POOL = [
  'Analisis Data & Statistika',
  'Riset Lapangan & Praktikum',
  'Public Speaking',
  'Penulisan Ilmiah',
  'Manajemen Tim & Organisasi',
  'Desain & Dokumentasi',
];

/**
 * Membangun 97 data mahasiswa ST04 yang DIURUTKAN BERDASARKAN NIM (bukan abjad nama)
 */
function buildInitialMahasiswa(): Mahasiswa[] {
  const sortedByNim = [...FULL_97_STUDENTS_RAW].sort((a, b) =>
    a.nim.localeCompare(b.nim)
  );

  return sortedByNim.map((item, index) => {
    const i = index + 1;
    const id = `mhs-${String(i).padStart(3, '0')}`;
    const { fakultas, prodi } = getFakultasProdiFromNim(item.nim);
    const detail = CSV_DETAILS_BY_NIM[item.nim];

    const defaultPanggilan =
      item.namaLengkap
        .replace(/^(Moch|Muhamad|Muhammad|R\.A\.|R\.)\s+/i, '')
        .split(' ')[0] || item.namaLengkap.split(' ')[0];

    const namaPanggilan = detail?.namaPanggilan || defaultPanggilan;
    const gender = detail?.gender || 'L';
    const role: UserRole = detail?.role || 'mahasiswa';
    const jalurMasuk = detail?.jalurMasuk; // Kosong (undefined) bagi yang belum diketahui

    const cleanSlug = item.namaLengkap
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 14);

    return {
      id,
      nim: item.nim,
      namaLengkap: item.namaLengkap,
      namaPanggilan,
      fotoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
        item.namaLengkap
      )}&backgroundColor=4e2e1d,5c3724,7c4d34,8b5a2b`,
      gender,
      fakultas,
      programStudi: prodi,
      kelas: 'ST04',
      domisili: detail?.domisili
        ? `${detail.domisili} (Dramaga / Bogor)`
        : 'IPB Dramaga, Bogor',
      asalDaerah: detail?.asalDaerah || '-',
      tanggalLahir: detail?.tanggalLahir,
      jalurMasuk,
      email: `${cleanSlug}@apps.ipb.ac.id`,
      whatsapp: '-',
      instagram: `@${namaPanggilan.toLowerCase()}_st04`,
      linkedin: `linkedin.com/in/${cleanSlug}-ipb`,
      tentangSaya: {
        mottoHidup:
          'Bertumbuh dan berprestasi bersama keluarga besar SETEMP4T (ST04) IPB University.',
        hobi: [
          HOBI_POOL[i % HOBI_POOL.length],
          HOBI_POOL[(i + 2) % HOBI_POOL.length],
        ],
        minat: [prodi, MINAT_POOL[i % MINAT_POOL.length]],
        keahlian: [
          KEAHLIAN_POOL[i % KEAHLIAN_POOL.length],
          KEAHLIAN_POOL[(i + 3) % KEAHLIAN_POOL.length],
        ],
        prestasi: [
          jalurMasuk
            ? `Mahasiswa Aktif Kelas ST04 (Jalur ${jalurMasuk})`
            : 'Mahasiswa Aktif Kelas ST04',
          ...(role !== 'mahasiswa'
            ? [`Pengurus Inti Kelas ST04 (${role.toUpperCase()})`]
            : []),
        ],
      },
      role,
      statusAktif: true,
      aktivitasKelas: [
        {
          id: `akt-${i}-1`,
          judul:
            role === 'komti'
              ? 'Komandan Tingkat (Komti) Kelas ST04'
              : role === 'wakomti'
              ? 'Wakil Komandan Tingkat (Wakomti) Kelas ST04'
              : role === 'bendahara'
              ? 'Bendahara Kelas ST04'
              : role === 'sekretaris'
              ? 'Sekretaris 1 Kelas ST04'
              : 'Anggota Aktif Kelas ST04',
          tanggal: '2026-08-12',
          kategori: 'Organisasi',
          peran: role !== 'mahasiswa' ? role.toUpperCase() : 'Anggota',
        },
      ],
      createdAt: '2026-08-01T08:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    };
  });
}

export const INITIAL_MAHASISWA: Mahasiswa[] = buildInitialMahasiswa();

/**
 * 7 MATA KULIAH RESMI SEMESTER 1 KELAS ST04 IPB UNIVERSITY
 */
export const INITIAL_MATA_KULIAH: MataKuliah[] = [
  {
    id: 'mk-inggris',
    kode: 'IPB210F',
    nama: 'Bahasa Inggris',
    sks: 2,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Bahasa Inggris IPB (K15 / R15)',
    hariKuliah: 'Senin',
    jamKuliah: '09:00 - 09:50',
    ruangan: 'RK. CCR 1.04',
    hariPraktikum: 'Jumat',
    jamPraktikum: '09:00 - 10:40',
    ruangPraktikum: 'RK. CCR 1.05 (Responsi R15)',
    warnaLabel: 'amber',
    isActive: true,
  },
  {
    id: 'mk-statistika',
    kode: 'STA2111',
    nama: 'Statistika dan Analisis Data',
    sks: 3,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Statistika IPB (K22)',
    hariKuliah: 'Senin',
    jamKuliah: '10:10 - 12:40',
    ruangan: 'RK. CCR 2.15',
    warnaLabel: 'brown',
    isActive: true,
  },
  {
    id: 'mk-pi',
    kode: 'IPB210C',
    nama: 'Pertanian Inovatif',
    sks: 2,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Pertanian Inovatif IPB (K38)',
    hariKuliah: 'Selasa',
    jamKuliah: '08:00 - 09:40',
    ruangan: 'RK. CCR 1.04',
    warnaLabel: 'orange',
    isActive: true,
  },
  {
    id: 'mk-bindo',
    kode: 'IPB2106',
    nama: 'Bahasa Indonesia',
    sks: 2,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Bahasa Indonesia IPB (K25 / R25)',
    hariKuliah: 'Selasa',
    jamKuliah: '10:00 - 10:50',
    ruangan: 'RK. CCR 1.03',
    hariPraktikum: 'Rabu',
    jamPraktikum: '10:20 - 12:00',
    ruangPraktikum: 'RK. CCR 2.15 (Responsi R25)',
    warnaLabel: 'stone',
    isActive: true,
  },
  {
    id: 'mk-biologi',
    kode: 'BIO2102',
    nama: 'Biologi Dasar',
    sks: 3,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Biologi Dasar IPB (K4 / P7)',
    hariKuliah: 'Selasa',
    jamKuliah: '13:00 - 14:40',
    ruangan: 'RK. CCR 1.05',
    hariPraktikum: 'Rabu',
    jamPraktikum: '13:00 - 15:30',
    ruangPraktikum: 'Lab Biologi (Praktikum P7)',
    warnaLabel: 'amber',
    isActive: true,
  },
  {
    id: 'mk-matematika',
    kode: 'MAT2111',
    nama: 'Matematika dan Berpikir Logis',
    sks: 3,
    semester: 1,
    dosenKoordinator: 'Tim Dosen Matematika IPB (K17 / R17)',
    hariKuliah: 'Kamis',
    jamKuliah: '08:00 - 09:40',
    ruangan: 'RK. CCR 2.06',
    hariPraktikum: 'Jumat',
    jamPraktikum: '13:00 - 14:40',
    ruangPraktikum: 'RK. CCR 2.04 (Responsi R17)',
    warnaLabel: 'brown',
    isActive: true,
  },
  {
    id: 'mk-sosiologi',
    kode: 'KPM2131',
    nama: 'Sosiologi',
    sks: 2,
    semester: 1,
    dosenKoordinator: 'Tim Dosen KPM Sosiologi IPB (K15)',
    hariKuliah: 'Kamis',
    jamKuliah: '13:00 - 14:40',
    ruangan: 'RK. CCR 2.16',
    warnaLabel: 'orange',
    isActive: true,
  },
];

/**
 * Data Kelompok Awal:
 * Dikosongkan ([]) agar tidak ada kelompok acak bawaan.
 * Seluruh pembagian kelompok diatur dan disimpan ke server (Cloud Firestore) oleh Admin.
 */
export const INITIAL_KELOMPOK: Kelompok[] = [];

/**
 * Pembayaran Kas Wajib ST04:
 * Dibuat kosong ('Belum Lunas') agar Bendahara yang menginput/mencentang datanya.
 */
function buildInitialPembayaranKas(): PembayaranKas[] {
  return INITIAL_MAHASISWA.map((m) => ({
    id: `kas-okt-${m.id}`,
    mahasiswaId: m.id,
    bulan: 'November 2026 (Mulai Agustus @ Rp20.000/bln)',
    periodeKey: '2026-11',
    nominal: 20000,
    status: 'Belum Lunas',
    tanggalPembayaran: null,
    catatan: 'Belum melakukan pembayaran kas wajib Rp20.000 bulan ini',
  }));
}

export const INITIAL_PEMBAYARAN_KAS: PembayaranKas[] = buildInitialPembayaranKas();

/**
 * Transaksi Kas Kelas ST04:
 * Dibuat kosong ([]) agar Bendahara yang mencatat pemasukan/pengeluaran riil.
 */
export const INITIAL_TRANSAKSI_KAS: TransaksiKas[] = [];

/**
 * Pengumuman Kelas ST04
 */
export const INITIAL_PENGUMUMAN: Pengumuman[] = [
  {
    id: 'peng-001',
    judul: 'Informasi Jadwal Responsi Bahasa Indonesia (R25) & Matematika (R17)',
    isi: 'Diberitahukan kepada seluruh rekan-rekan ST04, sesi Responsi Bahasa Indonesia (IPB2106 - R25) dilaksanakan hari Rabu pukul 10:20–12:00 di RK. CCR 2.15, sedangkan Responsi Matematika dan Berpikir Logis (MAT2111 - R17) dilaksanakan hari Jumat pukul 13:00–14:40 di RK. CCR 2.04. Mohon hadir tepat waktu 10 menit sebelum kelas dimulai.',
    tanggal: '2026-10-28',
    kategori: 'Akademik',
    prioritas: 'Tinggi',
    lampiran: [],
    penulisId: 'mhs-001',
    penulisNama: 'Raditya Zulfian Faris',
    penulisRole: 'komti',
    isPinned: true,
  },
  {
    id: 'peng-002',
    judul: 'Pengingat Iuran Kas Wajib ST04 (Rp20.000/Bulan Mulai Agustus)',
    isi: 'Halo teman-teman ST04! Mengingatkan bahwa iuran kas wajib kelas kita sebesar Rp20.000 per bulan dapat dibayarkan melalui scan QRIS di menu Kas Kelas lalu mengunggah bukti pembayarannya ke Google Drive yang tersedia.',
    tanggal: '2026-10-27',
    kategori: 'Keuangan',
    prioritas: 'Sedang',
    lampiran: [],
    penulisId: 'mhs-003',
    penulisNama: 'Putri Oktania',
    penulisRole: 'bendahara',
    isPinned: true,
  },
];

/**
 * JADWAL KULIAH RESMI SEMESTER 1 KELAS ST04
 */
export const INITIAL_JADWAL: Jadwal[] = [
  // SENIN
  {
    id: 'jdw-sen-1',
    judul: 'IPB210F (K15) — Bahasa Inggris (Kuliah)',
    deskripsi: 'Perkuliahan Bahasa Inggris Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-inggris',
    tanggal: '2026-11-02',
    hari: 'Senin',
    waktuMulai: '09:00',
    waktuSelesai: '09:50',
    lokasi: 'RK. CCR 1.04',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-sen-2',
    judul: 'STA2111 (K22) — Statistika dan Analisis Data',
    deskripsi: 'Perkuliahan Statistika dan Analisis Data Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-statistika',
    tanggal: '2026-11-02',
    hari: 'Senin',
    waktuMulai: '10:10',
    waktuSelesai: '12:40',
    lokasi: 'RK. CCR 2.15',
    isRecurringWeekly: true,
  },
  // SELASA
  {
    id: 'jdw-sel-1',
    judul: 'IPB210C (K38) — Pertanian Inovatif',
    deskripsi: 'Perkuliahan Pertanian Inovatif Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-pi',
    tanggal: '2026-11-03',
    hari: 'Selasa',
    waktuMulai: '08:00',
    waktuSelesai: '09:40',
    lokasi: 'RK. CCR 1.04',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-sel-2',
    judul: 'IPB2106 (K25) — Bahasa Indonesia (Kuliah)',
    deskripsi: 'Perkuliahan Bahasa Indonesia Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-bindo',
    tanggal: '2026-11-03',
    hari: 'Selasa',
    waktuMulai: '10:00',
    waktuSelesai: '10:50',
    lokasi: 'RK. CCR 1.03',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-sel-3',
    judul: 'BIO2102 (K4) — Biologi Dasar',
    deskripsi: 'Perkuliahan Biologi Dasar Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-biologi',
    tanggal: '2026-11-03',
    hari: 'Selasa',
    waktuMulai: '13:00',
    waktuSelesai: '14:40',
    lokasi: 'RK. CCR 1.05',
    isRecurringWeekly: true,
  },
  // RABU
  {
    id: 'jdw-rab-1',
    judul: 'IPB2106 (R25) — Bahasa Indonesia (Responsi)',
    deskripsi: 'Sesi Responsi & Praktik Penulisan Ilmiah Bahasa Indonesia ST04',
    jenis: 'Praktikum',
    mataKuliahId: 'mk-bindo',
    tanggal: '2026-11-04',
    hari: 'Rabu',
    waktuMulai: '10:20',
    waktuSelesai: '12:00',
    lokasi: 'RK. CCR 2.15',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-rab-2',
    judul: 'BIO2102 (P7) — Biologi Dasar',
    deskripsi: 'Praktikum Biologi Dasar Kelas ST04',
    jenis: 'Praktikum',
    mataKuliahId: 'mk-biologi',
    tanggal: '2026-11-04',
    hari: 'Rabu',
    waktuMulai: '13:00',
    waktuSelesai: '15:30',
    lokasi: 'Lab Biologi',
    isRecurringWeekly: true,
  },
  // KAMIS
  {
    id: 'jdw-kam-1',
    judul: 'MAT2111 (K17) — Matematika dan Berpikir Logis (Kuliah)',
    deskripsi: 'Perkuliahan Matematika dan Berpikir Logis Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-matematika',
    tanggal: '2026-10-29',
    hari: 'Kamis',
    waktuMulai: '08:00',
    waktuSelesai: '09:40',
    lokasi: 'RK. CCR 2.06',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-kam-2',
    judul: 'KPM2131 (K15) — Sosiologi',
    deskripsi: 'Perkuliahan Sosiologi Kelas ST04 Semester 1',
    jenis: 'Jadwal kuliah',
    mataKuliahId: 'mk-sosiologi',
    tanggal: '2026-10-29',
    hari: 'Kamis',
    waktuMulai: '13:00',
    waktuSelesai: '14:40',
    lokasi: 'RK. CCR 2.16',
    isRecurringWeekly: true,
  },
  // JUMAT
  {
    id: 'jdw-jum-1',
    judul: 'IPB210F (R15) — Bahasa Inggris (Responsi)',
    deskripsi: 'Sesi Responsi & Latihan Komunikasi Akademik Bahasa Inggris ST04',
    jenis: 'Praktikum',
    mataKuliahId: 'mk-inggris',
    tanggal: '2026-10-30',
    hari: 'Jumat',
    waktuMulai: '09:00',
    waktuSelesai: '10:40',
    lokasi: 'RK. CCR 1.05',
    isRecurringWeekly: true,
  },
  {
    id: 'jdw-jum-2',
    judul: 'MAT2111 (R17) — Matematika dan Berpikir Logis (Responsi)',
    deskripsi: 'Sesi Responsi Pembahasan Soal Latihan Matematika dan Berpikir Logis ST04',
    jenis: 'Praktikum',
    mataKuliahId: 'mk-matematika',
    tanggal: '2026-10-30',
    hari: 'Jumat',
    waktuMulai: '13:00',
    waktuSelesai: '14:40',
    lokasi: 'RK. CCR 2.04',
    isRecurringWeekly: true,
  },

  // TUGAS YANG BERJALAN & DEADLINE TERDEKAT
  {
    id: 'tgs-001',
    judul: 'Tugas Lembar Kerja Responsi Matematika dan Berpikir Logis (MAT2111 - R17)',
    deskripsi: 'Menyelesaikan latihan soal himpunan, logika proposisi, dan pembuktian matematika untuk dibahas saat responsi Jumat.',
    jenis: 'Deadline tugas',
    mataKuliahId: 'mk-matematika',
    tanggal: '2026-11-06',
    hari: 'Jumat',
    waktuMulai: '13:00',
    waktuSelesai: '13:00',
    lokasi: 'RK. CCR 2.04 & LMS IPB',
  },
  {
    id: 'tgs-002',
    judul: 'Tugas Kelompok Statistika dan Analisis Data (STA2111 - K22)',
    deskripsi: 'Olah data deskriptif, tabel distribusi frekuensi, dan visualisasi boxplot menggunakan dataset kelas ST04.',
    jenis: 'Deadline tugas',
    mataKuliahId: 'mk-statistika',
    tanggal: '2026-11-02',
    hari: 'Senin',
    waktuMulai: '10:00',
    waktuSelesai: '10:00',
    lokasi: 'LMS IPB (class.ipb.ac.id) & Drive ST04',
  },
];

export const INITIAL_LINK_PENTING: LinkPenting[] = [
  {
    id: 'lnk-001',
    kategori: 'LMS',
    judul: 'IPB Online Course / LMS (class.ipb.ac.id)',
    deskripsi: 'Portal kuis, materi kuliah, dan pengumpulan tugas resmi Semester 1 IPB University',
    url: 'https://class.ipb.ac.id',
    badgeText: 'Wajib Akademik',
  },
  {
    id: 'lnk-002',
    kategori: 'Google Drive',
    judul: 'Drive Bukti Pembayaran Kas Kelas ST04',
    deskripsi: 'Folder Google Drive resmi pengumpulan bukti pembayaran QRIS kas kelas ST04',
    url: 'https://drive.google.com/drive/folders/1db7EMTraRBx3qZZd74xYMHYMJiCbcvI9',
    badgeText: 'Kas ST04',
  },
];

export const INITIAL_DOKUMEN: Dokumen[] = [];

export const INITIAL_RIWAYAT_RANDOMISASI: RiwayatRandomisasi[] = [];

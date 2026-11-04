'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { KategoriTransaksiKas, TransaksiKas } from '@/types/database';
import { Badge, Button, Card, Input, Modal, Select } from '@/components/ui';
import { formatRupiah, formatTanggalIndo } from '@/lib/utils';
import { FirebaseServices } from '@/lib/firebase/services';
import {
  Plus,
  Trash2,
  Search,
  KeyRound,
  QrCode,
  ExternalLink,
  Maximize2,
  Pencil,
  Save,
  X,
  Calendar,
  Lock,
  CheckCircle2,
  BellRing,
} from 'lucide-react';

export interface PeriodeBulanItem {
  key: string;
  label: string;
  fullLabel: string;
  nominal: number; // Nominal khusus kolom ini (contoh: Agu/Acara = 15000, Sep = 25000, Okt = 20000, Nov = 20000)
}

export interface KasPeriodeConfig {
  namaPeriode: string;
  nominalPerPeriode: number;
  activeBulanKey: string;
  daftarBulan: PeriodeBulanItem[];
}

/**
 * Kolom 1 (Agu / Acara) = Rp15.000
 * Kolom 2 (Sep)         = Rp25.000 (Jika Kolom 1 + 2 terisi -> Rp15.000 + Rp25.000 = Rp40.000, genap Rp20.000/bln s/d September)
 * Kolom 3 (Okt)         = Rp20.000
 * Kolom 4 (Nov)         = Rp20.000
 * Kolom 5 (Des)         = Rp20.000
 */
export const BULAN_KAS: PeriodeBulanItem[] = [
  {
    key: 'agu',
    label: 'Agu',
    fullLabel: 'Agustus 2026',
    nominal: 15000,
  },
  {
    key: 'sep',
    label: 'Sep',
    fullLabel: 'September 2026',
    nominal: 25000,
  },
  {
    key: 'okt',
    label: 'Okt',
    fullLabel: 'Oktober 2026',
    nominal: 20000,
  },
  {
    key: 'nov',
    label: 'Nov',
    fullLabel: 'November 2026',
    nominal: 20000,
  },
  {
    key: 'des',
    label: 'Des',
    fullLabel: 'Desember 2026',
    nominal: 20000,
  },
];

export type BulanKey = string;

export const KAS_NOMINAL_PER_BULAN = 20000;
export const KAS_CHECKBOX_STORAGE_KEY = 'setemp4t_kas_checkbox_v4_buku';
export const KAS_FIRESTORE_KEY = 'kas_checkboxes_v4';
export const KAS_PERIODE_STORAGE_KEY = 'setemp4t_kas_periode_config_v3';
export const KAS_PERIODE_FIRESTORE_KEY = 'kas_periode_config_v3';
export const KAS_REMINDER_BROADCAST_KEY = 'kas_reminder_broadcast_v1';

export interface KasReminderBroadcastPayload {
  id: string;
  bulanKey: string;
  bulanLabel: string;
  nominal: number;
  sentAt: string;
  sentBy: string;
}
export const KAS_DRIVE_URL =
  'https://drive.google.com/drive/folders/1db7EMTraRBx3qZZd74xYMHYMJiCbcvI9';

export const DEFAULT_KAS_PERIODE_CONFIG: KasPeriodeConfig = {
  namaPeriode: 'Agu – Des 2026',
  nominalPerPeriode: KAS_NOMINAL_PER_BULAN,
  activeBulanKey: 'nov',
  daftarBulan: BULAN_KAS.map((b) => ({ ...b })),
};

/**
 * DATA PEMBAYARAN KAS DARI BUKU CATATAN BENDAHARA (97 MAHASISWA ST04)
 * Angka menunjukkan jumlah kolom berurutan yang sudah dicentang:
 * - 0 = Belum ada centang (Rp0)
 * - 1 = Kolom 1: Agu/Acara (Rp15.000)
 * - 2 = Kolom 1 + 2: Agu/Acara + Sep (Rp15.000 + Rp25.000 = Rp40.000 / Lunas s/d September)
 * - 3 = Kolom 1 + 2 + 3: Agu/Acara + Sep + Okt (Rp60.000 / Lunas s/d Oktober)
 * - 4 = Kolom 1 + 2 + 3 + 4: Agu/Acara + Sep + Okt + Nov (Rp80.000 / Lunas s/d November)
 */
export const INITIAL_KAS_COUNT_BY_NIM: Record<string, number> = {
  // === 4x Centang (Lunas s/d November = Rp80.000) ===
  A2401261015: 4, // 3. Athaillah Abi Fahrenzi

  // === 3x Centang (Kolom 1, 2, 3 = Rp60.000) ===
  A4401261033: 3, // 5. Antonia Kinanti Candraningtyas
  A3401261027: 3, // 10. Aisha Azkia
  C3401261026: 3, // 11. Adlan Anvi Muharram
  G3401261066: 3, // 14. Arfandy Altaf Ramadhan
  A1401261042: 3, // 28. Davina Fitria Sanjaya
  A1401261008: 3, // 32. Dini Aulia Pratiwi
  A2401261069: 3, // 40. Istaufa Sabilla
  A1401261082: 3, // 50. Muhammad Syarif Azka Widodo
  G3401261010: 3, // 57. Nanda Rizqiatun Ibrahim
  C5401261002: 3, // 58. Nasywa Maulida
  C3401261024: 3, // 63. Putri Oktania
  A1401261044: 3, // 67. Raihan Firdaus Ahmad
  A2401261177: 3, // 69. Razzaaqu Zidane Nugroho
  A4401261084: 3, // 71. Rizkynia Derainis Salmanda
  C5401261112: 3, // 83. Tiara Anindya Nurhasanah
  C3401261034: 3, // 92. Hasna Hanifah Priyono

  // === 2x Centang (Kolom 1 + 2 = Rp40.000, Lunas s/d September) ===
  A4401261024: 2, // 4. Asep Akbar
  C5401261059: 2, // 6. Ahmad Nurul Hadi
  G3401261048: 2, // 7. Abdul Mufahir
  C5401261092: 2, // 8. Aqeela Kylafazia
  A2401261160: 2, // 9. Abdullah Salman
  A2401261244: 2, // 12. Adzra Afifah Ramadhaniah
  A2401261210: 2, // 13. Anggraini Cahya Ningrum
  C3401261044: 2, // 15. Aisyah Salsabilah
  A4401261107: 2, // 17. Amirah Hamidah Agustian
  C5401261016: 2, // 29. Daviona Mutiara Kayla
  C5401261056: 2, // 33. Fadly Nur Qolby
  A2401261055: 2, // 34. Fathina Hummairah Maulidya
  A3401261040: 2, // 37. Galih Satrio
  G3401261043: 2, // 38. Hersyathia Safara Zahra
  A0401261030: 2, // 39. Irsyad Razaqi
  A2401261038: 2, // 44. Muhammad Ilham Aufa
  A2401261162: 2, // 47. Muhammad Khoirul Huda
  A2401261152: 2, // 48. Moch Dzulqarnain Serdy
  C5401261096: 2, // 54. Muhammad Farrel Wicaksono
  A2401261143: 2, // 62. Nayara Ersatriani
  A3401261060: 2, // 64. Prajna Ayu Tasyazatira
  A2401261070: 2, // 65b. Reza Fahrizal
  C3401261053: 2, // 87. Yoga Saputra
  A0401261010: 2, // 90. Rizkia Nur Maulida
  C5401261033: 2, // 94. Ni Luh Putu Arsitha Maharani
  C5401261132: 2, // 95. Khaira Zahia Ambarin

  // === 0x Centang (Belum Bayar = Rp0) ===
  A2401261124: 0, // 21. Billy Gregorius N
  A2401261148: 0, // 22. Batrisya Ratu Aisyah
  G3401261121: 0, // 35. Fildzah Valen Elfitrian
  C5401261048: 0, // 46. Muhammad Arfa Annabhan
  A0401261039: 0, // 52. Muhammad Agha Alhafiz Nasution
  A4401261002: 0, // 66a. R.A. Jasmine Najwa Aliyah
  A2401261170: 0, // 78. Seni Fatualia

  // === 1x Centang (Kolom 1 Agu/Acara = Rp15.000) — 47 Mahasiswa lainnya ===
  A4401261058: 1, // 1. Arvina Aulia Andin
  C5401261058: 1, // 2. Azka Wafdan Rangkuti
  A0401261004: 1, // 16. Aziz Al Farizy
  G3401261035: 1, // 18. Avia Dwinatania Pricia
  A2401261263: 1, // 19. Brigitha Marescotty Wihelmin Kocu
  A2401261005: 1, // 20. Bagindo Hafiz Nasution
  A4401261016: 1, // 23. Cristyan Simanjuntak
  A2401261042: 1, // 24. Carissa Sahnaz Azkyanisa
  A0401261014: 1, // 25. Cheryl Nabila Aiman
  A2401261126: 1, // 26. Covenant Elshaloom Lingga
  A3401261018: 1, // 27. Citra Amelia
  G3401261079: 1, // 30. Dellaluna Nur Agustina
  A2401261255: 1, // 31. Davina Putri Elfarinka
  G3401261023: 1, // 36. Fatiha Yasmin Aisyabilla
  A4401261045: 1, // 41. Muhammad Agiel Arka Putra Winanta
  C3401261016: 1, // 42. Muhamad Haikal Efendi
  A1401261094: 1, // 43. Madelaine Hetri Siahaan
  A0401261040: 1, // 45. Muhammad Rehan Ibnu Sasmito
  A3401261080: 1, // 49. Muhammad Arga Al Ikram Sitorus
  A1401261006: 1, // 51. Muhammad Rayhan
  C3401261098: 1, // 53. Muhammad Bilal Arrafi
  A2401261187: 1, // 56. Nur Faiza Az-Zahrani
  A3401261054: 1, // 59. Nayla Zhafira
  C5401261064: 1, // 60. Naurah Khairunnisa
  G3401261096: 1, // 61. Nur Alifa Ayu Winahon
  A4401261015: 1, // 65a. Rehulina Karinana Perangin Angin
  C5401261032: 1, // 66b. Raditya Zulfian Faris
  G3401261061: 1, // 68. Renata Khanaya Putri Aruan
  C5401261135: 1, // 70. Rasya Albani Putra
  G3401261081: 1, // 72. Retno Arum Lestari
  C3401261040: 1, // 73. Raka Putra Patrika
  C5401261130: 1, // 74. R. Quesar Mahawiwaha Suradiradja
  A2401261085: 1, // 75. Shevta Sri Arishki Br Hutabarat
  A1401261022: 1, // 76. Sultan Ihya Ulumudin Cemerlang
  A4401261077: 1, // 77. Sava Safitri Goesnadi
  C3401261050: 1, // 79. Syifa Azaria Widodo
  A2401261027: 1, // 80. Shofiyyah Mukhayadi
  A1401261029: 1, // 81. Shafa Indriyani
  A3401261008: 1, // 82. Suci Humairoh
  A4401261074: 1, // 84. Wismaya Ardhiona Dewani
  A1401261054: 1, // 85. Wanda Alya Azzahra
  A2401261190: 1, // 86. Wira Adyuta Sutanto
  A3401261037: 1, // 88. Zhafirah Nafizah Putri
  A4401261082: 1, // 89. Muhammad Al-Fathdry
  A3401261091: 1, // 91. Nezara Vigna Reticulata
  A2401261016: 1, // 93. Keysa Herpauliana Siahaan
  A2401261253: 1, // 96. Christiano Erlando Togar Mattio Pardosi
};

export function buildInitialCheckedMapForStudents(
  students: { id: string; nim: string }[]
): Record<string, Record<string, boolean>> {
  const result: Record<string, Record<string, boolean>> = {};
  students.forEach((m) => {
    const count = INITIAL_KAS_COUNT_BY_NIM[m.nim.toUpperCase()] ?? 0;
    result[m.id] = {
      agu: count >= 1,
      sep: count >= 2,
      okt: count >= 3,
      nov: count >= 4,
      des: count >= 5,
    };
  });
  return result;
}

export function getNominalForBulanItem(
  item: PeriodeBulanItem,
  defaultNominal = KAS_NOMINAL_PER_BULAN
): number {
  if (typeof item.nominal === 'number' && item.nominal > 0) {
    return item.nominal;
  }
  if (item.key === 'agu') return 15000;
  if (item.key === 'sep') return 25000;
  return defaultNominal;
}

const KATEGORI_LIST: KategoriTransaksiKas[] = [
  'Iuran kelas',
  'Konsumsi',
  'Acara',
  'Operasional',
  'Lainnya',
];

export function KasKelasModule() {
  const {
    transaksiKasList,
    pembayaranKasList,
    mahasiswaList,
    addTransaksiKas,
    deleteTransaksiKas,
    updatePembayaranKas,
    currentUser,
    isAdmin,
    isBendaharaAdmin,
    unlockAdminWithKey,
    showToast,
  } = useApp();

  const isBendaharaUser =
    currentUser.role === 'bendahara' ||
    currentUser.nim.toUpperCase() === 'C3401261024' ||
    currentUser.nim.toUpperCase() === 'A2401261152' ||
    currentUser.namaLengkap.toLowerCase().includes('moch dzulqarnain serdy');

  const [activeTab, setActiveTab] = useState<'iuran' | 'transaksi'>('iuran');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAdminKey, setQuickAdminKey] = useState('');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [openQrisModal, setOpenQrisModal] = useState(false);

  // State Konfigurasi Periode Kas (Dapat diedit oleh Bendahara)
  const [periodeConfig, setPeriodeConfig] = useState<KasPeriodeConfig>(
    DEFAULT_KAS_PERIODE_CONFIG
  );
  const [openPeriodeModal, setOpenPeriodeModal] = useState(false);
  const [draftNamaPeriode, setDraftNamaPeriode] = useState(
    DEFAULT_KAS_PERIODE_CONFIG.namaPeriode
  );
  const [draftNominalPeriode, setDraftNominalPeriode] = useState(
    String(DEFAULT_KAS_PERIODE_CONFIG.nominalPerPeriode)
  );
  const [draftActiveBulanKey, setDraftActiveBulanKey] = useState(
    DEFAULT_KAS_PERIODE_CONFIG.activeBulanKey
  );
  const [draftDaftarBulan, setDraftDaftarBulan] = useState<PeriodeBulanItem[]>(
    DEFAULT_KAS_PERIODE_CONFIG.daftarBulan
  );

  // State Checkbox Kas Tersimpan: Record<mahasiswaId, Record<BulanKey, boolean>>
  const [checkedMap, setCheckedMap] = useState<
    Record<string, Record<string, boolean>>
  >({});
  // State Mode Edit Bertahap (Langkah: Edit -> Ceklis -> Save)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [draftCheckedMap, setDraftCheckedMap] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Jika keluar dari mode Bendahara Admin, otomatis tutup mode edit checklist
  useEffect(() => {
    if (!isBendaharaAdmin && isEditingChecklist) {
      setIsEditingChecklist(false);
    }
  }, [isBendaharaAdmin, isEditingChecklist]);

  // Urutan mahasiswa selalu berdasarkan NIM (Absen 1..97)
  const sortedMahasiswaByNim = useMemo(
    () => [...mahasiswaList].sort((a, b) => a.nim.localeCompare(b.nim)),
    [mahasiswaList]
  );

  // Inisialisasi state checkbox & konfigurasi periode dari buku kas / localStorage / Firestore
  useEffect(() => {
    // 1. Load Periode Config
    try {
      const savedPeriode = localStorage.getItem(KAS_PERIODE_STORAGE_KEY);
      if (savedPeriode) {
        const parsedPeriode = JSON.parse(savedPeriode);
        if (
          parsedPeriode &&
          Array.isArray(parsedPeriode.daftarBulan) &&
          parsedPeriode.daftarBulan.length > 0
        ) {
          setPeriodeConfig(parsedPeriode);
        }
      }
    } catch {}

    FirebaseServices.sharedState
      .get<KasPeriodeConfig>(KAS_PERIODE_FIRESTORE_KEY)
      .then((cloudPeriode) => {
        if (
          cloudPeriode &&
          Array.isArray(cloudPeriode.daftarBulan) &&
          cloudPeriode.daftarBulan.length > 0
        ) {
          setPeriodeConfig(cloudPeriode);
          try {
            localStorage.setItem(
              KAS_PERIODE_STORAGE_KEY,
              JSON.stringify(cloudPeriode)
            );
          } catch {}
        }
      })
      .catch(() => {});

    // 2. Load Checkboxes (Default diambil dari hasil input buku kas 97 mahasiswa)
    const initial = buildInitialCheckedMapForStudents(sortedMahasiswaByNim);

    try {
      const saved = localStorage.getItem(KAS_CHECKBOX_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setCheckedMap({ ...initial, ...parsed });
        } else {
          setCheckedMap(initial);
        }
      } else {
        setCheckedMap(initial);
        localStorage.setItem(KAS_CHECKBOX_STORAGE_KEY, JSON.stringify(initial));
      }
    } catch {
      setCheckedMap(initial);
    }
    setIsLoaded(true);

    // Sinkronisasi dari/ke Cloud Firestore (setemp4t63)
    FirebaseServices.sharedState
      .get<Record<string, Record<string, boolean>>>(KAS_FIRESTORE_KEY)
      .then((cloudMap) => {
        if (cloudMap && typeof cloudMap === 'object' && Object.keys(cloudMap).length > 0) {
          setCheckedMap((prev) => ({ ...prev, ...cloudMap }));
        } else {
          // Unggah data awal dari buku kas ke Firestore jika belum ada di cloud
          FirebaseServices.sharedState.set(KAS_FIRESTORE_KEY, initial);
        }
      })
      .catch(() => {});
  }, [sortedMahasiswaByNim]);

  // Simpan perubahan checkbox yang sudah di-Save ke localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        KAS_CHECKBOX_STORAGE_KEY,
        JSON.stringify(checkedMap)
      );
    } catch {}
  }, [checkedMap, isLoaded]);

  // Data yang ditampilkan di tabel: menggunakan draftCheckedMap saat Mode Edit aktif, atau checkedMap saat Mode Lihat
  const activeDisplayMap = isEditingChecklist ? draftCheckedMap : checkedMap;

  // Hitung berapa kotak yang berubah selama Mode Edit aktif
  const pendingChangesCount = useMemo(() => {
    if (!isEditingChecklist) return 0;
    let diff = 0;
    sortedMahasiswaByNim.forEach((m) => {
      const origRow = checkedMap[m.id] || {};
      const draftRow = draftCheckedMap[m.id] || {};
      periodeConfig.daftarBulan.forEach((b) => {
        if (Boolean(origRow[b.key]) !== Boolean(draftRow[b.key])) {
          diff += 1;
        }
      });
    });
    return diff;
  }, [
    isEditingChecklist,
    checkedMap,
    draftCheckedMap,
    sortedMahasiswaByNim,
    periodeConfig.daftarBulan,
  ]);

  // Modal Tambah Pengeluaran / Transaksi Lain
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tanggal, setTanggal] = useState('2026-11-01');
  const [judul, setJudul] = useState('');
  const [tipe, setTipe] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [kategori, setKategori] = useState<KategoriTransaksiKas>('Operasional');
  const [nominal, setNominal] = useState('50000');

  // Hitung pemasukan sesuai nominal masing-masing kolom periode (Agu=15rb, Sep=25rb -> Agu+Sep=40rb, Okt=20rb, Nov=20rb)
  const { totalIuranCheckbox, totalPemasukan, totalPengeluaran, totalSaldo } =
    useMemo(() => {
      let iuranNominal = 0;
      sortedMahasiswaByNim.forEach((m) => {
        const row = activeDisplayMap[m.id];
        if (row) {
          periodeConfig.daftarBulan.forEach((b) => {
            if (row[b.key]) {
              iuranNominal += getNominalForBulanItem(
                b,
                periodeConfig.nominalPerPeriode
              );
            }
          });
        }
      });

      const pemasukanLain = transaksiKasList
        .filter((t) => t.tipe === 'Pemasukan' && t.kategori !== 'Iuran kelas')
        .reduce((acc, t) => acc + t.nominal, 0);
      const pengeluaran = transaksiKasList
        .filter((t) => t.tipe === 'Pengeluaran')
        .reduce((acc, t) => acc + t.nominal, 0);

      const inc = iuranNominal + pemasukanLain;
      return {
        totalIuranCheckbox: iuranNominal,
        totalPemasukan: inc,
        totalPengeluaran: pengeluaran,
        totalSaldo: inc - pengeluaran,
      };
    }, [
      activeDisplayMap,
      sortedMahasiswaByNim,
      transaksiKasList,
      periodeConfig.daftarBulan,
      periodeConfig.nominalPerPeriode,
    ]);

  const filteredMahasiswaWithAbsen = useMemo(() => {
    const withAbsen = sortedMahasiswaByNim.map((m, idx) => ({
      mahasiswa: m,
      noAbsen: idx + 1,
    }));
    const q = searchQuery.trim().toLowerCase();
    if (!q) return withAbsen;
    return withAbsen.filter(
      ({ mahasiswa }) =>
        mahasiswa.namaLengkap.toLowerCase().includes(q) ||
        mahasiswa.nim.toLowerCase().includes(q)
    );
  }, [sortedMahasiswaByNim, searchQuery]);

  // LANGKAH 1: Mulai Mode Edit Checklist
  const handleStartEditChecklist = () => {
    if (!isBendaharaUser) {
      showToast(
        'Khusus Akses Bendahara',
        'Hanya Bendahara (Putri Oktania) dan Moch Dzulqarnain Serdy yang dapat mengedit checklist uang kas.',
        'warning'
      );
      return;
    }
    if (!isBendaharaAdmin) {
      setShowKeyPrompt(true);
      showToast(
        'Buka Akses Bendahara',
        'Masukkan Access Key Admin (SETEMP4T63XX) terlebih dahulu.',
        'info'
      );
      return;
    }
    const copy: Record<string, Record<string, boolean>> = {};
    Object.keys(checkedMap).forEach((id) => {
      copy[id] = { ...checkedMap[id] };
    });
    setDraftCheckedMap(copy);
    setIsEditingChecklist(true);
    showToast(
      'Mode Edit Checklist Aktif',
      'Silakan centang kas mahasiswa, lalu klik tombol "Simpan (Save)" jika sudah selesai.',
      'info'
    );
  };

  // LANGKAH 2: Centang/Ubah Checkbox di dalam Draft (Hanya bisa saat Mode Edit aktif)
  const handleToggleCheckbox = (mhsId: string, bulan: BulanKey) => {
    if (!isBendaharaUser) {
      showToast(
        'Khusus Akses Bendahara',
        'Hanya Bendahara (Putri Oktania) dan Moch Dzulqarnain Serdy yang dapat mengakses & mencentang checkbox uang kas.',
        'warning'
      );
      return;
    }

    if (!isBendaharaAdmin) {
      setShowKeyPrompt(true);
      showToast(
        'Akses Bendahara Diperlukan',
        'Masukkan Access Key Admin (SETEMP4T63XX) untuk membuka fitur Bendahara.',
        'info'
      );
      return;
    }

    if (!isEditingChecklist) {
      showToast(
        'Klik "Edit Checklist" Dahulu',
        'Untuk mencegah salah pencet, klik tombol "1. Edit Checklist" di atas tabel sebelum mencentang kas.',
        'info'
      );
      return;
    }

    const currentRow = draftCheckedMap[mhsId] || {};
    const nextVal = !currentRow[bulan];

    setDraftCheckedMap((prev) => ({
      ...prev,
      [mhsId]: {
        ...currentRow,
        [bulan]: nextVal,
      },
    }));
  };

  // LANGKAH 3: Simpan Perubahan (Save) dari Draft ke Database & Cloud Firestore
  const handleSaveChecklistChanges = () => {
    if (!isBendaharaAdmin || !isEditingChecklist) return;

    setCheckedMap(draftCheckedMap);
    try {
      localStorage.setItem(
        KAS_CHECKBOX_STORAGE_KEY,
        JSON.stringify(draftCheckedMap)
      );
    } catch {}
    FirebaseServices.sharedState.set(KAS_FIRESTORE_KEY, draftCheckedMap);

    const activeKey = periodeConfig.activeBulanKey;
    sortedMahasiswaByNim.forEach((m) => {
      const isActivePaid = Boolean(draftCheckedMap[m.id]?.[activeKey]);
      const existing = pembayaranKasList.find((p) => p.mahasiswaId === m.id);
      if (existing && (existing.status === 'Lunas') !== isActivePaid) {
        updatePembayaranKas({
          ...existing,
          status: isActivePaid ? 'Lunas' : 'Belum Lunas',
          tanggalPembayaran: isActivePaid
            ? new Date().toISOString().slice(0, 10)
            : null,
        });
      }
    });

    setIsEditingChecklist(false);
    showToast(
      'Checklist Kas Disimpan!',
      `Perubahan checklist kas berhasil disimpan dan dikunci kembali.`
    );
  };

  // Batal Edit Checklist
  const handleCancelEditChecklist = () => {
    setIsEditingChecklist(false);
    setDraftCheckedMap({});
    showToast(
      'Edit Dibatalkan',
      'Perubahan checklist yang belum disimpan telah dibatalkan.',
      'info'
    );
  };

  // Kirim Notifikasi Pengingat Kas ke Device Mahasiswa yang Belum Lunas
  const handleBroadcastKasReminder = async () => {
    if (!isBendaharaAdmin) return;
    const activeItem =
      periodeConfig.daftarBulan.find(
        (b) => b.key === periodeConfig.activeBulanKey
      ) || periodeConfig.daftarBulan[0];
    const nominal = activeItem
      ? getNominalForBulanItem(activeItem, periodeConfig.nominalPerPeriode)
      : periodeConfig.nominalPerPeriode;
    const payload: KasReminderBroadcastPayload = {
      id: `kas-rem-${Date.now()}`,
      bulanKey: activeItem?.key || periodeConfig.activeBulanKey,
      bulanLabel: activeItem?.fullLabel || periodeConfig.namaPeriode,
      nominal,
      sentAt: new Date().toISOString(),
      sentBy: currentUser.namaPanggilan,
    };
    await FirebaseServices.sharedState.set(KAS_REMINDER_BROADCAST_KEY, payload);
    try {
      localStorage.setItem(KAS_REMINDER_BROADCAST_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event('setemp4t-kas-reminder'));
    } catch {}
    showToast(
      'Notifikasi Pengingat Kas Dikirim!',
      `Pengingat kas periode ${payload.bulanLabel} telah dikirim ke perangkat mahasiswa yang belum lunas.`
    );
  };

  // Buka Modal Edit Periode Kas (Khusus Bendahara)
  const handleOpenPeriodeModal = () => {
    if (!isBendaharaAdmin) return;
    setDraftNamaPeriode(periodeConfig.namaPeriode);
    setDraftNominalPeriode(String(periodeConfig.nominalPerPeriode));
    setDraftActiveBulanKey(periodeConfig.activeBulanKey);
    setDraftDaftarBulan(
      periodeConfig.daftarBulan.map((b) => ({
        ...b,
        nominal: getNominalForBulanItem(b, periodeConfig.nominalPerPeriode),
      }))
    );
    setOpenPeriodeModal(true);
  };

  const handleAddDraftBulan = () => {
    const nextIdx = draftDaftarBulan.length + 1;
    const newKey = `bln_${Date.now().toString().slice(-4)}`;
    setDraftDaftarBulan((prev) => [
      ...prev,
      {
        key: newKey,
        label: `Bln ${nextIdx}`,
        fullLabel: `Bulan ${nextIdx} 2026`,
        nominal: Number(draftNominalPeriode) || 20000,
      },
    ]);
  };

  const handleRemoveDraftBulan = (keyToRemove: string) => {
    if (draftDaftarBulan.length <= 1) {
      showToast(
        'Minimal 1 Periode',
        'Harus ada minimal 1 kolom periode bulan kas.',
        'warning'
      );
      return;
    }
    const nextList = draftDaftarBulan.filter((b) => b.key !== keyToRemove);
    setDraftDaftarBulan(nextList);
    if (draftActiveBulanKey === keyToRemove && nextList[0]) {
      setDraftActiveBulanKey(nextList[0].key);
    }
  };

  const handleSavePeriodeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBendaharaAdmin) return;

    const baseNominal = Math.max(1000, Number(draftNominalPeriode) || 20000);
    const cleanedBulan = draftDaftarBulan
      .map((b) => ({
        key: b.key.trim(),
        label: b.label.trim() || 'Bln',
        fullLabel: b.fullLabel.trim() || b.label.trim() || 'Bulan Kas',
        nominal: Math.max(1000, Number(b.nominal) || baseNominal),
      }))
      .filter((b) => b.key.length > 0);

    if (cleanedBulan.length === 0) return;

    const validActiveKey = cleanedBulan.some(
      (b) => b.key === draftActiveBulanKey
    )
      ? draftActiveBulanKey
      : cleanedBulan[0].key;

    const newConfig: KasPeriodeConfig = {
      namaPeriode: draftNamaPeriode.trim() || 'Agu – Des 2026',
      nominalPerPeriode: baseNominal,
      activeBulanKey: validActiveKey,
      daftarBulan: cleanedBulan,
    };

    setPeriodeConfig(newConfig);
    try {
      localStorage.setItem(KAS_PERIODE_STORAGE_KEY, JSON.stringify(newConfig));
    } catch {}
    FirebaseServices.sharedState.set(KAS_PERIODE_FIRESTORE_KEY, newConfig);
    setOpenPeriodeModal(false);
    showToast(
      'Periode Kas Diperbarui',
      `Periode aktif: ${newConfig.namaPeriode}.`
    );
  };

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdminWithKey(quickAdminKey)) {
      setQuickAdminKey('');
      setShowKeyPrompt(false);
    }
  };

  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = Math.max(0, Number(nominal) || 0);
    if (!judul.trim() || numNominal <= 0) return;

    addTransaksiKas({
      tanggal,
      judul: judul.trim(),
      deskripsi: kategori,
      tipe,
      kategori,
      nominal: numNominal,
      createdById: currentUser.id,
    });
    setJudul('');
    setIsModalOpen(false);
  };

  const activeBulanObj =
    periodeConfig.daftarBulan.find(
      (b) => b.key === periodeConfig.activeBulanKey
    ) || periodeConfig.daftarBulan[0];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Bagian Atas: QR Code Pembayaran Kas & Tombol Link Google Drive */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-[#fffdf9] to-[#f4e8da]">
        <div className="flex flex-col md:flex-row items-center gap-5">
          {/* Gambar QRIS */}
          <div
            onClick={() => setOpenQrisModal(true)}
            className="relative group w-44 sm:w-48 shrink-0 rounded-2xl overflow-hidden border border-[#d8c2ab] bg-white p-2 shadow-sm cursor-pointer"
            title="Klik untuk memperbesar QRIS"
          >
            <img
              src="/qris-kas-st04.png"
              alt="QRIS Pembayaran Kas ST04"
              className="w-full h-auto rounded-xl object-contain"
            />
            <div className="mt-1.5 flex items-center justify-center gap-1 text-[11px] text-[#5c3724]">
              <Maximize2 className="w-3 h-3" />
              <span>Klik untuk Perbesar QR</span>
            </div>
          </div>

          {/* Informasi & Tombol Google Drive */}
          <div className="flex-1 space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#efe3d5] text-[#4e2e1d] text-[11px]">
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS Payment • Class Treasury</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
              Silakan scan kode QRIS di samping menggunakan aplikasi m-banking
              atau e-wallet Anda, lalu unggah bukti pembayarannya melalui tombol
              Google Drive di bawah ini agar diverifikasi oleh Bendahara.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
              <a
                href={KAS_DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl brown-shade-btn text-white text-xs shadow-sm hover:opacity-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Upload Bukti Pembayaran (Google Drive)</span>
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenQrisModal(true)}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Perbesar QR Code</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Ringkasan Saldo Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl hero-mesh text-white">
          <div className="text-[11px] uppercase text-amber-100">
            Saldo Kas Aktif • Active Balance
          </div>
          <div className="text-2xl mt-1">{formatRupiah(totalSaldo)}</div>
          <div className="text-[11px] text-amber-100/85 mt-1">
            Periode: {periodeConfig.namaPeriode} • Aktif:{' '}
            {activeBulanObj?.label}
          </div>
        </div>

        <Card className="p-4">
          <div className="text-[11px] uppercase text-stone-400">
            Total Pemasukan • Total Income
          </div>
          <div className="text-xl text-[#5c3724] mt-1">
            {formatRupiah(totalPemasukan)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            From Checklist: {formatRupiah(totalIuranCheckbox)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] uppercase text-stone-400">
            Total Pengeluaran • Total Expenses
          </div>
          <div className="text-xl text-rose-600 mt-1">
            {formatRupiah(totalPengeluaran)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            Class Operational & Events
          </div>
        </Card>
      </div>

      {/* Tab & Kontrol Bendahara */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-[#efe3d5] p-1 rounded-2xl border border-[#d8c4ae]">
          <button
            onClick={() => setActiveTab('iuran')}
            className={`px-3.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
              activeTab === 'iuran'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Checklist Kas ({sortedMahasiswaByNim.length})
          </button>
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
              activeTab === 'transaksi'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Riwayat Kas ({transaksiKasList.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isBendaharaUser && !isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowKeyPrompt((prev) => !prev)}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Mode Bendahara</span>
            </Button>
          )}
          {!isBendaharaUser && (
            <Badge variant="neutral">
              Checklist Khusus Bendahara
            </Badge>
          )}

          {/* Tombol-Tombol Khusus Mode Bendahara (Putri Oktania & Moch Dzulqarnain Serdy + Access Key Unlocked) */}
          {isBendaharaAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBroadcastKasReminder}
              >
                <BellRing className="w-3.5 h-3.5 text-amber-700" />
                <span>Kirim Notif Pengingat Kas</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPeriodeModal}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Edit Periode Kas</span>
              </Button>

              {activeTab === 'iuran' && !isEditingChecklist && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartEditChecklist}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>1. Edit Checklist Kas</span>
                </Button>
              )}

              {activeTab === 'iuran' && isEditingChecklist && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveChecklistChanges}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      3. Simpan Perubahan (Save)
                      {pendingChangesCount > 0
                        ? ` (${pendingChangesCount})`
                        : ''}
                    </span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEditChecklist}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </Button>
                </>
              )}

              {activeTab === 'transaksi' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Catat Kas</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Input Cepat Access Key khusus untuk Bendahara */}
      {showKeyPrompt && isBendaharaUser && !isAdmin && (
        <Card className="p-3.5 bg-[#faf3eb] border-[#d8be9f] animate-fadeIn">
          <form
            onSubmit={handleQuickUnlock}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <Input
              type="password"
              placeholder="Masukkan Access Key Bendahara/Admin untuk membuka pengelolaan kas..."
              value={quickAdminKey}
              onChange={(e) => setQuickAdminKey(e.target.value)}
              className="text-xs py-1.5"
            />
            <Button type="submit" variant="primary" size="sm">
              Buka Mode Bendahara
            </Button>
          </form>
        </Card>
      )}

      {/* Panduan Langkah-Langkah Edit Checklist (Khusus Mode Bendahara di Tab Checklist) */}
      {isBendaharaAdmin && activeTab === 'iuran' && (
        <div
          className={`rounded-2xl p-3.5 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
            isEditingChecklist
              ? 'bg-amber-50/95 border-amber-300 text-[#3b2216]'
              : 'bg-[#f8efe4] border-[#dcc7b0] text-[#4e2e1d]'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            {isEditingChecklist ? (
              <Pencil className="w-4 h-4 text-amber-700 shrink-0 mt-0.5 sm:mt-0" />
            ) : (
              <Lock className="w-4 h-4 text-[#5c3724] shrink-0 mt-0.5 sm:mt-0" />
            )}
            <div>
              <div className="text-xs text-[#2d180e]">
                {isEditingChecklist
                  ? 'Mode Edit Checklist Aktif — Silakan Centang Kas Mahasiswa'
                  : 'Checklist Terkunci (Aman dari Salah Pencet saat Scroll)'}
              </div>
              <div className="text-[11px] text-stone-600 mt-0.5">
                Alur Bendahara:{' '}
                <span
                  className={
                    !isEditingChecklist ? 'underline text-[#5c3724]' : ''
                  }
                >
                  1. Klik &ldquo;Edit Checklist Kas&rdquo;
                </span>{' '}
                →{' '}
                <span
                  className={
                    isEditingChecklist ? 'underline text-amber-800' : ''
                  }
                >
                  2. Centang / Ubah Kotak Kas
                </span>{' '}
                →{' '}
                <span
                  className={
                    isEditingChecklist && pendingChangesCount > 0
                      ? 'underline text-emerald-800'
                      : ''
                  }
                >
                  3. Klik &ldquo;Simpan Perubahan (Save)&rdquo;
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditingChecklist ? (
              <Badge variant="warning">
                {pendingChangesCount} Perubahan Belum Disimpan
              </Badge>
            ) : (
              <Badge variant="ipb">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Tersimpan & Terkunci
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: CHECKBOX KAS MAHASISWA (URUT NIM) */}
      {activeTab === 'iuran' ? (
        <Card className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari nama atau NIM (Urutan Absen berdasarkan NIM)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 py-1.5 text-xs"
              />
            </div>
            <span className="text-[11px] text-stone-500">
              Urut Absen NIM • {periodeConfig.namaPeriode}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#fffcf8] z-10 border-b border-[#dfd0bf]">
                <tr className="text-[11px] uppercase text-[#4e2e1d]">
                  <th className="py-2.5 px-2 w-8">No</th>
                  <th className="py-2.5 px-2">Nama & NIM</th>
                  {periodeConfig.daftarBulan.map((b) => (
                    <th
                      key={b.key}
                      className={`py-2.5 px-2 text-center w-16 ${
                        b.key === periodeConfig.activeBulanKey
                          ? 'text-[#5c3724] underline decoration-amber-600/60'
                          : ''
                      }`}
                      title={`${b.fullLabel} (${formatRupiah(
                        getNominalForBulanItem(b, periodeConfig.nominalPerPeriode)
                      )})`}
                    >
                      {b.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 text-xs">
                {filteredMahasiswaWithAbsen.map(({ mahasiswa: m, noAbsen }) => {
                  const row = activeDisplayMap[m.id] || {};
                  const paidNominal = periodeConfig.daftarBulan.reduce(
                    (sum, b) =>
                      row[b.key]
                        ? sum +
                          getNominalForBulanItem(
                            b,
                            periodeConfig.nominalPerPeriode
                          )
                        : sum,
                    0
                  );

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#faf5ef] transition-colors"
                    >
                      <td className="py-2.5 px-2 text-stone-400 font-mono">
                        {noAbsen}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="text-[#2d180e]">{m.namaLengkap}</div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {m.nim} • {m.programStudi}
                        </div>
                      </td>

                      {periodeConfig.daftarBulan.map((b) => {
                        const checked = !!row[b.key];
                        const isChanged =
                          isEditingChecklist &&
                          Boolean(checkedMap[m.id]?.[b.key]) !== checked;
                        return (
                          <td
                            key={b.key}
                            className={`py-2.5 px-2 text-center ${
                              isChanged ? 'bg-amber-100/70 rounded-lg' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleToggleCheckbox(m.id, b.key)
                              }
                              aria-label={`Kas ${m.namaLengkap} bulan ${b.label}`}
                              title={
                                isBendaharaAdmin && isEditingChecklist
                                  ? `Centang kas ${m.namaLengkap} (${b.fullLabel})`
                                  : isBendaharaAdmin
                                    ? 'Klik tombol "1. Edit Checklist Kas" terlebih dahulu untuk mengubah centang'
                                    : 'Khusus Akses Bendahara'
                              }
                              className={`w-4 h-4 rounded accent-[#5c3724] transition-transform ${
                                isBendaharaAdmin && isEditingChecklist
                                  ? 'cursor-pointer hover:scale-110 ring-2 ring-amber-400/50'
                                  : 'cursor-not-allowed opacity-70'
                              }`}
                            />
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-2 text-right">
                        <Badge
                          variant={paidNominal > 0 ? 'success' : 'warning'}
                        >
                          {formatRupiah(paidNominal)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* TAB 2: RIWAYAT ARUS KAS */
        <Card className="divide-y divide-stone-200/70 overflow-hidden">
          {transaksiKasList.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500">
              Belum ada catatan transaksi kas (Empty Transaction History).
            </div>
          ) : (
            transaksiKasList.map((trx: TransaksiKas) => (
              <div
                key={trx.id}
                className="p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="text-[#2d180e] truncate">{trx.judul}</div>
                  <div className="text-[11px] text-stone-500">
                    {formatTanggalIndo(trx.tanggal)} • {trx.kategori}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={
                      trx.tipe === 'Pemasukan'
                        ? 'text-[#5c3724]'
                        : 'text-rose-600'
                    }
                  >
                    {trx.tipe === 'Pemasukan' ? '+' : '-'}
                    {formatRupiah(trx.nominal)}
                  </span>
                  {isBendaharaAdmin && (
                    <button
                      onClick={() => deleteTransaksiKas(trx.id)}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {/* Modal Edit Periode Kas (Khusus Bendahara) */}
      <Modal
        isOpen={openPeriodeModal}
        onClose={() => setOpenPeriodeModal(false)}
        title="Edit Periode Kas Kelas"
        subtitle="Atur rentang periode, bulan pengingat aktif, dan nominal tiap kolom periode"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSavePeriodeConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Nama Rentang Periode
              </label>
              <Input
                required
                placeholder="Contoh: Agu (Acara) – Des 2026"
                value={draftNamaPeriode}
                onChange={(e) => setDraftNamaPeriode(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Nominal Standar per Bulan (Rp)
              </label>
              <Input
                type="number"
                required
                min={1000}
                step={1000}
                value={draftNominalPeriode}
                onChange={(e) => setDraftNominalPeriode(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Periode/Bulan Aktif Saat Ini (Untuk Pengingat di Profil Mahasiswa)
            </label>
            <Select
              value={draftActiveBulanKey}
              onChange={(e) => setDraftActiveBulanKey(e.target.value)}
            >
              {draftDaftarBulan.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.fullLabel} ({b.label})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-stone-700">
                Daftar Kolom Periode & Nominal per Kolom ({draftDaftarBulan.length})
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDraftBulan}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Periode</span>
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {draftDaftarBulan.map((b, idx) => (
                <div
                  key={b.key}
                  className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-[#faf5ef] border border-[#e3d3c1]"
                >
                  <span className="text-xs text-stone-400 font-mono w-5 text-center">
                    {idx + 1}
                  </span>
                  <Input
                    placeholder="Kolom (Agu)"
                    value={b.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftDaftarBulan((prev) =>
                        prev.map((item) =>
                          item.key === b.key ? { ...item, label: val } : item
                        )
                      );
                    }}
                    className="w-24 text-xs py-1"
                  />
                  <Input
                    placeholder="Nama Lengkap Periode"
                    value={b.fullLabel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftDaftarBulan((prev) =>
                        prev.map((item) =>
                          item.key === b.key
                            ? { ...item, fullLabel: val }
                            : item
                        )
                      );
                    }}
                    className="flex-1 min-w-[140px] text-xs py-1"
                  />
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    placeholder="Nominal (Rp)"
                    value={String(b.nominal ?? 20000)}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDraftDaftarBulan((prev) =>
                        prev.map((item) =>
                          item.key === b.key ? { ...item, nominal: val } : item
                        )
                      );
                    }}
                    className="w-24 text-xs py-1 font-mono"
                    title="Nominal khusus kolom ini (Rp)"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDraftBulan(b.key)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Hapus periode ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPeriodeModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Periode
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Perbesar QRIS */}
      <Modal
        isOpen={openQrisModal}
        onClose={() => setOpenQrisModal(false)}
        title="QRIS Kas Kelas ST04"
      >
        <div className="space-y-4 text-center">
          <div className="bg-white p-3 rounded-2xl border border-[#dfd0bf] inline-block mx-auto">
            <img
              src="/qris-kas-st04.png"
              alt="QRIS Kas Kelas ST04"
              className="max-h-[65vh] w-auto mx-auto rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href={KAS_DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl brown-shade-btn text-white text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Upload Bukti ke Google Drive</span>
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenQrisModal(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Catat Transaksi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Kas"
        subtitle="Record new income or expense"
      >
        <form onSubmit={handleSaveTransaksi} className="space-y-3.5">
          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Keterangan
            </label>
            <Input
              required
              placeholder="Contoh: Fotokopi Modul Latihan"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">Jenis</label>
              <Select
                value={tipe}
                onChange={(e) =>
                  setTipe(e.target.value as 'Pemasukan' | 'Pengeluaran')
                }
              >
                <option value="Pengeluaran">Pengeluaran</option>
                <option value="Pemasukan">Pemasukan Lain</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Nominal (Rp)
              </label>
              <Input
                type="number"
                required
                min={1000}
                step={1000}
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Kategori
              </label>
              <Select
                value={kategori}
                onChange={(e) =>
                  setKategori(e.target.value as KategoriTransaksiKas)
                }
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Tanggal
              </label>
              <Input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Transaction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

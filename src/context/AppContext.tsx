'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  ActiveModuleId,
  Jadwal,
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
import {
  INITIAL_JADWAL,
  INITIAL_KELOMPOK,
  INITIAL_LINK_PENTING,
  INITIAL_MAHASISWA,
  INITIAL_MATA_KULIAH,
  INITIAL_PEMBAYARAN_KAS,
  INITIAL_PENGUMUMAN,
  INITIAL_RIWAYAT_RANDOMISASI,
  INITIAL_TRANSAKSI_KAS,
} from '@/lib/seed-data';
import { FirebaseServices } from '@/lib/firebase/services';
import { isFirebaseConfigured } from '@/lib/firebase/config';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'warning';
}

const VALID_ADMIN_KEYS = ['SETEMP4T63XX'];

const STORAGE_KEY = 'setemp4t_st04_db_v7';
const SESSION_KEY = 'setemp4t_auth_session_v1';
const ACCOUNTS_KEY = 'setemp4t_accounts_map_v1';

interface AppContextType {
  // Navigation & Auth
  activeModule: ActiveModuleId;
  setActiveModule: (mod: ActiveModuleId) => void;
  currentUser: Mahasiswa;
  isLoggedIn: boolean;
  isAdmin: boolean;
  lastSavedNim: string;
  isConnectedToFirebase: boolean;

  // Auth & Access Key Actions
  findMahasiswaByNim: (nimOrName: string) => Mahasiswa | undefined;
  loginOrRegister: (
    nimInput: string,
    passwordInput: string,
    forceResetPassword?: boolean
  ) => boolean;
  loginWithNim: (nim: string, password: string) => boolean;
  createPasswordAndLogin: (nim: string, newPassword: string) => boolean;
  changeOwnPassword: (newPassword: string) => void;
  unlockAdminWithKey: (accessKey: string) => boolean;
  lockAdmin: () => void;
  logout: () => void;
  setCurrentUserById: (id: string) => void;
  switchRoleDemo: (role: UserRole) => void;

  // Entities
  mahasiswaList: Mahasiswa[];
  mataKuliahList: MataKuliah[];
  kelompokList: Kelompok[];
  pembayaranKasList: PembayaranKas[];
  transaksiKasList: TransaksiKas[];
  pengumumanList: Pengumuman[];
  jadwalList: Jadwal[];
  riwayatRandomisasiList: RiwayatRandomisasi[];
  linkPentingList: LinkPenting[];

  // Actions - Mahasiswa & Role
  addMahasiswa: (m: Omit<Mahasiswa, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMahasiswa: (m: Mahasiswa) => void;
  deleteMahasiswa: (id: string) => void;
  updateUserRole: (id: string, role: UserRole) => void;

  // Actions - Mata Kuliah
  addMataKuliah: (mk: Omit<MataKuliah, 'id'>) => void;
  updateMataKuliah: (mk: MataKuliah) => void;
  deleteMataKuliah: (id: string) => void;

  // Actions - Kelompok
  saveKelompok: (k: Kelompok) => void;
  deleteKelompok: (id: string) => void;
  applyRandomizerToMataKuliah: (
    mataKuliahId: string,
    jenis: 'Praktikum' | 'Tugas',
    riwayat: RiwayatRandomisasi
  ) => void;

  // Actions - Kas Kelas & Iuran
  addTransaksiKas: (t: Omit<TransaksiKas, 'id' | 'createdAt'>) => void;
  updateTransaksiKas: (t: TransaksiKas) => void;
  deleteTransaksiKas: (id: string) => void;
  updatePembayaranKas: (p: PembayaranKas) => void;

  // Actions - Informasi (Pengumuman & Jadwal/Tugas)
  addPengumuman: (p: Omit<Pengumuman, 'id'>) => void;
  deletePengumuman: (id: string) => void;
  addJadwal: (j: Omit<Jadwal, 'id'>) => void;
  deleteJadwal: (id: string) => void;

  // Actions - Randomizer
  addRiwayatRandomisasi: (r: RiwayatRandomisasi) => void;
  deleteRiwayatRandomisasi: (id: string) => void;

  // System Utilities
  resetToDefaultSeed: () => void;
  toasts: ToastMessage[];
  showToast: (
    title: string,
    description?: string,
    type?: 'success' | 'info' | 'warning'
  ) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeModule, setActiveModule] = useState<ActiveModuleId>('dashboard');
  const [mahasiswaList, setMahasiswaList] =
    useState<Mahasiswa[]>(INITIAL_MAHASISWA);
  const [mataKuliahList, setMataKuliahList] =
    useState<MataKuliah[]>(INITIAL_MATA_KULIAH);
  const [kelompokList, setKelompokList] = useState<Kelompok[]>(INITIAL_KELOMPOK);
  const [pembayaranKasList, setPembayaranKasList] = useState<PembayaranKas[]>(
    INITIAL_PEMBAYARAN_KAS
  );
  const [transaksiKasList, setTransaksiKasList] = useState<TransaksiKas[]>(
    INITIAL_TRANSAKSI_KAS
  );
  const [pengumumanList, setPengumumanList] =
    useState<Pengumuman[]>(INITIAL_PENGUMUMAN);
  const [jadwalList, setJadwalList] = useState<Jadwal[]>(INITIAL_JADWAL);
  const [riwayatRandomisasiList, setRiwayatRandomisasiList] = useState<
    RiwayatRandomisasi[]
  >(INITIAL_RIWAYAT_RANDOMISASI);
  const [linkPentingList] = useState<LinkPenting[]>(INITIAL_LINK_PENTING);

  const [currentUserId, setCurrentUserId] = useState<string>('mhs-001');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [lastSavedNim, setLastSavedNim] = useState<string>('');
  const [accountsMap, setAccountsMap] = useState<Record<string, string>>({});
  const [isHydrated, setIsHydrated] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      type: 'success' | 'info' | 'warning' = 'success'
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load persisted data & auth session on mount
  useEffect(() => {
    try {
      // 1. Load Accounts Map (NIM -> Password)
      const savedAccountsRaw = localStorage.getItem(ACCOUNTS_KEY);
      let loadedAccounts: Record<string, string> = {};
      if (savedAccountsRaw) {
        loadedAccounts = JSON.parse(savedAccountsRaw) || {};
        setAccountsMap(loadedAccounts);
      }

      // 2. Load Database Entities
      const savedDbRaw = localStorage.getItem(STORAGE_KEY);
      if (savedDbRaw) {
        const parsed = JSON.parse(savedDbRaw);
        if (parsed.mahasiswaList?.length) {
          setMahasiswaList(
            parsed.mahasiswaList.map((m: Mahasiswa) => ({
              ...m,
              password: loadedAccounts[m.nim.toUpperCase()] || m.password,
            }))
          );
        }
        if (parsed.mataKuliahList?.length)
          setMataKuliahList(parsed.mataKuliahList);
        if (parsed.kelompokList?.length) setKelompokList(parsed.kelompokList);
        if (parsed.pembayaranKasList?.length)
          setPembayaranKasList(parsed.pembayaranKasList);
        if (parsed.transaksiKasList?.length)
          setTransaksiKasList(parsed.transaksiKasList);
        if (parsed.pengumumanList?.length)
          setPengumumanList(parsed.pengumumanList);
        if (parsed.jadwalList?.length) setJadwalList(parsed.jadwalList);
        if (parsed.riwayatRandomisasiList?.length)
          setRiwayatRandomisasiList(parsed.riwayatRandomisasiList);
      } else {
        setMahasiswaList((prev) =>
          prev.map((m) => ({
            ...m,
            password: loadedAccounts[m.nim.toUpperCase()] || m.password,
          }))
        );
      }

      // 3. Load Persistent Auth Session ("Remember Login")
      const savedSessionRaw = localStorage.getItem(SESSION_KEY);
      if (savedSessionRaw) {
        const session = JSON.parse(savedSessionRaw);
        if (session.currentUserId) setCurrentUserId(session.currentUserId);
        if (session.lastNim) setLastSavedNim(session.lastNim);
        if (typeof session.isLoggedIn === 'boolean')
          setIsLoggedIn(session.isLoggedIn);
        if (typeof session.isAdminUnlocked === 'boolean')
          setIsAdminUnlocked(session.isAdminUnlocked);
      }
    } catch (e) {
      console.warn('Failed to parse local storage state:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist database changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mahasiswaList,
          mataKuliahList,
          kelompokList,
          pembayaranKasList,
          transaksiKasList,
          pengumumanList,
          jadwalList,
          riwayatRandomisasiList,
        })
      );
    } catch (e) {
      console.warn('Failed to persist db to localStorage:', e);
    }
  }, [
    isHydrated,
    mahasiswaList,
    mataKuliahList,
    kelompokList,
    pembayaranKasList,
    transaksiKasList,
    pengumumanList,
    jadwalList,
    riwayatRandomisasiList,
  ]);

  // Persist Auth Session & Remember Me separately so it is never lost
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          currentUserId,
          lastNim: lastSavedNim,
          isLoggedIn,
          isAdminUnlocked,
        })
      );
    } catch (e) {
      console.warn('Failed to persist session:', e);
    }
  }, [isHydrated, currentUserId, lastSavedNim, isLoggedIn, isAdminUnlocked]);

  const saveAccountPassword = (nim: string, pass: string) => {
    const cleanNim = nim.trim().toUpperCase();
    setAccountsMap((prev) => {
      const next = { ...prev, [cleanNim]: pass };
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save account password:', e);
      }
      return next;
    });
  };

  const currentUser =
    mahasiswaList.find((m) => m.id === currentUserId) || mahasiswaList[0];

  const isAdmin = isAdminUnlocked;

  const findMahasiswaByNim = useCallback(
    (nimOrName: string) => {
      const clean = nimOrName.trim().toUpperCase();
      if (!clean) return undefined;
      return (
        mahasiswaList.find((m) => m.nim.toUpperCase() === clean) ||
        mahasiswaList.find(
          (m) =>
            m.namaLengkap.toUpperCase() === clean ||
            m.namaPanggilan.toUpperCase() === clean
        )
      );
    },
    [mahasiswaList]
  );

  // Fungsi Login Terpadu: Pasti berhasil masuk & langsung menyimpan sesi ke localStorage
  const loginOrRegister = (
    nimInput: string,
    passwordInput: string
  ): boolean => {
    const cleanNim = nimInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim() || 'st04';

    if (!cleanNim) {
      showToast('Masukkan NIM', 'Silakan ketik NIM atau pilih nama Anda.', 'warning');
      return false;
    }

    let target = findMahasiswaByNim(cleanNim);

    // Jika input berupa potongan nama (misal: "Moch" atau "Raditya"), cari yang cocok
    if (!target) {
      target = mahasiswaList.find(
        (m) =>
          m.namaLengkap.toUpperCase().includes(cleanNim) ||
          m.namaPanggilan.toUpperCase().includes(cleanNim) ||
          m.nim.toUpperCase().includes(cleanNim)
      );
    }

    // Jika NIM belum terdaftar di 71 data awal, otomatis buatkan akun mahasiswa ST04 baru
    if (!target) {
      const newId = `mhs-${String(mahasiswaList.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const newMhs: Mahasiswa = {
        id: newId,
        nim: cleanNim,
        namaLengkap: `Mahasiswa ST04 (${cleanNim})`,
        namaPanggilan: cleanNim,
        fotoUrl: '',
        gender: 'L',
        fakultas: 'Fakultas Pertanian',
        programStudi: 'Kelas ST04',
        kelas: 'ST04',
        domisili: 'IPB Dramaga, Bogor',
        asalDaerah: 'Indonesia',
        password: cleanPass,
        email: `${cleanNim.toLowerCase()}@apps.ipb.ac.id`,
        whatsapp: '-',
        instagram: '-',
        linkedin: '-',
        tentangSaya: {
          mottoHidup: 'SETEMP4T ST04',
          hobi: [],
          minat: [],
          keahlian: [],
          prestasi: [],
        },
        role: 'mahasiswa',
        statusAktif: true,
        aktivitasKelas: [],
        createdAt: now,
        updatedAt: now,
      };
      setMahasiswaList((prev) => [newMhs, ...prev]);
      saveAccountPassword(cleanNim, cleanPass);
      setCurrentUserId(newMhs.id);
      setLastSavedNim(cleanNim);
      setIsLoggedIn(true);
      try {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            currentUserId: newMhs.id,
            lastNim: cleanNim,
            isLoggedIn: true,
            isAdminUnlocked,
          })
        );
      } catch {}
      showToast('Berhasil Masuk!', `Selamat datang di SETEMP4T (${cleanNim}).`);
      return true;
    }

    // Simpan password & aktifkan sesi login secara sinkron
    const updated: Mahasiswa = {
      ...target,
      password: cleanPass,
      updatedAt: new Date().toISOString(),
    };
    setMahasiswaList((prev) =>
      prev.map((m) => (m.id === target!.id ? updated : m))
    );
    saveAccountPassword(target.nim, cleanPass);
    setCurrentUserId(target.id);
    setLastSavedNim(target.nim);
    setIsLoggedIn(true);
    try {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          currentUserId: target.id,
          lastNim: target.nim,
          isLoggedIn: true,
          isAdminUnlocked,
        })
      );
    } catch {}
    showToast(`Selamat datang, ${target.namaPanggilan}!`);
    return true;
  };

  const loginWithNim = (nim: string, password: string): boolean => {
    return loginOrRegister(nim, password);
  };

  const createPasswordAndLogin = (nim: string, newPassword: string): boolean => {
    return loginOrRegister(nim, newPassword);
  };

  const changeOwnPassword = (newPassword: string) => {
    const clean = newPassword.trim();
    if (!clean) {
      showToast('Password Tidak Boleh Kosong', undefined, 'warning');
      return;
    }
    const updated: Mahasiswa = {
      ...currentUser,
      password: clean,
      updatedAt: new Date().toISOString(),
    };
    setMahasiswaList((prev) =>
      prev.map((m) => (m.id === currentUser.id ? updated : m))
    );
    saveAccountPassword(currentUser.nim, clean);
    FirebaseServices.mahasiswa.save(updated);
    showToast('Password Diperbarui', 'Password baru Anda telah disimpan.');
  };

  const unlockAdminWithKey = (accessKey: string): boolean => {
    const clean = accessKey.trim().toUpperCase();
    if (VALID_ADMIN_KEYS.includes(clean)) {
      setIsAdminUnlocked(true);
      showToast('Akses Admin Aktif', 'Anda kini dapat mengelola data kelas.');
      return true;
    }
    showToast('Access Key Salah', 'Kode akses admin tidak valid.', 'warning');
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
    showToast('Mode Admin Dikunci', 'Kembali ke mode tampilan mahasiswa.', 'info');
  };

  const logout = () => {
    setIsLoggedIn(false);
    setIsAdminUnlocked(false);
    setActiveModule('dashboard');
    showToast('Berhasil Keluar', 'NIM Anda tetap diingat untuk login berikutnya.', 'info');
  };

  const setCurrentUserById = (id: string) => {
    const target = mahasiswaList.find((m) => m.id === id);
    if (target) {
      setCurrentUserId(id);
      setLastSavedNim(target.nim);
    }
  };

  const switchRoleDemo = (role: UserRole) => {
    if (role !== 'mahasiswa') {
      setIsAdminUnlocked(true);
    } else {
      setIsAdminUnlocked(false);
    }
  };

  // CRUD Mahasiswa
  const addMahasiswa = (
    m: Omit<Mahasiswa, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newId = `mhs-${String(mahasiswaList.length + 1).padStart(3, '0')}-${Date.now()
      .toString()
      .slice(-3)}`;
    const now = new Date().toISOString();
    const newMahasiswa: Mahasiswa = {
      ...m,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setMahasiswaList((prev) => [newMahasiswa, ...prev]);
    const newKas: PembayaranKas = {
      id: `kas-okt-${newId}`,
      mahasiswaId: newId,
      bulan: 'Oktober 2026',
      periodeKey: '2026-10',
      nominal: 20000,
      status: 'Belum Lunas',
      tanggalPembayaran: null,
      catatan: 'Iuran wajib Rp20.000/bulan',
    };
    setPembayaranKasList((prev) => [newKas, ...prev]);
    FirebaseServices.mahasiswa.save(newMahasiswa);
    FirebaseServices.pembayaranKas.save(newKas);
    showToast('Mahasiswa Ditambahkan', `${m.namaLengkap} (${m.nim})`);
  };

  const updateMahasiswa = (updated: Mahasiswa) => {
    const withTime = { ...updated, updatedAt: new Date().toISOString() };
    setMahasiswaList((prev) =>
      prev.map((m) => (m.id === updated.id ? withTime : m))
    );
    FirebaseServices.mahasiswa.save(withTime);
    showToast('Profil Disimpan');
  };

  const deleteMahasiswa = (id: string) => {
    setMahasiswaList((prev) => prev.filter((m) => m.id !== id));
    setPembayaranKasList((prev) => prev.filter((p) => p.mahasiswaId !== id));
    FirebaseServices.mahasiswa.delete(id);
    showToast('Mahasiswa Dihapus', undefined, 'warning');
  };

  const updateUserRole = (id: string, role: UserRole) => {
    const target = mahasiswaList.find((m) => m.id === id);
    if (!target) return;
    const updated = {
      ...target,
      role,
      updatedAt: new Date().toISOString(),
    };
    setMahasiswaList((prev) => prev.map((m) => (m.id === id ? updated : m)));
    FirebaseServices.mahasiswa.save(updated);
    showToast('Jabatan Diperbarui', `${target.namaPanggilan} -> ${role.toUpperCase()}`);
  };

  // CRUD Mata Kuliah
  const addMataKuliah = (mk: Omit<MataKuliah, 'id'>) => {
    const newMk: MataKuliah = {
      ...mk,
      id: `mk-${mk.kode.toLowerCase()}-${Date.now().toString().slice(-3)}`,
    };
    setMataKuliahList((prev) => [...prev, newMk]);
    FirebaseServices.mataKuliah.save(newMk);
    showToast('Mata Kuliah Ditambahkan', mk.nama);
  };

  const updateMataKuliah = (mk: MataKuliah) => {
    setMataKuliahList((prev) =>
      prev.map((item) => (item.id === mk.id ? mk : item))
    );
    FirebaseServices.mataKuliah.save(mk);
    showToast('Mata Kuliah Diperbarui');
  };

  const deleteMataKuliah = (id: string) => {
    setMataKuliahList((prev) => prev.filter((m) => m.id !== id));
    setKelompokList((prev) => prev.filter((k) => k.mataKuliahId !== id));
    FirebaseServices.mataKuliah.delete(id);
    showToast('Mata Kuliah Dihapus', undefined, 'warning');
  };

  // CRUD Kelompok
  const saveKelompok = (k: Kelompok) => {
    setKelompokList((prev) => {
      const exists = prev.some((item) => item.id === k.id);
      if (exists) {
        return prev.map((item) => (item.id === k.id ? k : item));
      }
      return [...prev, k];
    });
    FirebaseServices.kelompok.save(k);
    showToast('Kelompok Disimpan');
  };

  const deleteKelompok = (id: string) => {
    setKelompokList((prev) => prev.filter((k) => k.id !== id));
    FirebaseServices.kelompok.delete(id);
    showToast('Kelompok Dihapus', undefined, 'warning');
  };

  const applyRandomizerToMataKuliah = (
    mataKuliahId: string,
    jenis: 'Praktikum' | 'Tugas',
    riwayat: RiwayatRandomisasi
  ) => {
    const mk = mataKuliahList.find((m) => m.id === mataKuliahId);
    const newGroups: Kelompok[] = riwayat.hasilKelompok.map((hk) => ({
      id: `klp-${mataKuliahId}-${hk.nomorKelompok}-${Date.now()
        .toString()
        .slice(-3)}`,
      mataKuliahId,
      namaKelompok: hk.namaKelompok,
      jenis,
      ketuaId: hk.ketuaId,
      anggotaIds: hk.anggotaIds,
      topikTugas: `${riwayat.judul} (${hk.namaKelompok})`,
      createdAt: new Date().toISOString(),
    }));

    setKelompokList((prev) => [
      ...prev.filter((k) => k.mataKuliahId !== mataKuliahId),
      ...newGroups,
    ]);
    newGroups.forEach((g) => FirebaseServices.kelompok.save(g));
    showToast(
      'Kelompok Diterapkan',
      `${newGroups.length} kelompok disimpan ke ${mk?.nama || 'Mata Kuliah'}.`
    );
  };

  // CRUD Kas Kelas & Iuran
  const addTransaksiKas = (t: Omit<TransaksiKas, 'id' | 'createdAt'>) => {
    const newTrx: TransaksiKas = {
      ...t,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTransaksiKasList((prev) => [newTrx, ...prev]);
    FirebaseServices.transaksiKas.save(newTrx);
    showToast('Transaksi Dicatat', t.judul);
  };

  const updateTransaksiKas = (t: TransaksiKas) => {
    setTransaksiKasList((prev) =>
      prev.map((item) => (item.id === t.id ? t : item))
    );
    FirebaseServices.transaksiKas.save(t);
    showToast('Transaksi Diperbarui');
  };

  const deleteTransaksiKas = (id: string) => {
    setTransaksiKasList((prev) => prev.filter((t) => t.id !== id));
    FirebaseServices.transaksiKas.delete(id);
    showToast('Transaksi Dihapus', undefined, 'warning');
  };

  const updatePembayaranKas = (p: PembayaranKas) => {
    setPembayaranKasList((prev) =>
      prev.map((item) => (item.id === p.id ? p : item))
    );
    FirebaseServices.pembayaranKas.save(p);
    showToast('Status Kas Diperbarui', p.status);
  };

  // CRUD Pengumuman & Jadwal
  const addPengumuman = (p: Omit<Pengumuman, 'id'>) => {
    const newPeng: Pengumuman = {
      ...p,
      id: `peng-${Date.now()}`,
    };
    setPengumumanList((prev) => [newPeng, ...prev]);
    FirebaseServices.pengumuman.save(newPeng);
    showToast('Pengumuman Ditambahkan');
  };

  const deletePengumuman = (id: string) => {
    setPengumumanList((prev) => prev.filter((p) => p.id !== id));
    FirebaseServices.pengumuman.delete(id);
    showToast('Pengumuman Dihapus', undefined, 'warning');
  };

  const addJadwal = (j: Omit<Jadwal, 'id'>) => {
    const newJdw: Jadwal = {
      ...j,
      id: `jdw-${Date.now()}`,
    };
    setJadwalList((prev) => [...prev, newJdw]);
    FirebaseServices.jadwal.save(newJdw);
    showToast('Informasi Ditambahkan', j.judul);
  };

  const deleteJadwal = (id: string) => {
    setJadwalList((prev) => prev.filter((j) => j.id !== id));
    FirebaseServices.jadwal.delete(id);
    showToast('Item Dihapus', undefined, 'warning');
  };

  // CRUD Riwayat Randomisasi
  const addRiwayatRandomisasi = (r: RiwayatRandomisasi) => {
    setRiwayatRandomisasiList((prev) => [r, ...prev]);
    FirebaseServices.riwayatRandomisasi.save(r);
  };

  const deleteRiwayatRandomisasi = (id: string) => {
    setRiwayatRandomisasiList((prev) => prev.filter((r) => r.id !== id));
    FirebaseServices.riwayatRandomisasi.delete(id);
  };

  const resetToDefaultSeed = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMahasiswaList(INITIAL_MAHASISWA);
    setMataKuliahList(INITIAL_MATA_KULIAH);
    setKelompokList(INITIAL_KELOMPOK);
    setPembayaranKasList(INITIAL_PEMBAYARAN_KAS);
    setTransaksiKasList(INITIAL_TRANSAKSI_KAS);
    setPengumumanList(INITIAL_PENGUMUMAN);
    setJadwalList(INITIAL_JADWAL);
    setRiwayatRandomisasiList(INITIAL_RIWAYAT_RANDOMISASI);
    showToast('Data Direset ke Awal');
  };

  return (
    <AppContext.Provider
      value={{
        activeModule,
        setActiveModule,
        currentUser,
        isLoggedIn,
        isAdmin,
        lastSavedNim,
        isConnectedToFirebase: isFirebaseConfigured,
        findMahasiswaByNim,
        loginOrRegister,
        loginWithNim,
        createPasswordAndLogin,
        changeOwnPassword,
        unlockAdminWithKey,
        lockAdmin,
        logout,
        setCurrentUserById,
        switchRoleDemo,
        mahasiswaList,
        mataKuliahList,
        kelompokList,
        pembayaranKasList,
        transaksiKasList,
        pengumumanList,
        jadwalList,
        riwayatRandomisasiList,
        linkPentingList,
        addMahasiswa,
        updateMahasiswa,
        deleteMahasiswa,
        updateUserRole,
        addMataKuliah,
        updateMataKuliah,
        deleteMataKuliah,
        saveKelompok,
        deleteKelompok,
        applyRandomizerToMataKuliah,
        addTransaksiKas,
        updateTransaksiKas,
        deleteTransaksiKas,
        updatePembayaranKas,
        addPengumuman,
        deletePengumuman,
        addJadwal,
        deleteJadwal,
        addRiwayatRandomisasi,
        deleteRiwayatRandomisasi,
        resetToDefaultSeed,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp harus digunakan di dalam AppProvider');
  }
  return ctx;
}

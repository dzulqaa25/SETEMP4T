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
  getFakultasProdiFromNim,
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

const STORAGE_KEY = 'setemp4t_st04_db_v9';
const SESSION_KEY = 'setemp4t_device_auth_session_v2';
const ACCOUNTS_KEY = 'setemp4t_accounts_map_v2';
const ACCOUNTS_FIRESTORE_KEY = 'accounts_map_v2';

interface AppContextType {
  // Navigation & Auth
  activeModule: ActiveModuleId;
  setActiveModule: (mod: ActiveModuleId) => void;
  currentUser: Mahasiswa;
  isLoggedIn: boolean;
  isHydrated: boolean;
  isAdmin: boolean;
  isBendaharaAdmin: boolean;
  canEditMahasiswaProfile: boolean;
  lastSavedNim: string;
  isConnectedToFirebase: boolean;

  // Auth & Access Key Actions
  findMahasiswaByNim: (nimOrName: string) => Mahasiswa | undefined;
  isAccountLocked: (nimOrName: string) => boolean;
  syncAccountsFromCloud: () => Promise<Record<string, string>>;
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
  saveCourseKelompokBatch: (
    mataKuliahId: string,
    courseGroups: Kelompok[]
  ) => void;
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
  updatePengumuman: (p: Pengumuman) => void;
  deletePengumuman: (id: string) => void;
  addJadwal: (j: Omit<Jadwal, 'id'>) => void;
  updateJadwal: (j: Jadwal) => void;
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

  // Helper untuk membersihkan dummy password 'st04' yang sebelumnya tidak sengaja tersimpan
  const sanitizeAccountsMap = (
    rawMap?: Record<string, string> | null
  ): Record<string, string> => {
    const cleaned: Record<string, string> = {};
    if (!rawMap || typeof rawMap !== 'object') return cleaned;
    Object.entries(rawMap).forEach(([nimKey, passVal]) => {
      if (
        typeof passVal === 'string' &&
        passVal.trim().length > 0 &&
        passVal.trim() !== 'st04'
      ) {
        cleaned[nimKey.trim().toUpperCase()] = passVal.trim();
      }
    });
    return cleaned;
  };

  // Helper untuk membersihkan kelompok acak dummy bawaan lama (buildInitialKelompok) dari localStorage maupun Firestore
  const sanitizeKelompokList = (
    rawList?: Kelompok[] | null
  ): Kelompok[] => {
    if (!Array.isArray(rawList)) return [];
    const legacyIdPattern =
      /^klp-mk-(statistika|pi|bindo|biologi|sosiologi)-[1-7]$/;
    return rawList.filter(
      (k) =>
        k &&
        k.createdAt !== '2026-08-20T09:00:00.000Z' &&
        !legacyIdPattern.test(k.id)
    );
  };

  const syncAccountsFromCloud = useCallback(async (): Promise<
    Record<string, string>
  > => {
    if (!isFirebaseConfigured) return accountsMap;
    try {
      const [cloudV2, cloudV1] = await Promise.all([
        FirebaseServices.sharedState.get<Record<string, string>>(
          ACCOUNTS_FIRESTORE_KEY
        ),
        FirebaseServices.sharedState.get<Record<string, string>>('accounts_map'),
      ]);
      const mergedCloud = {
        ...sanitizeAccountsMap(cloudV1),
        ...sanitizeAccountsMap(cloudV2),
      };
      if (Object.keys(mergedCloud).length > 0) {
        setAccountsMap((prev) => {
          const next = { ...prev, ...mergedCloud };
          try {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
      return mergedCloud;
    } catch {
      return accountsMap;
    }
  }, [accountsMap]);

  // Load persisted data & auth session on mount
  useEffect(() => {
    try {
      // 1. Load Accounts Map (NIM -> Locked Password)
      const savedAccountsV2 = localStorage.getItem(ACCOUNTS_KEY);
      const savedAccountsV1 = localStorage.getItem('setemp4t_accounts_map_v1');
      let loadedAccounts: Record<string, string> = {};
      if (savedAccountsV1) {
        loadedAccounts = {
          ...loadedAccounts,
          ...sanitizeAccountsMap(JSON.parse(savedAccountsV1)),
        };
      }
      if (savedAccountsV2) {
        loadedAccounts = {
          ...loadedAccounts,
          ...sanitizeAccountsMap(JSON.parse(savedAccountsV2)),
        };
      }
      setAccountsMap(loadedAccounts);

      // 2. Load Database Entities
      const savedDbRaw = localStorage.getItem(STORAGE_KEY);
      if (savedDbRaw) {
        const parsed = JSON.parse(savedDbRaw);
        if (parsed.mahasiswaList?.length) {
          setMahasiswaList(
            [...parsed.mahasiswaList]
              .sort((a: Mahasiswa, b: Mahasiswa) => a.nim.localeCompare(b.nim))
              .map((m: Mahasiswa) => {
                const lockedPass =
                  loadedAccounts[m.nim.toUpperCase()] ||
                  (m.password && m.password !== 'st04'
                    ? m.password
                    : undefined);
                return {
                  ...m,
                  password: lockedPass,
                };
              })
          );
        }
        if (parsed.mataKuliahList?.length)
          setMataKuliahList(parsed.mataKuliahList);
        if (Array.isArray(parsed.kelompokList))
          setKelompokList(sanitizeKelompokList(parsed.kelompokList));
        if (Array.isArray(parsed.pembayaranKasList))
          setPembayaranKasList(parsed.pembayaranKasList);
        if (Array.isArray(parsed.transaksiKasList))
          setTransaksiKasList(parsed.transaksiKasList);
        if (Array.isArray(parsed.pengumumanList))
          setPengumumanList(parsed.pengumumanList);
        if (Array.isArray(parsed.jadwalList))
          setJadwalList(parsed.jadwalList);
        if (Array.isArray(parsed.riwayatRandomisasiList))
          setRiwayatRandomisasiList(parsed.riwayatRandomisasiList);
      } else {
        setMahasiswaList((prev) =>
          prev.map((m) => ({
            ...m,
            password: loadedAccounts[m.nim.toUpperCase()] || undefined,
          }))
        );
      }

      // 3. Load Persistent Auth Session ("Remember Login" KHUSUS DEVICE INI SAJA)
      const savedSessionRaw = localStorage.getItem(SESSION_KEY);
      if (savedSessionRaw) {
        const session = JSON.parse(savedSessionRaw);
        if (session.currentUserId) setCurrentUserId(session.currentUserId);
        if (session.lastNim) setLastSavedNim(session.lastNim);
        if (typeof session.isLoggedIn === 'boolean')
          setIsLoggedIn(session.isLoggedIn);
        if (typeof session.isAdminUnlocked === 'boolean')
          setIsAdminUnlocked(session.isAdminUnlocked);
      } else {
        // Device baru wajib login ke akun masing-masing
        setIsLoggedIn(false);
        setLastSavedNim('');
        setIsAdminUnlocked(false);
      }

      // 4. Sinkronisasi Cloud Firestore (Project: setemp4t63)
      if (isFirebaseConfigured) {
        Promise.all([
          FirebaseServices.sharedState.get<{ items: Pengumuman[] }>(
            'pengumuman_state'
          ),
          FirebaseServices.sharedState.get<{ items: Jadwal[] }>('jadwal_state'),
          FirebaseServices.sharedState.get<{ items: TransaksiKas[] }>(
            'transaksi_state_v2'
          ),
          FirebaseServices.sharedState.get<{ items: Kelompok[] }>(
            'kelompok_state_v2'
          ),
          FirebaseServices.sharedState.get<Kelompok[]>('kelompok_list'),
          FirebaseServices.sharedState.get<{ items: Mahasiswa[] }>(
            'mahasiswa_state_v2'
          ),
          FirebaseServices.sharedState.get<{ items: MataKuliah[] }>(
            'matakuliah_state_v2'
          ),
          FirebaseServices.sharedState.get<Record<string, string>>(
            ACCOUNTS_FIRESTORE_KEY
          ),
          FirebaseServices.sharedState.get<Record<string, string>>(
            'accounts_map'
          ),
        ])
          .then(
            ([
              cloudPengState,
              cloudJdwState,
              cloudTrxState,
              cloudKlpStateV2,
              cloudKlpShared,
              cloudMhsState,
              cloudMkState,
              cloudAccountsV2,
              cloudAccountsV1,
            ]) => {
              if (cloudPengState && Array.isArray(cloudPengState.items)) {
                setPengumumanList(cloudPengState.items);
              }
              if (cloudJdwState && Array.isArray(cloudJdwState.items)) {
                setJadwalList(cloudJdwState.items);
              }
              if (cloudTrxState && Array.isArray(cloudTrxState.items)) {
                setTransaksiKasList(cloudTrxState.items);
              }
              if (
                cloudMhsState &&
                Array.isArray(cloudMhsState.items) &&
                cloudMhsState.items.length > 0
              ) {
                setMahasiswaList(
                  [...cloudMhsState.items].sort((a, b) =>
                    a.nim.localeCompare(b.nim)
                  )
                );
              }
              if (
                cloudMkState &&
                Array.isArray(cloudMkState.items) &&
                cloudMkState.items.length > 0
              ) {
                setMataKuliahList(cloudMkState.items);
              }
              if (cloudKlpStateV2 && Array.isArray(cloudKlpStateV2.items)) {
                setKelompokList(sanitizeKelompokList(cloudKlpStateV2.items));
              } else if (Array.isArray(cloudKlpShared)) {
                const cleanedKlp = sanitizeKelompokList(cloudKlpShared);
                setKelompokList(cleanedKlp);
                // Migrasi otomatis ke kelompok_state_v2 tanpa dummy kelompok bawaan
                FirebaseServices.sharedState.set('kelompok_state_v2', {
                  items: cleanedKlp,
                });
                FirebaseServices.sharedState.set('kelompok_list', cleanedKlp);
              } else {
                // Jika belum ada dokumen kelompok_state_v2 di server, bersihkan dummy dan simpan [] ke server
                setKelompokList([]);
                FirebaseServices.sharedState.set('kelompok_state_v2', {
                  items: [],
                });
                FirebaseServices.sharedState.set('kelompok_list', []);
              }
              const mergedCloudAccounts = {
                ...sanitizeAccountsMap(cloudAccountsV1),
                ...sanitizeAccountsMap(cloudAccountsV2),
              };
              if (Object.keys(mergedCloudAccounts).length > 0) {
                setAccountsMap((prev) => {
                  const next = { ...prev, ...mergedCloudAccounts };
                  try {
                    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
                  } catch {}
                  return next;
                });
              }
            }
          )
          .catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to parse local storage state:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Langganan Real-time (onSnapshot) ke Cloud Firestore untuk Seluruh Data Kelas
  useEffect(() => {
    if (!isHydrated || !isFirebaseConfigured) return;

    const unsubPengumuman = FirebaseServices.sharedState.subscribe<{
      items: Pengumuman[];
    }>('pengumuman_state', (data) => {
      if (data && Array.isArray(data.items)) {
        setPengumumanList(data.items);
      }
    });

    const unsubJadwal = FirebaseServices.sharedState.subscribe<{
      items: Jadwal[];
    }>('jadwal_state', (data) => {
      if (data && Array.isArray(data.items)) {
        setJadwalList(data.items);
      }
    });

    const unsubTransaksi = FirebaseServices.sharedState.subscribe<{
      items: TransaksiKas[];
    }>('transaksi_state_v2', (data) => {
      if (data && Array.isArray(data.items)) {
        setTransaksiKasList(data.items);
      }
    });

    const unsubKelompokV2 = FirebaseServices.sharedState.subscribe<{
      items: Kelompok[];
    }>('kelompok_state_v2', (data) => {
      if (data && Array.isArray(data.items)) {
        setKelompokList(sanitizeKelompokList(data.items));
      }
    });

    const unsubMahasiswa = FirebaseServices.sharedState.subscribe<{
      items: Mahasiswa[];
    }>('mahasiswa_state_v2', (data) => {
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setMahasiswaList(
          [...data.items].sort((a, b) => a.nim.localeCompare(b.nim))
        );
      }
    });

    const unsubMataKuliah = FirebaseServices.sharedState.subscribe<{
      items: MataKuliah[];
    }>('matakuliah_state_v2', (data) => {
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setMataKuliahList(data.items);
      }
    });

    const unsubAccounts = FirebaseServices.sharedState.subscribe<
      Record<string, string>
    >(ACCOUNTS_FIRESTORE_KEY, (data) => {
      const cleaned = sanitizeAccountsMap(data);
      if (Object.keys(cleaned).length > 0) {
        setAccountsMap((prev) => {
          const next = { ...prev, ...cleaned };
          try {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    });

    return () => {
      unsubPengumuman();
      unsubJadwal();
      unsubTransaksi();
      unsubKelompokV2();
      unsubMahasiswa();
      unsubMataKuliah();
      unsubAccounts();
    };
  }, [isHydrated]);

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

  // Persist Auth Session & Remember Me KHUSUS di localStorage device masing-masing
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

  // Simpan & Kunci Password untuk NIM ke localStorage + Cloud Firestore (tanpa menimpa akun lain)
  const saveAccountPassword = (nim: string, pass: string) => {
    const cleanNim = nim.trim().toUpperCase();
    const cleanPass = pass.trim();
    if (!cleanNim || !cleanPass) return;

    setAccountsMap((prev) => {
      const next = { ...prev, [cleanNim]: cleanPass };
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save account password:', e);
      }

      // Ambil map terbaru dari Cloud sebelum menyimpan agar tidak menimpa password akun mahasiswa lain
      if (isFirebaseConfigured) {
        FirebaseServices.sharedState
          .get<Record<string, string>>(ACCOUNTS_FIRESTORE_KEY)
          .then((cloudExisting) => {
            const merged = {
              ...sanitizeAccountsMap(cloudExisting),
              ...next,
              [cleanNim]: cleanPass,
            };
            FirebaseServices.sharedState.set(ACCOUNTS_FIRESTORE_KEY, merged);
            FirebaseServices.sharedState.set('accounts_map', merged);
          })
          .catch(() => {
            FirebaseServices.sharedState.set(ACCOUNTS_FIRESTORE_KEY, next);
          });
      }
      return next;
    });
  };

  const currentUser =
    mahasiswaList.find((m) => m.id === currentUserId) || mahasiswaList[0];

  const isAdmin = isAdminUnlocked;

  // Bendahara (Putri Oktania - C3401261024 / role bendahara) DAN kondisi khusus Moch Dzulqarnain Serdy (A2401261152) memiliki akses penuh pengelolaan kas
  const isBendaharaAdmin =
    isAdminUnlocked &&
    (currentUser.role === 'bendahara' ||
      currentUser.nim.toUpperCase() === 'C3401261024' ||
      currentUser.nim.toUpperCase() === 'A2401261152' ||
      currentUser.namaLengkap
        .toLowerCase()
        .includes('moch dzulqarnain serdy'));

  // Hanya Moch Dzulqarnain Serdy (A2401261152) yang sudah membuka akses Admin yang boleh mengedit profil mahasiswa
  const canEditMahasiswaProfile =
    isAdminUnlocked &&
    (currentUser.nim.toUpperCase() === 'A2401261152' ||
      currentUser.namaLengkap
        .toLowerCase()
        .includes('moch dzulqarnain serdy'));

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

  // Cek apakah suatu NIM sudah memiliki password yang terkunci
  const getLockedPasswordForNim = useCallback(
    (nim: string): string | undefined => {
      const clean = nim.trim().toUpperCase();
      if (!clean) return undefined;
      if (accountsMap[clean] && accountsMap[clean] !== 'st04') {
        return accountsMap[clean];
      }
      const mhs = mahasiswaList.find((m) => m.nim.toUpperCase() === clean);
      if (mhs?.password && mhs.password !== 'st04') {
        return mhs.password;
      }
      return undefined;
    },
    [accountsMap, mahasiswaList]
  );

  const isAccountLocked = useCallback(
    (nimOrName: string): boolean => {
      const target = findMahasiswaByNim(nimOrName);
      const nimKey = target ? target.nim : nimOrName.trim().toUpperCase();
      return Boolean(getLockedPasswordForNim(nimKey));
    },
    [findMahasiswaByNim, getLockedPasswordForNim]
  );

  // Fungsi Login & Penguncian Password per Akun:
  // - Jika akun (NIM) SUDAH memiliki password -> WAJIB cocok dengan password yang terkunci (tidak bisa ditimpa)
  // - Jika akun (NIM) BELUM memiliki password -> Buat password baru & langsung kunci password tersebut untuk NIM itu
  const loginOrRegister = (
    nimInput: string,
    passwordInput: string
  ): boolean => {
    const cleanNim = nimInput.trim().toUpperCase();
    const cleanPass = passwordInput.trim();

    if (!cleanNim) {
      showToast(
        'Masukkan NIM',
        'Silakan ketik NIM atau pilih nama Anda terlebih dahulu.',
        'warning'
      );
      return false;
    }

    let target = findMahasiswaByNim(cleanNim);

    // Jika input berupa potongan nama, cari yang cocok
    if (!target) {
      target = mahasiswaList.find(
        (m) =>
          m.namaLengkap.toUpperCase().includes(cleanNim) ||
          m.namaPanggilan.toUpperCase().includes(cleanNim) ||
          m.nim.toUpperCase().includes(cleanNim)
      );
    }

    if (!target) {
      showToast(
        'NIM Tidak Ditemukan',
        'Pastikan NIM yang Anda masukkan terdaftar di kelas ST04.',
        'warning'
      );
      return false;
    }

    const lockedPassword = getLockedPasswordForNim(target.nim);

    // KASUS 1: Akun sudah memiliki password yang terkunci
    if (lockedPassword) {
      if (!cleanPass) {
        showToast(
          'Password Diperlukan',
          `Akun ${target.namaLengkap} (${target.nim}) sudah dikunci. Masukkan password akun Anda.`,
          'warning'
        );
        return false;
      }
      if (cleanPass !== lockedPassword) {
        showToast(
          'Password Salah!',
          `Username (${target.nim}) sudah dikunci dengan password pemiliknya. Password yang Anda masukkan salah.`,
          'warning'
        );
        return false;
      }

      // Password cocok -> Login berhasil & ingat sesi di device ini saja
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
      showToast(`Selamat datang kembali, ${target.namaPanggilan}!`);
      return true;
    }

    // KASUS 2: Akun belum memiliki password (Login Pertama -> Kunci Password Baru)
    if (!cleanPass || cleanPass.length < 4) {
      showToast(
        'Buat Password Akun',
        'Masukkan password minimal 4 karakter untuk mengunci akun NIM Anda.',
        'warning'
      );
      return false;
    }

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
    showToast(
      `Akun Dikunci & Berhasil Masuk!`,
      `Password untuk ${target.namaLengkap} (${target.nim}) kini telah dikunci.`
    );
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

  // CRUD Mahasiswa (Hanya Moch Dzulqarnain Serdy - A2401261152)
  const addMahasiswa = (
    m: Omit<Mahasiswa, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!canEditMahasiswaProfile) {
      showToast(
        'Akses Ditolak',
        'Hanya Moch Dzulqarnain Serdy (A2401261152) yang dapat mengelola data profil mahasiswa.',
        'warning'
      );
      return;
    }
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
    setMahasiswaList((prev) => {
      const next = [...prev, newMahasiswa].sort((a, b) =>
        a.nim.localeCompare(b.nim)
      );
      FirebaseServices.sharedState.set('mahasiswa_state_v2', { items: next });
      return next;
    });
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
    if (!canEditMahasiswaProfile) {
      showToast(
        'Akses Ditolak',
        'Hanya Moch Dzulqarnain Serdy (A2401261152) yang dapat mengedit profil mahasiswa.',
        'warning'
      );
      return;
    }
    const withTime = { ...updated, updatedAt: new Date().toISOString() };
    setMahasiswaList((prev) => {
      const next = prev.map((m) => (m.id === updated.id ? withTime : m));
      FirebaseServices.sharedState.set('mahasiswa_state_v2', { items: next });
      return next;
    });
    FirebaseServices.mahasiswa.save(withTime);
    showToast('Profil Disimpan');
  };

  const deleteMahasiswa = (id: string) => {
    if (!canEditMahasiswaProfile) {
      showToast(
        'Akses Ditolak',
        'Hanya Moch Dzulqarnain Serdy (A2401261152) yang dapat menghapus profil mahasiswa.',
        'warning'
      );
      return;
    }
    setMahasiswaList((prev) => {
      const next = prev.filter((m) => m.id !== id);
      FirebaseServices.sharedState.set('mahasiswa_state_v2', { items: next });
      return next;
    });
    setPembayaranKasList((prev) => prev.filter((p) => p.mahasiswaId !== id));
    FirebaseServices.mahasiswa.delete(id);
    showToast('Mahasiswa Dihapus', undefined, 'warning');
  };

  const updateUserRole = (id: string, role: UserRole) => {
    if (!canEditMahasiswaProfile) {
      showToast(
        'Akses Ditolak',
        'Hanya Moch Dzulqarnain Serdy (A2401261152) yang dapat mengubah profil & jabatan mahasiswa.',
        'warning'
      );
      return;
    }
    const target = mahasiswaList.find((m) => m.id === id);
    if (!target) return;
    const updated = {
      ...target,
      role,
      updatedAt: new Date().toISOString(),
    };
    setMahasiswaList((prev) => {
      const next = prev.map((m) => (m.id === id ? updated : m));
      FirebaseServices.sharedState.set('mahasiswa_state_v2', { items: next });
      return next;
    });
    FirebaseServices.mahasiswa.save(updated);
    showToast('Jabatan Diperbarui', `${target.namaPanggilan} -> ${role.toUpperCase()}`);
  };

  // CRUD Mata Kuliah (Khusus Admin)
  const addMataKuliah = (mk: Omit<MataKuliah, 'id'>) => {
    if (!isAdmin) return;
    const newMk: MataKuliah = {
      ...mk,
      id: `mk-${mk.kode.toLowerCase()}-${Date.now().toString().slice(-3)}`,
    };
    setMataKuliahList((prev) => {
      const next = [...prev, newMk];
      FirebaseServices.sharedState.set('matakuliah_state_v2', { items: next });
      return next;
    });
    FirebaseServices.mataKuliah.save(newMk);
    showToast('Mata Kuliah Ditambahkan', mk.nama);
  };

  const updateMataKuliah = (mk: MataKuliah) => {
    if (!isAdmin) return;
    setMataKuliahList((prev) => {
      const next = prev.map((item) => (item.id === mk.id ? mk : item));
      FirebaseServices.sharedState.set('matakuliah_state_v2', { items: next });
      return next;
    });
    FirebaseServices.mataKuliah.save(mk);
    showToast('Mata Kuliah Diperbarui');
  };

  const deleteMataKuliah = (id: string) => {
    if (!isAdmin) return;
    setMataKuliahList((prev) => {
      const next = prev.filter((m) => m.id !== id);
      FirebaseServices.sharedState.set('matakuliah_state_v2', { items: next });
      return next;
    });
    setKelompokList((prev) => {
      const next = prev.filter((k) => k.mataKuliahId !== id);
      FirebaseServices.sharedState.set('kelompok_state_v2', { items: next });
      return next;
    });
    FirebaseServices.mataKuliah.delete(id);
    showToast('Mata Kuliah Dihapus', undefined, 'warning');
  };

  // CRUD Kelompok (Khusus Admin)
  const saveKelompok = (k: Kelompok) => {
    if (!isAdmin) {
      showToast(
        'Akses Admin Diperlukan',
        'Hanya Admin yang dapat mengedit atau menambah kelompok.',
        'warning'
      );
      return;
    }
    setKelompokList((prev) => {
      const cleanedPrev = sanitizeKelompokList(prev);
      const exists = cleanedPrev.some((item) => item.id === k.id);
      const next = exists
        ? cleanedPrev.map((item) => (item.id === k.id ? k : item))
        : [...cleanedPrev, k];
      FirebaseServices.sharedState.set('kelompok_state_v2', { items: next });
      FirebaseServices.sharedState.set('kelompok_list', next);
      return next;
    });
    FirebaseServices.kelompok.save(k);
    showToast('Kelompok Disimpan', k.namaKelompok);
  };

  const deleteKelompok = (id: string) => {
    if (!isAdmin) {
      showToast(
        'Akses Admin Diperlukan',
        'Hanya Admin yang dapat menghapus kelompok.',
        'warning'
      );
      return;
    }
    setKelompokList((prev) => {
      const next = sanitizeKelompokList(prev).filter((k) => k.id !== id);
      FirebaseServices.sharedState.set('kelompok_state_v2', { items: next });
      FirebaseServices.sharedState.set('kelompok_list', next);
      return next;
    });
    FirebaseServices.kelompok.delete(id);
    showToast('Kelompok Dihapus', undefined, 'warning');
  };

  const saveCourseKelompokBatch = (
    mataKuliahId: string,
    courseGroups: Kelompok[]
  ) => {
    if (!isAdmin) {
      showToast(
        'Akses Admin Diperlukan',
        'Hanya Admin yang dapat menyimpan perubahan kelompok.',
        'warning'
      );
      return;
    }
    const mk = mataKuliahList.find((m) => m.id === mataKuliahId);
    setKelompokList((prev) => {
      const cleanedPrev = sanitizeKelompokList(prev);
      const removedOld = cleanedPrev.filter(
        (k) => k.mataKuliahId === mataKuliahId
      );
      const nextIds = new Set(courseGroups.map((g) => g.id));
      removedOld.forEach((old) => {
        if (!nextIds.has(old.id)) {
          FirebaseServices.kelompok.delete(old.id);
        }
      });
      const next = [
        ...cleanedPrev.filter((k) => k.mataKuliahId !== mataKuliahId),
        ...courseGroups,
      ];
      FirebaseServices.sharedState.set('kelompok_state_v2', { items: next });
      FirebaseServices.sharedState.set('kelompok_list', next);
      return next;
    });
    courseGroups.forEach((g) => FirebaseServices.kelompok.save(g));
    showToast(
      'Perubahan Kelompok Disimpan ke Server',
      `${courseGroups.length} kelompok pada ${mk?.nama || 'Mata Kuliah'} telah disimpan.`
    );
  };

  const applyRandomizerToMataKuliah = (
    mataKuliahId: string,
    jenis: 'Praktikum' | 'Tugas',
    riwayat: RiwayatRandomisasi
  ) => {
    if (!isAdmin) return;
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

    setKelompokList((prev) => {
      const cleanedPrev = sanitizeKelompokList(prev);
      const next = [
        ...cleanedPrev.filter((k) => k.mataKuliahId !== mataKuliahId),
        ...newGroups,
      ];
      FirebaseServices.sharedState.set('kelompok_state_v2', { items: next });
      FirebaseServices.sharedState.set('kelompok_list', next);
      return next;
    });
    newGroups.forEach((g) => FirebaseServices.kelompok.save(g));
    showToast(
      'Kelompok Diterapkan',
      `${newGroups.length} kelompok disimpan ke ${mk?.nama || 'Mata Kuliah'}.`
    );
  };

  // CRUD Kas Kelas & Iuran (Khusus Bendahara Putri Oktania C3401261024 & Moch Dzulqarnain Serdy A2401261152)
  const addTransaksiKas = (t: Omit<TransaksiKas, 'id' | 'createdAt'>) => {
    if (!isBendaharaAdmin) {
      showToast(
        'Khusus Akses Bendahara',
        'Hanya Bendahara (Putri Oktania) dan Moch Dzulqarnain Serdy yang dapat mengelola data uang kas.',
        'warning'
      );
      return;
    }
    const newTrx: TransaksiKas = {
      ...t,
      id: `trx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTransaksiKasList((prev) => {
      const next = [newTrx, ...prev];
      FirebaseServices.sharedState.set('transaksi_state_v2', { items: next });
      return next;
    });
    FirebaseServices.transaksiKas.save(newTrx);
    showToast('Transaksi Dicatat', t.judul);
  };

  const updateTransaksiKas = (t: TransaksiKas) => {
    if (!isBendaharaAdmin) return;
    setTransaksiKasList((prev) => {
      const next = prev.map((item) => (item.id === t.id ? t : item));
      FirebaseServices.sharedState.set('transaksi_state_v2', { items: next });
      return next;
    });
    FirebaseServices.transaksiKas.save(t);
    showToast('Transaksi Diperbarui');
  };

  const deleteTransaksiKas = (id: string) => {
    if (!isBendaharaAdmin) {
      showToast(
        'Khusus Akses Bendahara',
        'Hanya Bendahara (Putri Oktania) dan Moch Dzulqarnain Serdy yang dapat menghapus transaksi kas.',
        'warning'
      );
      return;
    }
    setTransaksiKasList((prev) => {
      const next = prev.filter((t) => t.id !== id);
      FirebaseServices.sharedState.set('transaksi_state_v2', { items: next });
      return next;
    });
    FirebaseServices.transaksiKas.delete(id);
    showToast('Transaksi Dihapus', undefined, 'warning');
  };

  const updatePembayaranKas = (p: PembayaranKas) => {
    if (!isBendaharaAdmin) return;
    setPembayaranKasList((prev) =>
      prev.map((item) => (item.id === p.id ? p : item))
    );
    FirebaseServices.pembayaranKas.save(p);
    showToast('Status Kas Diperbarui', p.status);
  };

  // CRUD Pengumuman & Jadwal (Khusus Admin)
  const addPengumuman = (p: Omit<Pengumuman, 'id'>) => {
    if (!isAdmin) return;
    const newPeng: Pengumuman = {
      ...p,
      id: `peng-${Date.now()}`,
    };
    setPengumumanList((prev) => {
      const next = [newPeng, ...prev];
      FirebaseServices.sharedState.set('pengumuman_state', { items: next });
      return next;
    });
    FirebaseServices.pengumuman.save(newPeng);
    showToast('Pengumuman Ditambahkan', p.judul);
  };

  const updatePengumuman = (p: Pengumuman) => {
    if (!isAdmin) return;
    setPengumumanList((prev) => {
      const next = prev.map((item) => (item.id === p.id ? p : item));
      FirebaseServices.sharedState.set('pengumuman_state', { items: next });
      return next;
    });
    FirebaseServices.pengumuman.save(p);
    showToast('Pengumuman Diperbarui', p.judul);
  };

  const deletePengumuman = (id: string) => {
    if (!isAdmin) return;
    setPengumumanList((prev) => {
      const next = prev.filter((p) => p.id !== id);
      FirebaseServices.sharedState.set('pengumuman_state', { items: next });
      return next;
    });
    FirebaseServices.pengumuman.delete(id);
    showToast('Pengumuman Dihapus Permanen', undefined, 'warning');
  };

  const addJadwal = (j: Omit<Jadwal, 'id'>) => {
    if (!isAdmin) return;
    const newJdw: Jadwal = {
      ...j,
      id: `jdw-${Date.now()}`,
    };
    setJadwalList((prev) => {
      const next = [...prev, newJdw];
      FirebaseServices.sharedState.set('jadwal_state', { items: next });
      return next;
    });
    FirebaseServices.jadwal.save(newJdw);
    showToast('Informasi Ditambahkan', j.judul);
  };

  const updateJadwal = (j: Jadwal) => {
    if (!isAdmin) return;
    setJadwalList((prev) => {
      const next = prev.map((item) => (item.id === j.id ? j : item));
      FirebaseServices.sharedState.set('jadwal_state', { items: next });
      return next;
    });
    FirebaseServices.jadwal.save(j);
    showToast('Tugas / Jadwal Diperbarui', j.judul);
  };

  const deleteJadwal = (id: string) => {
    if (!isAdmin) return;
    setJadwalList((prev) => {
      const next = prev.filter((j) => j.id !== id);
      FirebaseServices.sharedState.set('jadwal_state', { items: next });
      return next;
    });
    FirebaseServices.jadwal.delete(id);
    showToast('Item Dihapus Permanen', undefined, 'warning');
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
        isHydrated,
        isAdmin,
        isBendaharaAdmin,
        canEditMahasiswaProfile,
        lastSavedNim,
        isConnectedToFirebase: isFirebaseConfigured,
        findMahasiswaByNim,
        isAccountLocked,
        syncAccountsFromCloud,
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
        saveCourseKelompokBatch,
        applyRandomizerToMataKuliah,
        addTransaksiKas,
        updateTransaksiKas,
        deleteTransaksiKas,
        updatePembayaranKas,
        addPengumuman,
        updatePengumuman,
        deletePengumuman,
        addJadwal,
        updateJadwal,
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

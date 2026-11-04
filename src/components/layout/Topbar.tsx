'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { AvatarInitials, Badge, Button } from '@/components/ui';
import { formatRupiah } from '@/lib/utils';
import { FirebaseServices } from '@/lib/firebase/services';
import {
  DeviceNotifPermission,
  getDeviceNotificationPermission,
  registerNotificationServiceWorker,
  requestDeviceNotificationPermission,
  sendDeviceNotification,
} from '@/lib/notifications';
import {
  BulanKey,
  DEFAULT_KAS_PERIODE_CONFIG,
  KAS_CHECKBOX_STORAGE_KEY,
  KAS_FIRESTORE_KEY,
  KAS_PERIODE_FIRESTORE_KEY,
  KAS_PERIODE_STORAGE_KEY,
  KAS_REMINDER_BROADCAST_KEY,
  KasPeriodeConfig,
  KasReminderBroadcastPayload,
  buildInitialCheckedMapForStudents,
  getNominalForBulanItem,
} from '@/components/modules/KasKelasModule';
import {
  Menu,
  ShieldCheck,
  Bell,
  BellRing,
  Megaphone,
  CalendarClock,
  Wallet,
  CheckCheck,
  X,
} from 'lucide-react';

const SEEN_DEVICE_NOTIF_KEY = 'setemp4t_seen_device_notifs_v1';
const READ_NOTIF_CENTER_KEY = 'setemp4t_read_notif_center_v1';
const BANNER_DISMISSED_KEY = 'setemp4t_notif_banner_dismissed_v1';

const SEED_ANNOUNCEMENT_IDS = ['peng-001', 'peng-002', 'peng-003'];
const SEED_JADWAL_IDS = ['jdw-001', 'jdw-002', 'jdw-003', 'jdw-004', 'jdw-005'];

interface NotificationCenterItem {
  id: string;
  category: 'kas' | 'pengumuman' | 'tugas';
  title: string;
  subtitle: string;
  dateLabel: string;
  targetModule: 'dashboard' | 'kas-kelas';
}

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const {
    currentUser,
    mahasiswaList,
    pengumumanList,
    jadwalList,
    isAdmin,
    setActiveModule,
    showToast,
  } = useApp();

  const [openDropdown, setOpenDropdown] = useState(false);
  const [notifPermission, setNotifPermission] =
    useState<DeviceNotifPermission>('default');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});

  // Data kas mahasiswa untuk mengecek pengingat kas
  const [checkedMap, setCheckedMap] = useState<
    Record<string, Record<BulanKey, boolean>>
  >({});
  const [periodeConfig, setPeriodeConfig] = useState<KasPeriodeConfig>(
    DEFAULT_KAS_PERIODE_CONFIG
  );
  const [latestKasBroadcast, setLatestKasBroadcast] =
    useState<KasReminderBroadcastPayload | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inisialisasi Service Worker, Izin Notifikasi, dan Daftar Notifikasi yang Sudah Dibaca
  useEffect(() => {
    registerNotificationServiceWorker();
    setNotifPermission(getDeviceNotificationPermission());

    try {
      const savedBanner = sessionStorage.getItem(BANNER_DISMISSED_KEY);
      if (savedBanner === '1') setBannerDismissed(true);

      const savedRead = localStorage.getItem(READ_NOTIF_CENTER_KEY);
      if (savedRead) {
        setReadIds(JSON.parse(savedRead));
      }

      // Pastikan ID seed awal tercatat agar tidak memicu pop-up berulang untuk data bawaan lama
      const savedSeenRaw = localStorage.getItem(SEEN_DEVICE_NOTIF_KEY);
      if (!savedSeenRaw) {
        const initialSeen: Record<string, boolean> = {};
        SEED_ANNOUNCEMENT_IDS.forEach((id) => {
          initialSeen[`peng-${id}`] = true;
        });
        SEED_JADWAL_IDS.forEach((id) => {
          initialSeen[`jdw-${id}`] = true;
        });
        localStorage.setItem(
          SEEN_DEVICE_NOTIF_KEY,
          JSON.stringify(initialSeen)
        );
      }
    } catch {}
  }, []);

  // Muat & berlangganan status Kas serta Broadcast Pengingat Kas dari localStorage & Firestore
  useEffect(() => {
    const baseInitial = buildInitialCheckedMapForStudents(mahasiswaList);
    setCheckedMap(baseInitial);

    try {
      const savedKas = localStorage.getItem(KAS_CHECKBOX_STORAGE_KEY);
      if (savedKas) {
        const parsed = JSON.parse(savedKas);
        if (parsed && typeof parsed === 'object') {
          setCheckedMap({ ...baseInitial, ...parsed });
        }
      }
      const savedPeriode = localStorage.getItem(KAS_PERIODE_STORAGE_KEY);
      if (savedPeriode) {
        const parsedP = JSON.parse(savedPeriode);
        if (parsedP && Array.isArray(parsedP.daftarBulan)) {
          setPeriodeConfig(parsedP);
        }
      }
      const savedBroadcast = localStorage.getItem(KAS_REMINDER_BROADCAST_KEY);
      if (savedBroadcast) {
        setLatestKasBroadcast(JSON.parse(savedBroadcast));
      }
    } catch {}

    const unsubKas = FirebaseServices.sharedState.subscribe<
      Record<string, Record<BulanKey, boolean>>
    >(KAS_FIRESTORE_KEY, (cloudKas) => {
      if (cloudKas && typeof cloudKas === 'object') {
        setCheckedMap((prev) => ({ ...baseInitial, ...prev, ...cloudKas }));
      }
    });

    const unsubPeriode =
      FirebaseServices.sharedState.subscribe<KasPeriodeConfig>(
        KAS_PERIODE_FIRESTORE_KEY,
        (cloudPeriode) => {
          if (cloudPeriode && Array.isArray(cloudPeriode.daftarBulan)) {
            setPeriodeConfig(cloudPeriode);
          }
        }
      );

    const unsubBroadcast =
      FirebaseServices.sharedState.subscribe<KasReminderBroadcastPayload>(
        KAS_REMINDER_BROADCAST_KEY,
        (broadcast) => {
          if (broadcast && broadcast.id) {
            setLatestKasBroadcast(broadcast);
          }
        }
      );

    const handleLocalBroadcast = () => {
      try {
        const raw = localStorage.getItem(KAS_REMINDER_BROADCAST_KEY);
        if (raw) setLatestKasBroadcast(JSON.parse(raw));
      } catch {}
    };
    window.addEventListener('setemp4t-kas-reminder', handleLocalBroadcast);

    return () => {
      unsubKas();
      unsubPeriode();
      unsubBroadcast();
      window.removeEventListener('setemp4t-kas-reminder', handleLocalBroadcast);
    };
  }, [mahasiswaList]);

  // Cek apakah mahasiswa yang sedang login memiliki tunggakan kas pada bulan aktif
  const activeBulanObj = useMemo(() => {
    return (
      periodeConfig.daftarBulan.find(
        (b) => b.key === periodeConfig.activeBulanKey
      ) ||
      periodeConfig.daftarBulan[1] ||
      periodeConfig.daftarBulan[0]
    );
  }, [periodeConfig]);

  const activeBulanNominal = useMemo(() => {
    if (!activeBulanObj) return periodeConfig.nominalPerPeriode;
    return getNominalForBulanItem(
      activeBulanObj,
      periodeConfig.nominalPerPeriode
    );
  }, [activeBulanObj, periodeConfig.nominalPerPeriode]);

  const isCurrentUserPaidActiveMonth = useMemo(() => {
    if (!activeBulanObj) return true;
    const myRow = checkedMap[currentUser.id] || {};
    return Boolean(myRow[activeBulanObj.key]);
  }, [checkedMap, currentUser.id, activeBulanObj]);

  // Helper untuk menandai notifikasi device sudah pernah dikirim di perangkat ini
  const hasDeviceSeen = (key: string): boolean => {
    try {
      const raw = localStorage.getItem(SEEN_DEVICE_NOTIF_KEY);
      const map = raw ? JSON.parse(raw) : {};
      return Boolean(map[key]);
    } catch {
      return false;
    }
  };

  const markDeviceSeen = (key: string) => {
    try {
      const raw = localStorage.getItem(SEEN_DEVICE_NOTIF_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[key] = true;
      localStorage.setItem(SEEN_DEVICE_NOTIF_KEY, JSON.stringify(map));
    } catch {}
  };

  // 1. Deteksi & Kirim Notifikasi Device untuk PENGUMUMAN BARU
  useEffect(() => {
    if (!pengumumanList.length) return;
    pengumumanList.forEach((p) => {
      const key = `peng-${p.id}`;
      if (!hasDeviceSeen(key)) {
        markDeviceSeen(key);
        sendDeviceNotification({
          title: `📢 Pengumuman Kelas ST04: ${p.judul}`,
          body: p.isi,
          tag: key,
          url: '/',
        });
        showToast('📢 Pengumuman Baru', p.judul, 'info');
      }
    });
  }, [pengumumanList, showToast]);

  // 2. Deteksi & Kirim Notifikasi Device untuk TUGAS BARU
  useEffect(() => {
    if (!jadwalList.length) return;
    jadwalList.forEach((j) => {
      const key = `jdw-${j.id}`;
      if (!hasDeviceSeen(key)) {
        markDeviceSeen(key);
        sendDeviceNotification({
          title: `📝 Tugas Baru ST04: ${j.judul}`,
          body: `${j.tanggal} (${j.waktuMulai}) — ${j.deskripsi || j.lokasi}`,
          tag: key,
          url: '/',
        });
        showToast('📝 Tugas Baru', j.judul, 'info');
      }
    });
  }, [jadwalList, showToast]);

  // 3. Deteksi & Kirim Notifikasi Device untuk PENGINGAT KAS (Harian & Saat Broadcast Bendahara)
  useEffect(() => {
    if (isCurrentUserPaidActiveMonth || !activeBulanObj) return;

    // A. Pengingat Harian Otomatis untuk mahasiswa yang belum lunas bulan aktif
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyKey = `kas-daily-${currentUser.nim}-${activeBulanObj.key}-${todayStr}`;
    if (!hasDeviceSeen(dailyKey) && notifPermission === 'granted') {
      markDeviceSeen(dailyKey);
      sendDeviceNotification({
        title: `💰 Pengingat Kas Kelas ST04 (${activeBulanObj.fullLabel})`,
        body: `Halo ${currentUser.namaPanggilan}, iuran kas periode ${activeBulanObj.fullLabel} (${formatRupiah(activeBulanNominal)}) belum tercatat lunas. Yuk cek di Kas Kelas!`,
        tag: dailyKey,
        url: '/',
      });
    }

    // B. Jika ada Broadcast Pengingat Kas terbaru dari Bendahara
    if (latestKasBroadcast && latestKasBroadcast.id) {
      const broadcastKey = `kas-bcast-${currentUser.nim}-${latestKasBroadcast.id}`;
      if (!hasDeviceSeen(broadcastKey)) {
        markDeviceSeen(broadcastKey);
        sendDeviceNotification({
          title: `💰 Pengingat Kas dari Bendahara (${latestKasBroadcast.bulanLabel})`,
          body: `Halo ${currentUser.namaPanggilan}, mohon segera melunasi kas periode ${latestKasBroadcast.bulanLabel} sebesar ${formatRupiah(latestKasBroadcast.nominal)}.`,
          tag: broadcastKey,
          url: '/',
        });
        showToast(
          `💰 Pengingat Kas ${latestKasBroadcast.bulanLabel}`,
          `Halo ${currentUser.namaPanggilan}, iuran kas Anda belum tercatat lunas.`,
          'warning'
        );
      }
    }
  }, [
    isCurrentUserPaidActiveMonth,
    activeBulanObj,
    activeBulanNominal,
    currentUser.nim,
    currentUser.namaPanggilan,
    notifPermission,
    latestKasBroadcast,
    showToast,
  ]);

  // Gabungkan daftar item untuk Pusat Notifikasi (Lonceng)
  const notificationItems = useMemo<NotificationCenterItem[]>(() => {
    const items: NotificationCenterItem[] = [];

    // 1. Pengingat Kas (Muncul paling atas jika belum lunas bulan aktif)
    if (!isCurrentUserPaidActiveMonth && activeBulanObj) {
      items.push({
        id: `notif-kas-${currentUser.id}-${activeBulanObj.key}`,
        category: 'kas',
        title: `Pengingat Kas: ${activeBulanObj.fullLabel} Belum Lunas`,
        subtitle: `Iuran sebesar ${formatRupiah(activeBulanNominal)} untuk periode ${activeBulanObj.fullLabel} belum tercatat lunas di buku kas.`,
        dateLabel: 'Periode Aktif',
        targetModule: 'kas-kelas',
      });
    }

    // 2. Pengumuman Terbaru
    pengumumanList.slice(0, 4).forEach((p) => {
      items.push({
        id: `notif-peng-${p.id}`,
        category: 'pengumuman',
        title: p.judul,
        subtitle: p.isi,
        dateLabel: p.tanggal,
        targetModule: 'dashboard',
      });
    });

    // 3. Tugas / Deadline Terbaru
    jadwalList.slice(0, 4).forEach((j) => {
      items.push({
        id: `notif-jdw-${j.id}`,
        category: 'tugas',
        title: j.judul,
        subtitle: `${j.deskripsi || j.lokasi} • Tenggat: ${j.tanggal} (${j.waktuMulai})`,
        dateLabel: j.tanggal,
        targetModule: 'dashboard',
      });
    });

    return items;
  }, [
    isCurrentUserPaidActiveMonth,
    activeBulanObj,
    activeBulanNominal,
    currentUser.id,
    pengumumanList,
    jadwalList,
  ]);

  const unreadCount = useMemo(() => {
    return notificationItems.filter((item) => !readIds[item.id]).length;
  }, [notificationItems, readIds]);

  const handleMarkAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = { ...prev, [id]: true };
      try {
        localStorage.setItem(READ_NOTIF_CENTER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const next: Record<string, boolean> = { ...readIds };
    notificationItems.forEach((item) => {
      next[item.id] = true;
    });
    setReadIds(next);
    try {
      localStorage.setItem(READ_NOTIF_CENTER_KEY, JSON.stringify(next));
    } catch {}
  };

  // Aktifkan Notifikasi Perangkat
  const handleEnableDeviceNotif = async () => {
    const perm = await requestDeviceNotificationPermission();
    setNotifPermission(perm);

    if (perm === 'granted') {
      await sendDeviceNotification({
        title: '🔔 Notifikasi SETEMP4T Aktif!',
        body: `Halo ${currentUser.namaPanggilan}, perangkat Anda kini akan menerima notifikasi Pengumuman, Tugas Baru, dan Pengingat Kas.`,
        tag: `welcome-notif-${Date.now()}`,
      });
      showToast(
        'Notifikasi Perangkat Aktif!',
        'Device Anda siap menerima notifikasi Pengumuman, Tugas Baru & Pengingat Kas.'
      );
    } else if (perm === 'denied') {
      showToast(
        'Izin Notifikasi Ditolak Browser',
        'Silakan izinkan notifikasi di pengaturan situs browser Anda (ikon gembok di sebelah URL).',
        'warning'
      );
    }
  };

  // Tes kirim notifikasi langsung ke layar device
  const handleSendTestNotif = async () => {
    if (notifPermission !== 'granted') {
      await handleEnableDeviceNotif();
      return;
    }
    const kasStatusText = !isCurrentUserPaidActiveMonth
      ? `Pengingat: Kas ${activeBulanObj?.fullLabel || ''} (${formatRupiah(activeBulanNominal)}) belum lunas.`
      : `Kas periode ${activeBulanObj?.fullLabel || ''} Anda sudah lunas. Terima kasih!`;

    await sendDeviceNotification({
      title: '🔔 Notifikasi SETEMP4T (ST04)',
      body: `Pengumuman (${pengumumanList.length}), Tugas Aktif (${jadwalList.length}). ${kasStatusText}`,
      tag: `test-notif-${Date.now()}`,
    });
    showToast(
      'Notifikasi Dikirim ke Device!',
      'Cek pop-up notifikasi di layar atas HP atau sudut layar Laptop Anda.'
    );
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem(BANNER_DISMISSED_KEY, '1');
    } catch {}
  };

  return (
    <>
      <header className="h-14 bg-[#fffcf8]/95 border-b border-[#dfd0bf] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Kiri: Tombol Garis 3 + Tulisan SETEMP4T */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-xl text-[#3b2216] hover:bg-[#f5ebe1] transition-colors cursor-pointer"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveModule('dashboard')}
            className="text-base sm:text-lg font-medium tracking-wide text-[#3b2216] cursor-pointer select-none"
          >
            SETEMP4T
          </button>
        </div>

        {/* Kanan: Lonceng Notifikasi + Logo Profil */}
        <div className="flex items-center gap-2">
          {/* Lonceng Notifikasi */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpenDropdown((prev) => !prev)}
              className="relative p-2 rounded-xl text-[#3b2216] hover:bg-[#f5ebe1] transition-colors cursor-pointer"
              title="Notifikasi Pengumuman, Tugas & Pengingat Kas"
              aria-label="Pusat Notifikasi"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-5 h-5 text-[#5c3724]" />
              ) : (
                <Bell className="w-5 h-5 text-[#3b2216]" />
              )}
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Pusat Notifikasi */}
            {openDropdown && (
              <div className="fixed sm:absolute right-3 left-3 sm:left-auto sm:right-0 top-16 sm:top-12 sm:w-96 rounded-2xl bg-[#fffcf8] border border-[#d8c2ab] shadow-xl z-50 overflow-hidden animate-fadeIn">
                {/* Header Dropdown */}
                <div className="px-4 py-3 bg-[#f6ece0] border-b border-[#dfd0bf] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-[#3b2216]">
                      Notifikasi Kelas ST04
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Pengumuman, Tugas Baru &amp; Pengingat Kas
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#5c3724] hover:underline flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#efe3d5] cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Tandai Dibaca</span>
                      </button>
                    )}
                    <button
                      onClick={() => setOpenDropdown(false)}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Notifikasi Perangkat (HP / Laptop) */}
                <div className="px-4 py-2.5 bg-[#faf4ed] border-b border-[#e5d5c3] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-stone-700">
                    <span className="font-medium text-[#4e2e1d]">
                      Notifikasi Layar Device:{' '}
                    </span>
                    {notifPermission === 'granted' ? (
                      <span className="text-emerald-700 font-medium">
                        Aktif ✓
                      </span>
                    ) : notifPermission === 'denied' ? (
                      <span className="text-rose-600">Diblokir Browser</span>
                    ) : notifPermission === 'unsupported' ? (
                      <span className="text-stone-500">Tidak Didukung</span>
                    ) : (
                      <span className="text-amber-700">Belum Diaktifkan</span>
                    )}
                  </div>

                  {notifPermission === 'granted' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSendTestNotif}
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Tes Notif</span>
                    </Button>
                  ) : notifPermission !== 'unsupported' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnableDeviceNotif}
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Aktifkan</span>
                    </Button>
                  ) : null}
                </div>

                {/* Daftar Item Notifikasi */}
                <div className="max-h-80 overflow-y-auto divide-y divide-[#efe4d6]">
                  {notificationItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-400">
                      Belum ada notifikasi terbaru.
                    </div>
                  ) : (
                    notificationItems.map((item) => {
                      const isUnread = !readIds[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleMarkAsRead(item.id);
                            setActiveModule(item.targetModule);
                            setOpenDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[#f5ebe0] transition-colors flex items-start gap-3 cursor-pointer ${
                            isUnread ? 'bg-[#fdf6ed]' : 'bg-transparent'
                          }`}
                        >
                          <div
                            className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                              item.category === 'kas'
                                ? 'bg-rose-100 text-rose-700'
                                : item.category === 'pengumuman'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[#efe3d5] text-[#5c3724]'
                            }`}
                          >
                            {item.category === 'kas' && (
                              <Wallet className="w-4 h-4" />
                            )}
                            {item.category === 'pengumuman' && (
                              <Megaphone className="w-4 h-4" />
                            )}
                            {item.category === 'tugas' && (
                              <CalendarClock className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <Badge
                                variant={
                                  item.category === 'kas'
                                    ? 'danger'
                                    : item.category === 'pengumuman'
                                      ? 'warning'
                                      : 'ipb'
                                }
                              >
                                {item.category === 'kas'
                                  ? 'PENGINGAT KAS'
                                  : item.category === 'pengumuman'
                                    ? 'PENGUMUMAN'
                                    : 'TUGAS BARU'}
                              </Badge>
                              <span className="text-[10px] text-stone-400 shrink-0">
                                {item.dateLabel}
                              </span>
                            </div>

                            <div className="text-xs text-[#2d180e] font-medium mt-1 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-stone-600 line-clamp-2 mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>

                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tombol Profil */}
          <button
            onClick={() => setActiveModule('profil-mahasiswa')}
            className="relative flex items-center gap-2 p-1 rounded-full hover:bg-[#f5ebe1] transition-colors cursor-pointer"
            title={`${currentUser.namaLengkap} (${currentUser.nim})`}
            aria-label="Profil Saya"
          >
            <AvatarInitials name={currentUser.namaLengkap} size="md" />
            {isAdmin && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#5c3724] text-white flex items-center justify-center ring-2 ring-white"
                title="Mode Admin Aktif"
              >
                <ShieldCheck className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner Ajakan Aktifkan Notifikasi Device (muncul jika izin browser masih default) */}
      {notifPermission === 'default' && !bannerDismissed && (
        <div className="bg-[#efe3d5] border-b border-[#d8c2ab] px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-[#3b2216]">
              <BellRing className="w-4 h-4 text-[#5c3724] shrink-0" />
              <span>
                Aktifkan <b>Notifikasi Perangkat</b> agar HP/Laptop Anda menerima
                pop-up <b>Pengumuman</b>, <b>Tugas Baru</b> &amp;{' '}
                <b>Pengingat Kas</b>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnableDeviceNotif}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi</span>
              </Button>
              <button
                onClick={handleDismissBanner}
                className="p-1 text-stone-500 hover:text-stone-800 cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

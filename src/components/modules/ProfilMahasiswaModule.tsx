'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AvatarInitials,
  Badge,
  Button,
  Card,
  Input,
} from '@/components/ui';
import { formatRupiah } from '@/lib/utils';
import { FirebaseServices } from '@/lib/firebase/services';
import {
  BulanKey,
  DEFAULT_KAS_PERIODE_CONFIG,
  KAS_CHECKBOX_STORAGE_KEY,
  KAS_DRIVE_URL,
  KAS_FIRESTORE_KEY,
  KAS_PERIODE_FIRESTORE_KEY,
  KAS_PERIODE_STORAGE_KEY,
  KasPeriodeConfig,
  buildInitialCheckedMapForStudents,
  getNominalForBulanItem,
} from '@/components/modules/KasKelasModule';
import {
  KeyRound,
  Lock,
  LogOut,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  QrCode,
  ExternalLink,
} from 'lucide-react';

export function ProfilMahasiswaModule() {
  const {
    currentUser,
    mahasiswaList,
    kelompokList,
    mataKuliahList,
    changeOwnPassword,
    isAdmin,
    unlockAdminWithKey,
    lockAdmin,
    setActiveModule,
    logout,
  } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');

  // Muat data checkbox kas & periode kas dari buku kas / localStorage / Firestore agar sinkron dengan halaman Kas
  const [checkedMap, setCheckedMap] = useState<
    Record<string, Record<BulanKey, boolean>>
  >({});
  const [periodeConfig, setPeriodeConfig] = useState<KasPeriodeConfig>(
    DEFAULT_KAS_PERIODE_CONFIG
  );

  useEffect(() => {
    const initial = buildInitialCheckedMapForStudents(mahasiswaList);
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
      }
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
    } catch {
      setCheckedMap(initial);
    }

    FirebaseServices.sharedState
      .get<Record<string, Record<BulanKey, boolean>>>(KAS_FIRESTORE_KEY)
      .then((cloudMap) => {
        if (cloudMap && typeof cloudMap === 'object') {
          setCheckedMap((prev) => ({ ...prev, ...cloudMap }));
        }
      })
      .catch(() => {});

    FirebaseServices.sharedState
      .get<KasPeriodeConfig>(KAS_PERIODE_FIRESTORE_KEY)
      .then((cloudPeriode) => {
        if (
          cloudPeriode &&
          Array.isArray(cloudPeriode.daftarBulan) &&
          cloudPeriode.daftarBulan.length > 0
        ) {
          setPeriodeConfig(cloudPeriode);
        }
      })
      .catch(() => {});
  }, [mahasiswaList]);

  // Nomor absen berdasarkan urutan NIM
  const myAbsenNumber = useMemo(() => {
    const sorted = [...mahasiswaList].sort((a, b) =>
      a.nim.localeCompare(b.nim)
    );
    const idx = sorted.findIndex((m) => m.id === currentUser.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [mahasiswaList, currentUser.id]);

  const mkMap = useMemo(
    () => new Map(mataKuliahList.map((mk) => [mk.id, mk])),
    [mataKuliahList]
  );

  const myGroups = useMemo(
    () =>
      kelompokList
        .filter((k) => k.anggotaIds.includes(currentUser.id))
        .map((k) => ({
          ...k,
          mataKuliah: mkMap.get(k.mataKuliahId),
        })),
    [kelompokList, currentUser.id, mkMap]
  );

  const myKasRow = useMemo(
    () => checkedMap[currentUser.id] || {},
    [checkedMap, currentUser.id]
  );

  const activeBulanObj = useMemo(
    () =>
      periodeConfig.daftarBulan.find(
        (b) => b.key === periodeConfig.activeBulanKey
      ) ||
      periodeConfig.daftarBulan[0] || {
        key: 'nov',
        label: 'Nov',
        fullLabel: 'November 2026',
      },
    [periodeConfig]
  );

  const isCurrentMonthPaid = !!myKasRow[activeBulanObj.key];

  // Semua periode dari awal hingga periode aktif saat ini yang belum dicentang
  const unpaidMonthsUpToNow = useMemo(() => {
    const activeIdx = periodeConfig.daftarBulan.findIndex(
      (b) => b.key === activeBulanObj.key
    );
    const sliceEnd =
      activeIdx >= 0 ? activeIdx + 1 : periodeConfig.daftarBulan.length;
    const monthsUpToActive = periodeConfig.daftarBulan.slice(0, sliceEnd);
    return monthsUpToActive.filter((m) => !myKasRow[m.key]);
  }, [periodeConfig.daftarBulan, activeBulanObj.key, myKasRow]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    changeOwnPassword(newPassword);
    setNewPassword('');
  };

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdminWithKey(accessKey)) {
      setAccessKey('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
      {/* =====================================================================
          PENGINGAT KAS BULAN INI (MUNCUL JIKA BELUM MELUNASI KAS BULAN INI)
         ===================================================================== */}
      {!isCurrentMonthPaid ? (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-[#fff7ed] to-rose-50 border border-amber-300/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-[#3b2216]">
                  Pengingat Kas Bulan Ini ({activeBulanObj.fullLabel}) — Belum
                  Lunas
                </span>
                <Badge variant="warning">
                  Monthly Dues Reminder •{' '}
                  {formatRupiah(periodeConfig.nominalPerPeriode)}/periode
                </Badge>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Anda belum tercatat melunasi iuran kas wajib periode{' '}
                <span className="text-rose-700">
                  {unpaidMonthsUpToNow.map((m) => m.label).join(', ')}
                </span>{' '}
                (Total tunggakan:{' '}
                <span className="text-rose-700">
                  {formatRupiah(
                    unpaidMonthsUpToNow.reduce(
                      (sum, m) =>
                        sum +
                        getNominalForBulanItem(m, periodeConfig.nominalPerPeriode),
                      0
                    )
                  )}
                </span>
                ). Silakan scan QRIS dan unggah bukti pembayaran ke Google Drive.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveModule('kas-kelas')}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Lihat QRIS Kas</span>
            </Button>
            <a
              href={KAS_DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f5ebe0] text-[#4e2e1d] border border-[#d8c2ab] text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Upload Bukti</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-3.5 bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Terima kasih! Kas periode{' '}
              <strong>{activeBulanObj.fullLabel}</strong> Anda sudah tercatat{' '}
              <strong>Lunas</strong>.
            </span>
          </div>
          <Badge variant="success">Paid • Lunas</Badge>
        </div>
      )}

      {/* Kartu Biodata Mahasiswa */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <AvatarInitials name={currentUser.namaLengkap} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="ipb">Absen #{myAbsenNumber}</Badge>
              <h2 className="text-base sm:text-lg text-[#2d180e]">
                {currentUser.namaLengkap}
              </h2>
              {currentUser.jalurMasuk && (
                <Badge variant="info">{currentUser.jalurMasuk}</Badge>
              )}
            </div>
            <div className="text-xs font-mono text-stone-500 mt-0.5">
              NIM: {currentUser.nim} • Student Profile
            </div>
            <div className="text-xs text-[#5c3724] mt-0.5">
              {currentUser.programStudi} • {currentUser.fakultas}
            </div>
          </div>
        </div>

        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </Button>
      </Card>

      {/* Ringkasan Checklist Kas & Kelompok Saya */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Card className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#2d180e]">
                Status Kas ({periodeConfig.namaPeriode})
              </div>
              <div className="text-[11px] text-stone-400">
                Monthly Treasury Status •{' '}
                {formatRupiah(periodeConfig.nominalPerPeriode)}/periode
              </div>
            </div>
            <Badge variant={isCurrentMonthPaid ? 'success' : 'danger'}>
              {isCurrentMonthPaid ? 'Bulan Ini Lunas' : 'Belum Lunas'}
            </Badge>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {periodeConfig.daftarBulan.map((b) => {
              const paid = !!myKasRow[b.key];
              return (
                <div
                  key={b.key}
                  className={`p-2 rounded-xl border text-center text-xs ${
                    paid
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50/60 border-rose-200/80 text-rose-700'
                  }`}
                >
                  <div>{b.label}</div>
                  <div className="text-[10px] mt-0.5">
                    {paid ? 'Lunas' : 'Belum'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <div>
            <div className="text-xs text-[#2d180e]">
              Kelompok Saya ({myGroups.length})
            </div>
            <div className="text-[11px] text-stone-400">
              Assigned Study Groups • Semester 1
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {myGroups.length === 0 ? (
              <span className="text-xs text-stone-400">Belum ada kelompok</span>
            ) : (
              myGroups.map((g) => (
                <Badge key={g.id} variant="ipb">
                  {g.mataKuliah?.nama}: {g.namaKelompok}
                </Badge>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Pengaturan Password Akun */}
      <Card className="p-4">
        <form
          onSubmit={handlePasswordSubmit}
          className="flex flex-col sm:flex-row sm:items-end gap-3"
        >
          <div className="flex-1">
            <label className="block text-xs text-stone-700 mb-1">
              Ubah Password Akun ({currentUser.nim})
            </label>
            <Input
              type="password"
              minLength={4}
              placeholder="Password baru (min. 4 karakter)..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            <Lock className="w-3.5 h-3.5" />
            <span>Simpan Password</span>
          </Button>
        </form>
      </Card>

      {/* Access Key Admin */}
      <Card className="p-4">
        {isAdmin ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#4e2e1d]">
              <ShieldCheck className="w-4 h-4 text-[#5c3724]" />
              <span>Akses Admin Aktif (Admin Mode Unlocked)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveModule('panel-admin')}
              >
                Buka Panel Admin
              </Button>
              <Button variant="outline" size="sm" onClick={lockAdmin}>
                Kunci Admin
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleUnlockSubmit}
            className="flex flex-col sm:flex-row sm:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-xs text-stone-700 mb-1">
                Access Key Admin
              </label>
              <Input
                type="password"
                placeholder="Masukkan Access Key Admin..."
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="md">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Buka Akses Admin</span>
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  AvatarInitials,
  Badge,
  Button,
  Card,
  Input,
} from '@/components/ui';
import { formatRupiah } from '@/lib/utils';
import { KeyRound, Lock, LogOut, ShieldCheck } from 'lucide-react';

export function ProfilMahasiswaModule() {
  const {
    currentUser,
    kelompokList,
    mataKuliahList,
    pembayaranKasList,
    changeOwnPassword,
    isAdmin,
    unlockAdminWithKey,
    lockAdmin,
    setActiveModule,
    logout,
  } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [accessKey, setAccessKey] = useState('');

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

  const myKas = useMemo(
    () => pembayaranKasList.find((p) => p.mahasiswaId === currentUser.id),
    [pembayaranKasList, currentUser.id]
  );

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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Kartu Biodata Singkat */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <AvatarInitials name={currentUser.namaLengkap} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-[#2d180e]">
                {currentUser.namaLengkap}
              </h2>
              {currentUser.jalurMasuk && (
                <Badge variant="ipb">{currentUser.jalurMasuk}</Badge>
              )}
            </div>
            <div className="text-xs font-mono text-stone-500 mt-0.5">
              NIM: {currentUser.nim}
            </div>
            <div className="text-xs text-[#5c3724] font-semibold mt-0.5">
              {currentUser.programStudi} • {currentUser.fakultas}
            </div>
          </div>
        </div>

        <Button variant="danger" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </Button>
      </Card>

      {/* Ringkasan Kas & Kelompok Saya */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4 space-y-1.5">
          <div className="text-xs font-bold text-stone-500">
            Status Kas Bulan Ini
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-[#2d180e]">
              {formatRupiah(myKas?.nominal || 20000)}
            </span>
            <Badge
              variant={
                myKas?.status === 'Lunas'
                  ? 'success'
                  : myKas?.status === 'Menunggu Verifikasi'
                  ? 'warning'
                  : 'danger'
              }
            >
              {myKas?.status || 'Belum Lunas'}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 space-y-1.5">
          <div className="text-xs font-bold text-stone-500">
            Kelompok Saya ({myGroups.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {myGroups.length === 0 ? (
              <span className="text-xs text-stone-400">Belum ada</span>
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
            <label className="block text-xs font-bold text-stone-700 mb-1">
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
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#4e2e1d]">
              <ShieldCheck className="w-4 h-4 text-[#5c3724]" />
              <span>Akses Admin Aktif</span>
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
              <label className="block text-xs font-bold text-stone-700 mb-1">
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

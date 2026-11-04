'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Badge, Button, Input } from '@/components/ui';
import {
  KeyRound,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
} from 'lucide-react';

export function LoginView() {
  const {
    mahasiswaList,
    lastSavedNim,
    findMahasiswaByNim,
    isAccountLocked,
    syncAccountsFromCloud,
    loginOrRegister,
    unlockAdminWithKey,
  } = useApp();

  // Kosong di device baru, hanya terisi jika device ini sebelumnya pernah login
  const [nimInput, setNimInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [showAdminField, setShowAdminField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sinkronisasi daftar akun terkunci dari Cloud Firestore saat halaman login dibuka
  useEffect(() => {
    syncAccountsFromCloud();
  }, [syncAccountsFromCloud]);

  // Jika device ini sudah pernah login sebelumnya, ingat NIM terakhir di device ini saja
  useEffect(() => {
    if (lastSavedNim) {
      setNimInput(lastSavedNim);
    }
  }, [lastSavedNim]);

  const sortedMahasiswaByNim = useMemo(
    () => [...mahasiswaList].sort((a, b) => a.nim.localeCompare(b.nim)),
    [mahasiswaList]
  );

  const matchedStudent = useMemo(() => {
    if (!nimInput.trim()) return undefined;
    return findMahasiswaByNim(nimInput);
  }, [nimInput, findMahasiswaByNim]);

  const matchedNimLocked = useMemo(() => {
    if (!matchedStudent) return false;
    return isAccountLocked(matchedStudent.nim);
  }, [matchedStudent, isAccountLocked]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginOrRegister(nimInput, passwordInput);
    if (ok && adminKeyInput.trim()) {
      unlockAdminWithKey(adminKeyInput);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card-elevated rounded-3xl overflow-hidden shadow-xl animate-sheet">
        {/* Header Brand SETEMP4T */}
        <div className="hero-mesh px-6 py-7 text-center text-white">
          <div className="text-xl tracking-wide">SETEMP4T</div>
          <p className="text-xs text-amber-100/85 mt-1">
            Portal Kelas ST04 • IPB University
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Input Username (NIM) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-stone-700">
                Username (NIM) • Student ID
              </label>
              <select
                aria-label="Pilih nama mahasiswa"
                value={matchedStudent?.nim || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setNimInput(e.target.value);
                    setPasswordInput('');
                  }
                }}
                className="text-[11px] text-[#5c3724] bg-transparent focus:outline-none cursor-pointer max-w-[185px] truncate"
              >
                <option value="">Pilih Nama Mahasiswa...</option>
                {sortedMahasiswaByNim.map((m, idx) => (
                  <option key={m.id} value={m.nim}>
                    {idx + 1}. {m.namaLengkap} ({m.nim})
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Ketik NIM Anda (contoh: G3401261048)"
              value={nimInput}
              onChange={(e) => setNimInput(e.target.value.toUpperCase())}
              className="font-mono uppercase"
              autoComplete="username"
            />
          </div>

          {/* Indikator Mahasiswa Ditemukan & Status Kunci Password */}
          {matchedStudent && (
            <div className="p-3 rounded-xl bg-[#f5ebe1] border border-[#d8be9f] space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserCheck className="w-4 h-4 text-[#5c3724] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-[#2d180e] truncate">
                      {matchedStudent.namaLengkap}
                    </div>
                    <div className="text-[11px] text-stone-600 truncate">
                      {matchedStudent.programStudi}
                    </div>
                  </div>
                </div>
                {matchedNimLocked ? (
                  <Badge variant="ipb" className="shrink-0">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                ) : (
                  <Badge variant="info" className="shrink-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    First Login
                  </Badge>
                )}
              </div>

              <div className="text-[11px] text-[#5c3724] border-t border-[#e2ccb2] pt-1.5">
                {matchedNimLocked
                  ? 'Akun ini sudah dikunci password. Masukkan password yang telah dibuat untuk masuk.'
                  : 'Akun ini belum memiliki password. Buat password baru (min. 4 karakter) untuk mengunci akun Anda.'}
              </div>
            </div>
          )}

          {/* Input Password */}
          <div>
            <label className="block text-xs text-stone-700 mb-1.5">
              {matchedNimLocked
                ? 'Password Akun Terkunci'
                : 'Buat / Masukkan Password'}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={
                  matchedNimLocked
                    ? 'Masukkan password akun Anda...'
                    : 'Buat password baru (min. 4 karakter)...'
                }
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Sesi login diingat khusus di perangkat (browser) Anda masing-masing.
            </p>
          </div>

          {/* Opsional: Access Key Admin */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdminField((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs text-[#5c3724] hover:underline cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {showAdminField
                  ? 'Sembunyikan Access Key Admin'
                  : 'Masuk sebagai Admin (Access Key)'}
              </span>
            </button>

            {showAdminField && (
              <div className="mt-2 animate-fadeIn">
                <Input
                  type="password"
                  placeholder="Masukkan Access Key Admin..."
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  className="text-xs"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
          >
            <span>
              {matchedStudent && !matchedNimLocked
                ? 'Kunci Password & Masuk'
                : 'Masuk ke SETEMP4T'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

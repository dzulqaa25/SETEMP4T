'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button, Input } from '@/components/ui';
import { KeyRound, UserCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginView() {
  const {
    mahasiswaList,
    lastSavedNim,
    findMahasiswaByNim,
    loginOrRegister,
    unlockAdminWithKey,
  } = useApp();

  const [nimInput, setNimInput] = useState('A2401261152');
  const [passwordInput, setPasswordInput] = useState('');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [showAdminField, setShowAdminField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (lastSavedNim) {
      setNimInput(lastSavedNim);
    }
  }, [lastSavedNim]);

  const matchedStudent = useMemo(() => {
    if (!nimInput.trim()) return undefined;
    return findMahasiswaByNim(nimInput);
  }, [nimInput, findMahasiswaByNim]);

  const executeLogin = () => {
    const ok = loginOrRegister(nimInput, passwordInput || 'st04');
    if (ok && adminKeyInput.trim()) {
      unlockAdminWithKey(adminKeyInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card-elevated rounded-3xl overflow-hidden shadow-xl animate-sheet">
        {/* Header Brand SETEMP4T */}
        <div className="hero-mesh px-6 py-7 text-center text-white">
          <div className="text-xl font-medium tracking-wide">SETEMP4T</div>
          <p className="text-xs text-amber-100/85 mt-1 font-normal">
            Portal Kelas ST04 • IPB University
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Input Username (NIM) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                Username (NIM)
              </label>
              <select
                aria-label="Pilih nama mahasiswa"
                value={matchedStudent?.nim || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setNimInput(e.target.value);
                  }
                }}
                className="text-[11px] text-[#5c3724] font-bold bg-transparent focus:outline-none cursor-pointer max-w-[180px] truncate"
              >
                <option value="">Pilih dari Daftar Nama...</option>
                {mahasiswaList.map((m) => (
                  <option key={m.id} value={m.nim}>
                    {m.namaLengkap} ({m.nim})
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Ketik NIM (contoh: A2401261152)"
              value={nimInput}
              onChange={(e) => setNimInput(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
          </div>

          {/* Indikator Mahasiswa Ditemukan */}
          {matchedStudent && (
            <div className="p-3 rounded-xl bg-[#f5ebe1] border border-[#d8be9f] flex items-center gap-2.5 animate-fadeIn">
              <UserCheck className="w-4 h-4 text-[#5c3724] shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#3b2216] truncate">
                  {matchedStudent.namaLengkap}
                </div>
                <div className="text-[11px] text-stone-600 truncate">
                  {matchedStudent.programStudi}
                </div>
              </div>
            </div>
          )}

          {/* Input Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Buat / masukkan password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="pr-10"
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
              Login otomatis diingat di browser ini.
            </p>
          </div>

          {/* Opsional: Access Key Admin */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdminField((prev) => !prev)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5c3724] hover:underline cursor-pointer"
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
            onClick={executeLogin}
            className="w-full"
          >
            <span>Masuk ke SETEMP4T</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

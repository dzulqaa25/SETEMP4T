'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { AvatarInitials } from '@/components/ui';
import { Menu, ShieldCheck } from 'lucide-react';

export function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { currentUser, isAdmin, setActiveModule } = useApp();

  return (
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

      {/* Kanan: Logo Profil */}
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
    </header>
  );
}

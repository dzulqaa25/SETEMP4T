'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ActiveModuleId } from '@/types/database';
import { cn } from '@/lib/utils';
import { AvatarInitials } from '@/components/ui';
import {
  Home,
  Wallet,
  UsersRound,
  UserCircle,
  KeyRound,
  LogOut,
  X,
} from 'lucide-react';

const NAV_ITEMS: {
  id: ActiveModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'Beranda', icon: Home },
  { id: 'kas-kelas', label: 'Kas', icon: Wallet },
  { id: 'group-manager', label: 'Kelompok', icon: UsersRound },
  { id: 'profil-mahasiswa', label: 'Profil', icon: UserCircle },
  { id: 'panel-admin', label: 'Admin', icon: KeyRound },
];

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { activeModule, setActiveModule, currentUser, isAdmin, logout } =
    useApp();

  if (!mobileOpen) return null;

  const handleSelect = (id: ActiveModuleId) => {
    setActiveModule(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onCloseMobile}
        className="fixed inset-0 z-40 bg-stone-950/45 animate-fadeIn"
      />

      {/* Drawer Garis 3 */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-[#fffcf8] border-r border-[#dfd0bf] flex flex-col justify-between shadow-2xl animate-slideLeft">
        <div>
          {/* Header Drawer */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#dfd0bf]">
            <span className="text-base font-medium tracking-wide text-[#3b2216]">
              SETEMP4T
            </span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-stone-500 hover:bg-[#f5ebe1] cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Daftar Menu Sederhana */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer',
                    isActive
                      ? 'brown-shade-btn text-white'
                      : 'text-stone-700 hover:bg-[#f5ebe1] hover:text-[#3b2216]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'panel-admin' && isAdmin && (
                    <span
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f5ebe1] text-[#5c3724]'
                      )}
                    >
                      Aktif
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Drawer: Info Singkat Akun & Tombol Keluar */}
        <div className="p-3 border-t border-[#dfd0bf] bg-[#f8f1e8] space-y-2">
          <div
            onClick={() => handleSelect('profil-mahasiswa')}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/70 cursor-pointer"
          >
            <AvatarInitials name={currentUser.namaLengkap} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-[#3b2216] truncate">
                {currentUser.namaPanggilan}
              </div>
              <div className="text-[11px] font-mono text-stone-500 truncate">
                {currentUser.nim}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onCloseMobile();
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}

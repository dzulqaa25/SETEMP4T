'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { LoginView } from '@/components/auth/LoginView';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardModule } from '@/components/modules/DashboardModule';
import { KasKelasModule } from '@/components/modules/KasKelasModule';
import { GroupManagerModule } from '@/components/modules/GroupManagerModule';
import { ProfilMahasiswaModule } from '@/components/modules/ProfilMahasiswaModule';
import { AdminPanelModule } from '@/components/modules/AdminPanelModule';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export default function HomePage() {
  const { activeModule, isLoggedIn, toasts, dismissToast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule />;
      case 'kas-kelas':
        return <KasKelasModule />;
      case 'group-manager':
        return <GroupManagerModule />;
      case 'profil-mahasiswa':
        return <ProfilMahasiswaModule />;
      case 'panel-admin':
        return <AdminPanelModule />;
      default:
        return <DashboardModule />;
    }
  };

  return (
    <>
      {!isLoggedIn ? (
        <LoginView />
      ) : (
        <div className="min-h-screen flex flex-col">
          {/* Drawer Menu Garis 3 */}
          <Sidebar
            mobileOpen={menuOpen}
            onCloseMobile={() => setMenuOpen(false)}
          />

          {/* Navbar Polos: Garis 3 + SETEMP4T + Logo Profil */}
          <Topbar onOpenMobileMenu={() => setMenuOpen(true)} />

          {/* Konten Utama */}
          <main className="flex-1 px-4 sm:px-6 py-5 max-w-5xl w-full mx-auto animate-fadeIn">
            {renderActiveModule()}
          </main>
        </div>
      )}

      {/* Notifikasi Singkat */}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-xs pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#2d180e] text-white shadow-lg border border-[#7c4d34] animate-fadeIn"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            {t.type === 'info' && (
              <Info className="w-4 h-4 text-orange-300 shrink-0" />
            )}
            {t.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold truncate">{t.title}</div>
              {t.description && (
                <div className="text-[11px] text-amber-100/85 truncate">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-amber-200/70 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

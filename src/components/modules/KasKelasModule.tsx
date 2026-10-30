'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { KategoriTransaksiKas, TransaksiKas } from '@/types/database';
import { Badge, Button, Card, Input, Modal, Select } from '@/components/ui';
import { formatRupiah, formatTanggalIndo } from '@/lib/utils';
import { Plus, Trash2, Search, KeyRound } from 'lucide-react';

const BULAN_KAS = [
  { key: 'agu', label: 'Agu' },
  { key: 'sep', label: 'Sep' },
  { key: 'okt', label: 'Okt' },
  { key: 'nov', label: 'Nov' },
  { key: 'des', label: 'Des' },
] as const;

type BulanKey = (typeof BULAN_KAS)[number]['key'];

const KAS_NOMINAL_PER_BULAN = 20000;
const KAS_CHECKBOX_STORAGE_KEY = 'setemp4t_kas_checkbox_v1';

const KATEGORI_LIST: KategoriTransaksiKas[] = [
  'Iuran kelas',
  'Konsumsi',
  'Acara',
  'Operasional',
  'Lainnya',
];

export function KasKelasModule() {
  const {
    transaksiKasList,
    pembayaranKasList,
    mahasiswaList,
    addTransaksiKas,
    deleteTransaksiKas,
    updatePembayaranKas,
    currentUser,
    isAdmin,
    unlockAdminWithKey,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'iuran' | 'transaksi'>('iuran');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAdminKey, setQuickAdminKey] = useState('');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);

  // State Checkbox Kas per Mahasiswa: Record<mahasiswaId, Record<BulanKey, boolean>>
  const [checkedMap, setCheckedMap] = useState<
    Record<string, Record<BulanKey, boolean>>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Inisialisasi state checkbox dari localStorage atau data awal
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KAS_CHECKBOX_STORAGE_KEY);
      if (saved) {
        setCheckedMap(JSON.parse(saved));
        setIsLoaded(true);
        return;
      }
    } catch {}

    const initial: Record<string, Record<BulanKey, boolean>> = {};
    mahasiswaList.forEach((m) => {
      const oktRecord = pembayaranKasList.find((p) => p.mahasiswaId === m.id);
      const isOktLunas = oktRecord?.status === 'Lunas';
      initial[m.id] = {
        agu: true,
        sep: true,
        okt: isOktLunas,
        nov: false,
        des: false,
      };
    });
    setCheckedMap(initial);
    setIsLoaded(true);
  }, [mahasiswaList, pembayaranKasList]);

  // Simpan perubahan checkbox ke localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        KAS_CHECKBOX_STORAGE_KEY,
        JSON.stringify(checkedMap)
      );
    } catch {}
  }, [checkedMap, isLoaded]);

  // Modal Tambah Pengeluaran / Transaksi Lain
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tanggal, setTanggal] = useState('2026-10-30');
  const [judul, setJudul] = useState('');
  const [tipe, setTipe] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [kategori, setKategori] = useState<KategoriTransaksiKas>('Operasional');
  const [nominal, setNominal] = useState('50000');

  // Hitung pemasukan dari total checkbox yang dicentang (masing-masing Rp20.000)
  const { totalIuranCheckbox, totalPemasukan, totalPengeluaran, totalSaldo } =
    useMemo(() => {
      let totalChecks = 0;
      mahasiswaList.forEach((m) => {
        const row = checkedMap[m.id];
        if (row) {
          BULAN_KAS.forEach((b) => {
            if (row[b.key]) totalChecks += 1;
          });
        }
      });

      const iuranNominal = totalChecks * KAS_NOMINAL_PER_BULAN;
      const pemasukanLain = transaksiKasList
        .filter((t) => t.tipe === 'Pemasukan' && t.kategori !== 'Iuran kelas')
        .reduce((acc, t) => acc + t.nominal, 0);
      const pengeluaran = transaksiKasList
        .filter((t) => t.tipe === 'Pengeluaran')
        .reduce((acc, t) => acc + t.nominal, 0);

      const inc = iuranNominal + pemasukanLain;
      return {
        totalIuranCheckbox: iuranNominal,
        totalPemasukan: inc,
        totalPengeluaran: pengeluaran,
        totalSaldo: inc - pengeluaran,
      };
    }, [checkedMap, mahasiswaList, transaksiKasList]);

  const filteredMahasiswa = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mahasiswaList;
    return mahasiswaList.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nim.toLowerCase().includes(q)
    );
  }, [mahasiswaList, searchQuery]);

  const handleToggleCheckbox = (mhsId: string, bulan: BulanKey) => {
    if (!isAdmin) {
      setShowKeyPrompt(true);
      showToast(
        'Akses Admin Diperlukan',
        'Masukkan Access Key untuk mencentang kas.',
        'info'
      );
      return;
    }

    const currentRow = checkedMap[mhsId] || {
      agu: false,
      sep: false,
      okt: false,
      nov: false,
      des: false,
    };
    const nextVal = !currentRow[bulan];

    setCheckedMap((prev) => ({
      ...prev,
      [mhsId]: {
        ...currentRow,
        [bulan]: nextVal,
      },
    }));

    // Sinkronkan status bulan berjalan ke PembayaranKas
    if (bulan === 'okt') {
      const existing = pembayaranKasList.find((p) => p.mahasiswaId === mhsId);
      if (existing) {
        updatePembayaranKas({
          ...existing,
          status: nextVal ? 'Lunas' : 'Belum Lunas',
          tanggalPembayaran: nextVal
            ? new Date().toISOString().slice(0, 10)
            : null,
        });
      }
    }
  };

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdminWithKey(quickAdminKey)) {
      setQuickAdminKey('');
      setShowKeyPrompt(false);
    }
  };

  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    const numNominal = Math.max(0, Number(nominal) || 0);
    if (!judul.trim() || numNominal <= 0) return;

    addTransaksiKas({
      tanggal,
      judul: judul.trim(),
      deskripsi: kategori,
      tipe,
      kategori,
      nominal: numNominal,
      createdById: currentUser.id,
    });
    setJudul('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Ringkasan Saldo Kas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl hero-mesh text-white">
          <div className="text-[11px] font-bold uppercase text-amber-100">
            Saldo Kas Aktif
          </div>
          <div className="text-2xl font-black mt-1">
            {formatRupiah(totalSaldo)}
          </div>
          <div className="text-[11px] text-amber-100/85 mt-1">
            Wajib Rp20.000/bln (Mulai Agustus)
          </div>
        </div>

        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase text-stone-400">
            Total Pemasukan Kas
          </div>
          <div className="text-xl font-black text-[#5c3724] mt-1">
            {formatRupiah(totalPemasukan)}
          </div>
          <div className="text-[11px] text-stone-400 mt-0.5">
            Dari centang kas: {formatRupiah(totalIuranCheckbox)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-[11px] font-bold uppercase text-stone-400">
            Total Pengeluaran
          </div>
          <div className="text-xl font-black text-rose-600 mt-1">
            {formatRupiah(totalPengeluaran)}
          </div>
        </Card>
      </div>

      {/* Tab & Kontrol */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-[#efe3d5] p-1 rounded-2xl border border-[#d8c4ae]">
          <button
            onClick={() => setActiveTab('iuran')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'iuran'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Checklist Kas ({mahasiswaList.length})
          </button>
          <button
            onClick={() => setActiveTab('transaksi')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'transaksi'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Riwayat Kas ({transaksiKasList.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowKeyPrompt((prev) => !prev)}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Akses Admin</span>
            </Button>
          )}
          {isAdmin && activeTab === 'transaksi' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Kas</span>
            </Button>
          )}
        </div>
      </div>

      {/* Input Cepat Access Key Admin jika ingin mencentang kas */}
      {showKeyPrompt && !isAdmin && (
        <Card className="p-3.5 bg-[#faf3eb] border-[#d8be9f] animate-fadeIn">
          <form
            onSubmit={handleQuickUnlock}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <Input
              type="password"
              placeholder="Masukkan Access Key Admin untuk mencentang kas..."
              value={quickAdminKey}
              onChange={(e) => setQuickAdminKey(e.target.value)}
              className="text-xs py-1.5"
            />
            <Button type="submit" variant="primary" size="sm">
              Buka Akses
            </Button>
          </form>
        </Card>
      )}

      {/* TAB 1: CHECKBOX KAS MAHASISWA */}
      {activeTab === 'iuran' ? (
        <Card className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 py-1.5 text-xs"
              />
            </div>
            <span className="text-[11px] font-semibold text-stone-500">
              1 Centang = Rp20.000 • Mulai Agustus
            </span>
          </div>

          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#fffcf8] z-10 border-b border-[#dfd0bf]">
                <tr className="text-[11px] font-extrabold uppercase text-[#4e2e1d]">
                  <th className="py-2.5 px-2 w-8">No</th>
                  <th className="py-2.5 px-2">Nama & NIM</th>
                  {BULAN_KAS.map((b) => (
                    <th key={b.key} className="py-2.5 px-2 text-center w-14">
                      {b.label}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 text-xs">
                {filteredMahasiswa.map((m, idx) => {
                  const row = checkedMap[m.id] || {
                    agu: false,
                    sep: false,
                    okt: false,
                    nov: false,
                    des: false,
                  };
                  const paidCount = BULAN_KAS.filter((b) => row[b.key]).length;
                  const paidNominal = paidCount * KAS_NOMINAL_PER_BULAN;

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#faf5ef] transition-colors"
                    >
                      <td className="py-2.5 px-2 text-stone-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-bold text-[#2d180e]">
                          {m.namaLengkap}
                        </div>
                        <div className="text-[11px] font-mono text-stone-500">
                          {m.nim}
                        </div>
                      </td>

                      {BULAN_KAS.map((b) => {
                        const checked = !!row[b.key];
                        return (
                          <td
                            key={b.key}
                            className="py-2.5 px-2 text-center"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                handleToggleCheckbox(m.id, b.key)
                              }
                              aria-label={`Kas ${m.namaLengkap} bulan ${b.label}`}
                              className="w-4 h-4 rounded accent-[#5c3724] cursor-pointer transition-transform hover:scale-110"
                            />
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-2 text-right">
                        <Badge
                          variant={paidCount >= 3 ? 'success' : 'warning'}
                        >
                          {formatRupiah(paidNominal)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* TAB 2: RIWAYAT ARUS KAS */
        <Card className="divide-y divide-stone-200/70 overflow-hidden">
          {transaksiKasList.map((trx: TransaksiKas) => (
            <div
              key={trx.id}
              className="p-3.5 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="font-bold text-[#2d180e] truncate">
                  {trx.judul}
                </div>
                <div className="text-[11px] text-stone-500">
                  {formatTanggalIndo(trx.tanggal)} • {trx.kategori}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`font-extrabold ${
                    trx.tipe === 'Pemasukan'
                      ? 'text-[#5c3724]'
                      : 'text-rose-600'
                  }`}
                >
                  {trx.tipe === 'Pemasukan' ? '+' : '-'}
                  {formatRupiah(trx.nominal)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => deleteTransaksiKas(trx.id)}
                    className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Modal Tambah Transaksi */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Transaksi Kas"
      >
        <form onSubmit={handleSaveTransaksi} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Keterangan
            </label>
            <Input
              required
              placeholder="Contoh: Fotokopi Modul Latihan"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tipe
              </label>
              <Select
                value={tipe}
                onChange={(e) =>
                  setTipe(e.target.value as 'Pemasukan' | 'Pengeluaran')
                }
              >
                <option value="Pengeluaran">Pengeluaran (-)</option>
                <option value="Pemasukan">Pemasukan (+)</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kategori
              </label>
              <Select
                value={kategori}
                onChange={(e) =>
                  setKategori(e.target.value as KategoriTransaksiKas)
                }
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nominal (Rp)
              </label>
              <Input
                type="number"
                required
                min={1000}
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tanggal
              </label>
              <Input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

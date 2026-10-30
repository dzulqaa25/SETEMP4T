'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  HasilKelompokRandomizer,
  ModeRandomizer,
  RiwayatRandomisasi,
} from '@/types/database';
import { generateGroups } from '@/lib/randomizer';
import { Badge, Button, Card, Input, Select } from '@/components/ui';
import { Search, Crown, Shuffle, Copy, Save } from 'lucide-react';

const MODES: ModeRandomizer[] = [
  'Anti-duplikasi anggota',
  'Random berdasarkan Gender',
  'Random berdasarkan Fakultas',
  'Random berdasarkan Prodi',
  'Random biasa',
];

export function GroupManagerModule() {
  const {
    mataKuliahList,
    kelompokList,
    mahasiswaList,
    riwayatRandomisasiList,
    addRiwayatRandomisasi,
    applyRandomizerToMataKuliah,
    currentUser,
    isAdmin,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'daftar' | 'acak'>('daftar');
  const [selectedMkId, setSelectedMkId] = useState<string>('mk-statistika');
  const [studentQuery, setStudentQuery] = useState<string>('');

  // State Acak Kelompok
  const [mode, setMode] = useState<ModeRandomizer>('Anti-duplikasi anggota');
  const [jumlahKelompok, setJumlahKelompok] = useState<number>(7);
  const [generatedGroups, setGeneratedGroups] = useState<
    HasilKelompokRandomizer[]
  >([]);

  const mhsMap = useMemo(
    () => new Map(mahasiswaList.map((m) => [m.id, m])),
    [mahasiswaList]
  );

  const mkMap = useMemo(
    () => new Map(mataKuliahList.map((mk) => [mk.id, mk])),
    [mataKuliahList]
  );

  const matchedStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return [];
    return mahasiswaList
      .filter(
        (m) =>
          m.namaLengkap.toLowerCase().includes(q) ||
          m.namaPanggilan.toLowerCase().includes(q) ||
          m.nim.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((student) => ({
        student,
        memberships: kelompokList
          .filter((k) => k.anggotaIds.includes(student.id))
          .map((k) => ({
            kelompok: k,
            mataKuliah: mkMap.get(k.mataKuliahId),
          })),
      }));
  }, [studentQuery, mahasiswaList, kelompokList, mkMap]);

  const groupsForSelectedCourse = useMemo(
    () => kelompokList.filter((k) => k.mataKuliahId === selectedMkId),
    [kelompokList, selectedMkId]
  );

  const handleGenerate = () => {
    const res = generateGroups({
      mahasiswaList,
      mode,
      jumlahKelompok: Math.max(1, Math.min(30, jumlahKelompok)),
      existingGroups: kelompokList,
      pastRandomizations: riwayatRandomisasiList,
    });
    setGeneratedGroups(res.hasilKelompok);
    showToast('Kelompok Berhasil Diacak');
  };

  const handleSaveToCourse = () => {
    if (generatedGroups.length === 0) return;
    const mk = mkMap.get(selectedMkId);
    const riwayat: RiwayatRandomisasi = {
      id: `rnd-${Date.now()}`,
      judul: `Kelompok ${mk?.nama || 'ST04'}`,
      mataKuliahId: selectedMkId,
      tanggal: new Date().toLocaleDateString('id-ID'),
      mode,
      jumlahKelompok,
      targetAnggotaPerKelompok: Math.ceil(mahasiswaList.length / jumlahKelompok),
      totalMahasiswa: mahasiswaList.length,
      skorAntiDuplikasi: 95,
      hasilKelompok: generatedGroups,
      createdById: currentUser.id,
    };
    addRiwayatRandomisasi(riwayat);
    applyRandomizerToMataKuliah(selectedMkId, 'Tugas', riwayat);
    setTab('daftar');
  };

  const handleCopy = () => {
    const list =
      tab === 'acak' && generatedGroups.length > 0
        ? generatedGroups.map((g) => ({
            nama: g.namaKelompok,
            ketuaId: g.ketuaId,
            anggotaIds: g.anggotaIds,
          }))
        : groupsForSelectedCourse.map((g) => ({
            nama: g.namaKelompok,
            ketuaId: g.ketuaId,
            anggotaIds: g.anggotaIds,
          }));

    if (list.length === 0) return;
    const mk = mkMap.get(selectedMkId);
    const lines = [`*KELOMPOK ${(mk?.nama || 'ST04').toUpperCase()}*`];
    list.forEach((g) => {
      lines.push(`\n*${g.nama}*`);
      g.anggotaIds.forEach((id, idx) => {
        const m = mhsMap.get(id);
        if (m) {
          lines.push(
            `${idx + 1}. ${m.namaLengkap}${id === g.ketuaId ? ' (Ketua)' : ''}`
          );
        }
      });
    });
    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Disalin ke Clipboard');
  };

  return (
    <div className="space-y-4">
      {/* Bar Atas: Pilih Tab & Copy */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-[#efe3d5] p-1 rounded-2xl border border-[#d8c4ae]">
          <button
            onClick={() => setTab('daftar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              tab === 'daftar' ? 'brown-shade-btn text-white' : 'text-[#4e2e1d]'
            }`}
          >
            Daftar Kelompok
          </button>
          <button
            onClick={() => setTab('acak')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              tab === 'acak' ? 'brown-shade-btn text-white' : 'text-[#4e2e1d]'
            }`}
          >
            Acak Kelompok
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="w-3.5 h-3.5 text-[#5c3724]" />
          <span>Salin Teks</span>
        </Button>
      </div>

      {/* Pilihan Mata Kuliah */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {mataKuliahList.map((mk) => {
          const active = selectedMkId === mk.id;
          return (
            <button
              key={mk.id}
              onClick={() => setSelectedMkId(mk.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer border transition-colors ${
                active
                  ? 'brown-shade-btn text-white border-[#4e2e1d]'
                  : 'bg-[#fffcf8] text-stone-700 border-[#dfd0bf] hover:bg-[#f5ebe1]'
              }`}
            >
              {mk.nama}
            </button>
          );
        })}
      </div>

      {tab === 'daftar' ? (
        <div className="space-y-4">
          {/* Pencarian Cepat Mahasiswa */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama atau NIM mahasiswa..."
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              className="pl-10 text-xs"
            />
          </div>

          {matchedStudents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchedStudents.map(({ student, memberships }) => (
                <Card key={student.id} className="p-3.5 space-y-2">
                  <div className="text-xs font-extrabold text-[#2d180e]">
                    {student.namaLengkap}{' '}
                    <span className="font-mono font-normal text-stone-500">
                      ({student.nim})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberships.map(({ kelompok, mataKuliah }) => (
                      <Badge key={kelompok.id} variant="ipb">
                        {mataKuliah?.nama}: {kelompok.namaKelompok}
                      </Badge>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Grid Kelompok */}
          {groupsForSelectedCourse.length === 0 ? (
            <Card className="p-6 text-center space-y-2">
              <div className="text-xs font-bold text-stone-600">
                Belum ada kelompok untuk mata kuliah ini.
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTab('acak')}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Buat di Acak Kelompok</span>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupsForSelectedCourse.map((klp) => (
                <Card key={klp.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-sm font-extrabold text-[#4e2e1d]">
                      {klp.namaKelompok}
                    </span>
                    <Badge variant="ipb">{klp.anggotaIds.length} Orang</Badge>
                  </div>

                  <ul className="space-y-1 text-xs">
                    {klp.anggotaIds.map((mId, idx) => {
                      const m = mhsMap.get(mId);
                      if (!m) return null;
                      const isKetua = mId === klp.ketuaId;
                      return (
                        <li
                          key={mId}
                          className="flex items-center justify-between py-0.5"
                        >
                          <span
                            className={`truncate ${
                              isKetua
                                ? 'font-extrabold text-[#5c3724]'
                                : 'text-stone-700'
                            }`}
                          >
                            {idx + 1}. {m.namaLengkap}
                          </span>
                          {isKetua && (
                            <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab Acak Kelompok (Randomizer Ringkas) */
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Jumlah Kelompok
                </label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={jumlahKelompok}
                  onChange={(e) => setJumlahKelompok(Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mode Pembagian ({mahasiswaList.length} Mahasiswa)
                </label>
                <Select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as ModeRandomizer)}
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="md" onClick={handleGenerate}>
                <Shuffle className="w-4 h-4" />
                <span>Acak Sekarang</span>
              </Button>

              {generatedGroups.length > 0 && isAdmin && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleSaveToCourse}
                >
                  <Save className="w-4 h-4" />
                  <span>
                    Simpan ke {mkMap.get(selectedMkId)?.nama}
                  </span>
                </Button>
              )}
            </div>
          </Card>

          {generatedGroups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {generatedGroups.map((klp) => (
                <Card key={klp.nomorKelompok} className="p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="text-sm font-extrabold text-[#4e2e1d]">
                      {klp.namaKelompok}
                    </span>
                    <Badge variant="ipb">{klp.anggotaIds.length} Orang</Badge>
                  </div>
                  <ul className="space-y-1 text-xs">
                    {klp.anggotaIds.map((id, idx) => {
                      const m = mhsMap.get(id);
                      if (!m) return null;
                      return (
                        <li
                          key={id}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">
                            {idx + 1}. {m.namaLengkap}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {m.gender}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

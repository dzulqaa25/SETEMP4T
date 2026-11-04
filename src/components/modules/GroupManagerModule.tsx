'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  HasilKelompokRandomizer,
  Kelompok,
  ModeRandomizer,
  RiwayatRandomisasi,
} from '@/types/database';
import { generateGroups } from '@/lib/randomizer';
import { Badge, Button, Card, Input, Select, Modal } from '@/components/ui';
import {
  Search,
  Crown,
  Shuffle,
  Copy,
  Save,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  X,
  ArrowRightLeft,
} from 'lucide-react';

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
    saveCourseKelompokBatch,
    currentUser,
    isAdmin,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'daftar' | 'acak'>('daftar');
  const [selectedMkId, setSelectedMkId] = useState<string>('mk-statistika');
  const [studentQuery, setStudentQuery] = useState<string>('');

  // Mode Edit -> Ubah -> Save pada Daftar Kelompok
  const [isEditingGroups, setIsEditingGroups] = useState<boolean>(false);
  const [draftCourseGroups, setDraftCourseGroups] = useState<Kelompok[]>([]);

  // State Edit / Tambah Kelompok Modal (beroperasi di atas draftCourseGroups)
  const [editingGroup, setEditingGroup] = useState<Kelompok | null>(null);
  const [isNewGroup, setIsNewGroup] = useState<boolean>(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');
  const [onlyUnassigned, setOnlyUnassigned] = useState<boolean>(true);

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

  const groupsForSelectedCourse = useMemo(
    () => kelompokList.filter((k) => k.mataKuliahId === selectedMkId),
    [kelompokList, selectedMkId]
  );

  const displayedCourseGroups = isEditingGroups
    ? draftCourseGroups
    : groupsForSelectedCourse;

  // Semua mahasiswa yang sudah punya kelompok di mata kuliah ini (mengikuti draft saat mode edit)
  const assignedStudentGroupMap = useMemo(() => {
    const map = new Map<string, Kelompok>();
    displayedCourseGroups.forEach((g) => {
      g.anggotaIds.forEach((id) => map.set(id, g));
    });
    return map;
  }, [displayedCourseGroups]);

  // Mahasiswa yang belum masuk kelompok manapun di mata kuliah ini
  const unassignedStudentsCount = useMemo(() => {
    return mahasiswaList.filter((m) => !assignedStudentGroupMap.has(m.id))
      .length;
  }, [mahasiswaList, assignedStudentGroupMap]);

  // Mulai Mode Edit Kelompok (Langkah 1: Klik Edit)
  const handleStartEditGroups = () => {
    if (!isAdmin) return;
    setDraftCourseGroups(
      groupsForSelectedCourse.map((g) => ({
        ...g,
        anggotaIds: [...g.anggotaIds],
      }))
    );
    setIsEditingGroups(true);
  };

  // Batal Mode Edit Kelompok
  const handleCancelEditGroups = () => {
    setEditingGroup(null);
    setDraftCourseGroups([]);
    setIsEditingGroups(false);
    showToast('Edit Dibatalkan', 'Perubahan kelompok tidak disimpan.', 'info');
  };

  // Simpan Semua Perubahan Kelompok (Langkah 3: Klik Save)
  const handleSaveAllGroups = () => {
    if (!isAdmin || !isEditingGroups) return;
    saveCourseKelompokBatch(selectedMkId, draftCourseGroups);
    setEditingGroup(null);
    setIsEditingGroups(false);
  };

  // Hapus kelompok di dalam draft
  const handleDeleteGroupInDraft = (groupId: string) => {
    if (!isEditingGroups) return;
    setDraftCourseGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

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

  // Buka Modal Tambah Kelompok Baru (di dalam mode Edit)
  const handleOpenNewGroup = () => {
    if (!isEditingGroups) {
      const initialDraft = groupsForSelectedCourse.map((g) => ({
        ...g,
        anggotaIds: [...g.anggotaIds],
      }));
      setDraftCourseGroups(initialDraft);
      setIsEditingGroups(true);
    }
    const baseList = isEditingGroups
      ? draftCourseGroups
      : groupsForSelectedCourse;
    const nextNumber = baseList.length + 1;
    setIsNewGroup(true);
    setMemberSearchQuery('');
    setEditingGroup({
      id: `klp-${selectedMkId}-${Date.now()}`,
      mataKuliahId: selectedMkId,
      namaKelompok: `Kelompok ${nextNumber}`,
      jenis: 'Tugas',
      ketuaId: '',
      anggotaIds: [],
      topikTugas: '',
      createdAt: new Date().toISOString(),
    });
  };

  // Buka Modal Edit Kelompok (di dalam mode Edit)
  const handleOpenEditGroup = (klp: Kelompok) => {
    if (!isEditingGroups) return;
    setIsNewGroup(false);
    setMemberSearchQuery('');
    setEditingGroup({
      ...klp,
      anggotaIds: [...klp.anggotaIds],
    });
  };

  // Terapkan perubahan kelompok dari modal ke draftCourseGroups
  const handleSaveEditingGroup = () => {
    if (!editingGroup) return;
    if (!editingGroup.namaKelompok.trim()) {
      showToast('Nama kelompok tidak boleh kosong', undefined, 'warning');
      return;
    }
    const finalKetua =
      editingGroup.ketuaId &&
      editingGroup.anggotaIds.includes(editingGroup.ketuaId)
        ? editingGroup.ketuaId
        : editingGroup.anggotaIds[0] || '';

    const updatedGroup: Kelompok = {
      ...editingGroup,
      namaKelompok: editingGroup.namaKelompok.trim(),
      ketuaId: finalKetua,
    };

    setDraftCourseGroups((prev) => {
      const exists = prev.some((item) => item.id === updatedGroup.id);
      if (exists) {
        return prev.map((item) =>
          item.id === updatedGroup.id ? updatedGroup : item
        );
      }
      return [...prev, updatedGroup];
    });
    setEditingGroup(null);
  };

  // Tambah anggota ke kelompok yang sedang diedit (di dalam draft)
  const handleAddMemberToEditing = (studentId: string) => {
    if (!editingGroup) return;
    if (editingGroup.anggotaIds.includes(studentId)) return;

    // Jika mahasiswa sebelumnya ada di kelompok lain pada mata kuliah yang sama di draft, keluarkan dari kelompok lama
    const oldGroup = assignedStudentGroupMap.get(studentId);
    if (oldGroup && oldGroup.id !== editingGroup.id) {
      const updatedOld: Kelompok = {
        ...oldGroup,
        anggotaIds: oldGroup.anggotaIds.filter((id) => id !== studentId),
        ketuaId:
          oldGroup.ketuaId === studentId
            ? oldGroup.anggotaIds.find((id) => id !== studentId) || ''
            : oldGroup.ketuaId,
      };
      setDraftCourseGroups((prev) =>
        prev.map((item) => (item.id === updatedOld.id ? updatedOld : item))
      );
    }

    const nextMembers = [...editingGroup.anggotaIds, studentId];
    setEditingGroup({
      ...editingGroup,
      anggotaIds: nextMembers,
      ketuaId: editingGroup.ketuaId || studentId,
    });
  };

  // Hapus anggota dari kelompok yang sedang diedit
  const handleRemoveMemberFromEditing = (studentId: string) => {
    if (!editingGroup) return;
    const nextMembers = editingGroup.anggotaIds.filter((id) => id !== studentId);
    setEditingGroup({
      ...editingGroup,
      anggotaIds: nextMembers,
      ketuaId:
        editingGroup.ketuaId === studentId
          ? nextMembers[0] || ''
          : editingGroup.ketuaId,
    });
  };

  // Pindahkan anggota langsung dari kelompok yang sedang diedit ke kelompok lain di dalam draft
  const handleMoveMemberToOtherGroup = (
    studentId: string,
    targetGroupId: string
  ) => {
    if (!editingGroup || !targetGroupId) return;
    const targetGroup = draftCourseGroups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    // 1. Hapus dari kelompok yang sedang diedit
    const nextMembers = editingGroup.anggotaIds.filter((id) => id !== studentId);
    const updatedCurrent: Kelompok = {
      ...editingGroup,
      anggotaIds: nextMembers,
      ketuaId:
        editingGroup.ketuaId === studentId
          ? nextMembers[0] || ''
          : editingGroup.ketuaId,
    };
    setEditingGroup(updatedCurrent);

    // 2. Perbarui draftCourseGroups (tambahkan ke target & update kelompok saat ini)
    setDraftCourseGroups((prev) =>
      prev.map((g) => {
        if (g.id === targetGroupId && !g.anggotaIds.includes(studentId)) {
          return {
            ...g,
            anggotaIds: [...g.anggotaIds, studentId],
            ketuaId: g.ketuaId || studentId,
          };
        }
        if (g.id === updatedCurrent.id) {
          return updatedCurrent;
        }
        return g;
      })
    );

    const mhs = mhsMap.get(studentId);
    showToast(
      'Anggota Dipindahkan (Draft)',
      `${mhs?.namaPanggilan || 'Mahasiswa'} dipindah ke ${targetGroup.namaKelompok}. Jangan lupa klik Simpan Perubahan.`
    );
  };

  // Daftar kandidat mahasiswa untuk ditambahkan di modal edit
  const candidateStudents = useMemo(() => {
    if (!editingGroup) return [];
    const q = memberSearchQuery.trim().toLowerCase();
    return mahasiswaList
      .filter((m) => !editingGroup.anggotaIds.includes(m.id))
      .filter((m) => {
        if (onlyUnassigned) {
          const existing = assignedStudentGroupMap.get(m.id);
          if (existing && existing.id !== editingGroup.id) return false;
        }
        if (!q) return true;
        return (
          m.namaLengkap.toLowerCase().includes(q) ||
          m.namaPanggilan.toLowerCase().includes(q) ||
          m.nim.toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [
    editingGroup,
    mahasiswaList,
    memberSearchQuery,
    onlyUnassigned,
    assignedStudentGroupMap,
  ]);

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

  // Pindahkan anggota antar kelompok di hasil acak (sebelum disimpan)
  const handleMoveInGenerated = (
    studentId: string,
    fromNomor: number,
    toNomor: number
  ) => {
    if (fromNomor === toNomor) return;
    setGeneratedGroups((prev) =>
      prev.map((g) => {
        if (g.nomorKelompok === fromNomor) {
          const nextIds = g.anggotaIds.filter((id) => id !== studentId);
          return {
            ...g,
            anggotaIds: nextIds,
            ketuaId: g.ketuaId === studentId ? nextIds[0] || '' : g.ketuaId,
          };
        }
        if (g.nomorKelompok === toNomor) {
          return {
            ...g,
            anggotaIds: [...g.anggotaIds, studentId],
          };
        }
        return g;
      })
    );
  };

  const handleSetKetuaInGenerated = (nomorKelompok: number, studentId: string) => {
    setGeneratedGroups((prev) =>
      prev.map((g) =>
        g.nomorKelompok === nomorKelompok ? { ...g, ketuaId: studentId } : g
      )
    );
  };

  const handleRenameInGenerated = (nomorKelompok: number, newName: string) => {
    setGeneratedGroups((prev) =>
      prev.map((g) =>
        g.nomorKelompok === nomorKelompok ? { ...g, namaKelompok: newName } : g
      )
    );
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
      targetAnggotaPerKelompok: Math.ceil(
        mahasiswaList.length / jumlahKelompok
      ),
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
        : displayedCourseGroups.map((g) => ({
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
      {/* Bar Atas: Pilih Tab, Edit / Simpan Kelompok & Copy */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-[#efe3d5] p-1 rounded-2xl border border-[#d8c4ae]">
          <button
            onClick={() => setTab('daftar')}
            className={`px-3.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
              tab === 'daftar' ? 'brown-shade-btn text-white' : 'text-[#4e2e1d]'
            }`}
          >
            Daftar Kelompok
          </button>
          <button
            onClick={() => {
              if (isEditingGroups) handleCancelEditGroups();
              setTab('acak');
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
              tab === 'acak' ? 'brown-shade-btn text-white' : 'text-[#4e2e1d]'
            }`}
          >
            Acak Kelompok
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tab === 'daftar' && isAdmin && (
            <>
              {!isEditingGroups ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartEditGroups}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>1. Edit Kelompok</span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewGroup}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#5c3724]" />
                    <span>Tambah Kelompok</span>
                  </Button>
                  {draftCourseGroups.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDraftCourseGroups([])}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Kosongkan Semua</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEditGroups}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAllGroups}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>3. Simpan Perubahan (Save)</span>
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-3.5 h-3.5 text-[#5c3724]" />
            <span>Salin Teks</span>
          </Button>
        </div>
      </div>

      {/* Pilihan Mata Kuliah */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {mataKuliahList.map((mk) => {
          const active = selectedMkId === mk.id;
          return (
            <button
              key={mk.id}
              onClick={() => {
                if (selectedMkId !== mk.id) {
                  setIsEditingGroups(false);
                  setEditingGroup(null);
                  setSelectedMkId(mk.id);
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs shrink-0 cursor-pointer border transition-colors ${
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
          {/* Panduan Langkah Edit -> Ubah -> Save untuk Admin */}
          {isAdmin && (
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                isEditingGroups
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-[#f6ece0] border-[#dfd0bf] text-[#5c3724]'
              }`}
            >
              <div>
                <span className="font-medium">Langkah Edit Kelompok:</span>{' '}
                <span>1. Klik &quot;Edit Kelompok&quot;</span> →{' '}
                <span>2. Ubah / Tambah / Hapus Kelompok &amp; Anggota</span> →{' '}
                <span>3. Klik &quot;Simpan Perubahan (Save)&quot;</span>
              </div>
              <span className="text-[11px] shrink-0 font-medium">
                {isEditingGroups
                  ? 'Mode Edit Aktif (Draft belum disimpan)'
                  : 'Mode Lihat (Terkunci)'}
              </span>
            </div>
          )}

          {/* Pencarian Cepat Mahasiswa & Info */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari nama atau NIM mahasiswa untuk cek kelompok..."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                className="pl-10 text-xs"
              />
            </div>
            {unassignedStudentsCount > 0 && (
              <div className="text-[11px] text-[#7a4b32] bg-[#f5ebe0] border border-[#dfd0bf] px-3 py-2 rounded-xl shrink-0">
                {unassignedStudentsCount} mahasiswa belum masuk kelompok di{' '}
                {mkMap.get(selectedMkId)?.nama}
              </div>
            )}
          </div>

          {matchedStudents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchedStudents.map(({ student, memberships }) => (
                <Card key={student.id} className="p-3.5 space-y-2">
                  <div className="text-xs text-[#2d180e]">
                    {student.namaLengkap}{' '}
                    <span className="font-mono text-stone-500">
                      ({student.nim})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {memberships.length === 0 ? (
                      <span className="text-[11px] text-stone-400">
                        Belum terdaftar di kelompok manapun
                      </span>
                    ) : (
                      memberships.map(({ kelompok, mataKuliah }) => (
                        <Badge key={kelompok.id} variant="ipb">
                          {mataKuliah?.nama}: {kelompok.namaKelompok}
                        </Badge>
                      ))
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Grid Kelompok */}
          {displayedCourseGroups.length === 0 ? (
            <Card className="p-6 text-center space-y-3">
              <div className="text-xs text-stone-600">
                Belum ada kelompok untuk mata kuliah ini.
              </div>
              {isAdmin && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setTab('acak')}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Acak Otomatis</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNewGroup}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Manual</span>
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedCourseGroups.map((klp) => (
                <Card
                  key={klp.id}
                  className={`p-4 space-y-2.5 flex flex-col ${
                    isEditingGroups ? 'ring-1 ring-amber-300/80' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2">
                    <div>
                      <div className="text-sm text-[#4e2e1d]">
                        {klp.namaKelompok}
                      </div>
                      {klp.topikTugas && (
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {klp.topikTugas}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="ipb">{klp.anggotaIds.length} Orang</Badge>
                      {isAdmin && isEditingGroups && (
                        <>
                          <button
                            onClick={() => handleOpenEditGroup(klp)}
                            title="Edit Kelompok"
                            className="p-1.5 rounded-lg text-[#5c3724] hover:bg-[#efe3d5] transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroupInDraft(klp.id)}
                            title="Hapus Kelompok dari Draft"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-1 text-xs flex-1">
                    {klp.anggotaIds.length === 0 ? (
                      <li className="text-stone-400 italic py-2 text-[11px]">
                        Belum ada anggota.
                      </li>
                    ) : (
                      klp.anggotaIds.map((mId, idx) => {
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
                                isKetua ? 'text-[#5c3724]' : 'text-stone-700'
                              }`}
                            >
                              {idx + 1}. {m.namaLengkap}
                            </span>
                            {isKetua && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                                <Crown className="w-3 h-3 text-amber-600" />
                                Ketua
                              </span>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>

                  {isAdmin && isEditingGroups && (
                    <div className="pt-2 border-t border-stone-100/80 flex justify-end">
                      <button
                        onClick={() => handleOpenEditGroup(klp)}
                        className="text-[11px] text-[#5c3724] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>2. Ubah Anggota / Kelompok</span>
                      </button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Tab Acak Kelompok (Randomizer + Bisa Diedit Sebelum Disimpan) */
        <div className="space-y-4">
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-stone-700 mb-1">
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
                <label className="block text-xs text-stone-700 mb-1">
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
                  <span>Simpan ke {mkMap.get(selectedMkId)?.nama}</span>
                </Button>
              )}
            </div>
          </Card>

          {generatedGroups.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-stone-600 px-1">
                Tip: Anda bisa mengganti nama kelompok, klik mahkota untuk pilih
                ketua, atau memindahkan anggota sebelum klik{' '}
                <span className="text-[#4e2e1d]">
                  Simpan ke {mkMap.get(selectedMkId)?.nama}
                </span>
                .
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {generatedGroups.map((klp) => (
                  <Card key={klp.nomorKelompok} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <input
                        type="text"
                        value={klp.namaKelompok}
                        onChange={(e) =>
                          handleRenameInGenerated(
                            klp.nomorKelompok,
                            e.target.value
                          )
                        }
                        className="text-sm text-[#4e2e1d] bg-transparent border-b border-transparent focus:border-[#935b3d] focus:outline-none w-full"
                      />
                      <Badge variant="ipb">{klp.anggotaIds.length} Orang</Badge>
                    </div>
                    <ul className="space-y-1.5 text-xs">
                      {klp.anggotaIds.map((id, idx) => {
                        const m = mhsMap.get(id);
                        if (!m) return null;
                        const isKetua = id === klp.ketuaId;
                        return (
                          <li
                            key={id}
                            className="flex items-center justify-between gap-1 py-0.5"
                          >
                            <span
                              className={`truncate ${
                                isKetua ? 'text-[#5c3724]' : 'text-stone-700'
                              }`}
                            >
                              {idx + 1}. {m.namaLengkap}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  handleSetKetuaInGenerated(
                                    klp.nomorKelompok,
                                    id
                                  )
                                }
                                title="Jadikan Ketua"
                                className={`p-1 rounded cursor-pointer ${
                                  isKetua
                                    ? 'text-amber-600 bg-amber-50'
                                    : 'text-stone-300 hover:text-amber-600'
                                }`}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                              <select
                                value={klp.nomorKelompok}
                                onChange={(e) =>
                                  handleMoveInGenerated(
                                    id,
                                    klp.nomorKelompok,
                                    Number(e.target.value)
                                  )
                                }
                                title="Pindah ke kelompok lain"
                                className="text-[10px] bg-[#f8f1e9] border border-[#dfd0bf] rounded px-1 py-0.5 text-stone-700 cursor-pointer"
                              >
                                {generatedGroups.map((opt) => (
                                  <option
                                    key={opt.nomorKelompok}
                                    value={opt.nomorKelompok}
                                  >
                                    Klp {opt.nomorKelompok}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Edit / Tambah Kelompok */}
      <Modal
        isOpen={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title={
          isNewGroup
            ? `Tambah Kelompok — ${mkMap.get(selectedMkId)?.nama || ''}`
            : `Edit ${editingGroup?.namaKelompok || 'Kelompok'}`
        }
        maxWidth="max-w-2xl"
      >
        {editingGroup && (
          <div className="space-y-4">
            {/* Nama Kelompok & Topik Tugas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-600 mb-1">
                  Nama Kelompok
                </label>
                <Input
                  value={editingGroup.namaKelompok}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      namaKelompok: e.target.value,
                    })
                  }
                  placeholder="Contoh: Kelompok 1"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-600 mb-1">
                  Topik / Catatan Tugas (Opsional)
                </label>
                <Input
                  value={editingGroup.topikTugas || ''}
                  onChange={(e) =>
                    setEditingGroup({
                      ...editingGroup,
                      topikTugas: e.target.value,
                    })
                  }
                  placeholder="Contoh: Bab 3 Regresi Linier"
                />
              </div>
            </div>

            {/* Daftar Anggota Saat Ini */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#4e2e1d]">
                  Anggota Kelompok ({editingGroup.anggotaIds.length} Orang)
                </label>
                <span className="text-[11px] text-stone-500">
                  Klik ikon mahkota untuk memilih Ketua
                </span>
              </div>

              {editingGroup.anggotaIds.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#faf4ed] border border-[#e6d7c6] text-center text-xs text-stone-500">
                  Belum ada anggota di kelompok ini. Tambahkan mahasiswa dari
                  daftar di bawah.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {editingGroup.anggotaIds.map((mId, idx) => {
                    const m = mhsMap.get(mId);
                    if (!m) return null;
                    const isKetua = editingGroup.ketuaId === mId;
                    const otherGroups = displayedCourseGroups.filter(
                      (g) => g.id !== editingGroup.id
                    );

                    return (
                      <div
                        key={mId}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#faf4ed] border border-[#e5d5c3]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-[#2d180e] truncate flex items-center gap-1.5">
                            <span>
                              {idx + 1}. {m.namaLengkap}
                            </span>
                            {isKetua && (
                              <Badge variant="warning">Ketua</Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {m.nim}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Tombol Jadikan Ketua */}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingGroup({
                                ...editingGroup,
                                ketuaId: mId,
                              })
                            }
                            title="Jadikan Ketua Kelompok"
                            className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isKetua
                                ? 'bg-amber-100 border-amber-300 text-amber-800'
                                : 'bg-white border-stone-200 text-stone-400 hover:text-amber-600'
                            }`}
                          >
                            <Crown className="w-3.5 h-3.5" />
                          </button>

                          {/* Pindah langsung ke kelompok lain */}
                          {otherGroups.length > 0 && (
                            <div className="relative flex items-center">
                              <ArrowRightLeft className="w-3 h-3 text-stone-400 absolute left-2 pointer-events-none" />
                              <select
                                value=""
                                onChange={(e) =>
                                  handleMoveMemberToOtherGroup(
                                    mId,
                                    e.target.value
                                  )
                                }
                                className="pl-6 pr-2 py-1 text-[11px] rounded-lg bg-white border border-stone-200 text-stone-700 cursor-pointer"
                              >
                                <option value="">Pindah ke...</option>
                                {otherGroups.map((og) => (
                                  <option key={og.id} value={og.id}>
                                    {og.namaKelompok}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Hapus dari kelompok */}
                          <button
                            type="button"
                            onClick={() => handleRemoveMemberFromEditing(mId)}
                            title="Keluarkan dari kelompok"
                            className="p-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tambah Mahasiswa ke Kelompok */}
            <div className="space-y-2 pt-2 border-t border-[#e5d5c3]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs text-[#4e2e1d] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Anggota Mahasiswa</span>
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyUnassigned}
                    onChange={(e) => setOnlyUnassigned(e.target.checked)}
                    className="rounded border-stone-300 accent-[#5c3724]"
                  />
                  <span>Hanya yang belum punya kelompok</span>
                </label>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Ketik nama atau NIM mahasiswa yang ingin ditambahkan..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pt-1">
                {candidateStudents.length === 0 ? (
                  <div className="col-span-2 text-center py-3 text-xs text-stone-400">
                    Tidak ada mahasiswa yang cocok (coba matikan centang
                    &quot;Hanya yang belum punya kelompok&quot;).
                  </div>
                ) : (
                  candidateStudents.map((m) => {
                    const existingGroup = assignedStudentGroupMap.get(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleAddMemberToEditing(m.id)}
                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white hover:bg-[#f5ebe0] border border-[#dfd0bf] text-left transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="text-xs text-[#2d180e] truncate">
                            {m.namaLengkap}
                          </div>
                          <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
                            <span className="font-mono">{m.nim}</span>
                            {existingGroup &&
                              existingGroup.id !== editingGroup.id && (
                                <span className="text-amber-700 bg-amber-50 px-1.5 rounded">
                                  di {existingGroup.namaKelompok}
                                </span>
                              )}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#5c3724] bg-[#efe3d5] px-2 py-1 rounded-lg shrink-0">
                          <Plus className="w-3 h-3" />
                          Tambah
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#e5d5c3]">
              <span className="text-[11px] text-stone-500">
                Setelah selesai mengubah kelompok, klik tombol{' '}
                <b className="text-[#4e2e1d]">3. Simpan Perubahan (Save)</b> di
                atas daftar.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingGroup(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEditingGroup}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Terapkan Perubahan</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

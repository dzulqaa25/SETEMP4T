'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  FakultasIPB,
  Mahasiswa,
  MataKuliah,
  UserRole,
} from '@/types/database';
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
} from '@/components/ui';
import {
  UserPlus,
  Pencil,
  Trash2,
  Search,
  KeyRound,
  Plus,
  RotateCcw,
} from 'lucide-react';

const FAKULTAS_OPTIONS: FakultasIPB[] = [
  'Fakultas Pertanian',
  'Fakultas Perikanan dan Ilmu Kelautan',
  'Fakultas Matematika dan Ilmu Pengetahuan Alam',
  'Fakultas Kedokteran Hewan',
  'Fakultas Peternakan',
  'Fakultas Kehutanan dan Lingkungan',
  'Fakultas Teknologi Pertanian',
  'Fakultas Ekonomi dan Manajemen',
  'Fakultas Ekologi Manusia',
  'Sekolah Bisnis',
];

export function AdminPanelModule() {
  const {
    isAdmin,
    unlockAdminWithKey,
    lockAdmin,
    mahasiswaList,
    addMahasiswa,
    updateMahasiswa,
    deleteMahasiswa,
    mataKuliahList,
    addMataKuliah,
    deleteMataKuliah,
    resetToDefaultSeed,
  } = useApp();

  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [activeTab, setActiveTab] = useState<'mahasiswa' | 'matakuliah'>(
    'mahasiswa'
  );
  const [searchMhs, setSearchMhs] = useState('');

  // Modal Tambah/Edit Mahasiswa
  const [openMhsModal, setOpenMhsModal] = useState(false);
  const [editingMhs, setEditingMhs] = useState<Mahasiswa | null>(null);
  const [nim, setNim] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [fakultas, setFakultas] = useState<FakultasIPB>('Fakultas Pertanian');
  const [programStudi, setProgramStudi] = useState('Agronomi dan Hortikultura');
  const [role, setRole] = useState<UserRole>('mahasiswa');

  // Modal Tambah Mata Kuliah
  const [openMkModal, setOpenMkModal] = useState(false);
  const [mkKode, setMkKode] = useState('');
  const [mkNama, setMkNama] = useState('');
  const [mkSks, setMkSks] = useState('3');
  const [mkHari, setMkHari] = useState<MataKuliah['hariKuliah']>('Senin');
  const [mkJam, setMkJam] = useState('08:00 - 09:40');
  const [mkRuang, setMkRuang] = useState('RK. CCR 1.04');

  const filteredMhs = useMemo(() => {
    const q = searchMhs.trim().toLowerCase();
    if (!q) return mahasiswaList;
    return mahasiswaList.filter(
      (m) =>
        m.namaLengkap.toLowerCase().includes(q) ||
        m.nim.toLowerCase().includes(q) ||
        m.programStudi.toLowerCase().includes(q)
    );
  }, [mahasiswaList, searchMhs]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdminWithKey(accessKeyInput)) {
      setAccessKeyInput('');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto my-10">
        <Card className="p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#f5ebe1] text-[#5c3724] flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#2d180e]">
              Akses Admin SETEMP4T
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Masukkan Access Key untuk membuka pengelolaan kelas.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <Input
              type="password"
              required
              placeholder="Masukkan Access Key..."
              value={accessKeyInput}
              onChange={(e) => setAccessKeyInput(e.target.value)}
              className="text-center"
            />
            <Button type="submit" variant="primary" size="md" className="w-full">
              Buka Akses Admin
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const handleOpenAddMhs = () => {
    setEditingMhs(null);
    setNim(`A2401261${String(mahasiswaList.length + 1).padStart(3, '0')}`);
    setNamaLengkap('');
    setGender('L');
    setFakultas('Fakultas Pertanian');
    setProgramStudi('Agronomi dan Hortikultura');
    setRole('mahasiswa');
    setOpenMhsModal(true);
  };

  const handleOpenEditMhs = (m: Mahasiswa) => {
    setEditingMhs(m);
    setNim(m.nim);
    setNamaLengkap(m.namaLengkap);
    setGender(m.gender);
    setFakultas(m.fakultas);
    setProgramStudi(m.programStudi);
    setRole(m.role);
    setOpenMhsModal(true);
  };

  const handleSaveMahasiswa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim() || !nim.trim()) return;
    const panggilan = namaLengkap.trim().split(' ')[0];

    if (editingMhs) {
      updateMahasiswa({
        ...editingMhs,
        nim: nim.trim().toUpperCase(),
        namaLengkap: namaLengkap.trim(),
        namaPanggilan: panggilan,
        gender,
        fakultas,
        programStudi: programStudi.trim(),
        role,
      });
    } else {
      const slug = namaLengkap
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 12);
      addMahasiswa({
        nim: nim.trim().toUpperCase(),
        namaLengkap: namaLengkap.trim(),
        namaPanggilan: panggilan,
        fotoUrl: '',
        gender,
        fakultas,
        programStudi: programStudi.trim(),
        kelas: 'ST04',
        domisili: 'Asrama PKU IPB Dramaga, Bogor',
        asalDaerah: 'Indonesia',
        email: `${slug}@apps.ipb.ac.id`,
        whatsapp: '-',
        instagram: `@${slug}`,
        linkedin: '-',
        tentangSaya: {
          mottoHidup: 'SETEMP4T ST04',
          hobi: [],
          minat: [],
          keahlian: [],
          prestasi: [],
        },
        role,
        statusAktif: true,
        aktivitasKelas: [],
      });
    }
    setOpenMhsModal(false);
  };

  const handleSaveMataKuliah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mkKode.trim() || !mkNama.trim()) return;
    addMataKuliah({
      kode: mkKode.trim().toUpperCase(),
      nama: mkNama.trim(),
      sks: Number(mkSks) || 3,
      semester: 1,
      dosenKoordinator: 'Tim Dosen Pengampu IPB',
      hariKuliah: mkHari,
      jamKuliah: mkJam,
      ruangan: mkRuang,
      warnaLabel: 'brown',
      isActive: true,
    });
    setMkKode('');
    setMkNama('');
    setOpenMkModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Bar Kontrol Admin */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-[#efe3d5] p-1 rounded-2xl border border-[#d8c4ae]">
          <button
            onClick={() => setActiveTab('mahasiswa')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'mahasiswa'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Mahasiswa ({mahasiswaList.length})
          </button>
          <button
            onClick={() => setActiveTab('matakuliah')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
              activeTab === 'matakuliah'
                ? 'brown-shade-btn text-white'
                : 'text-[#4e2e1d]'
            }`}
          >
            Mata Kuliah ({mataKuliahList.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'mahasiswa' ? (
            <Button variant="primary" size="sm" onClick={handleOpenAddMhs}>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setOpenMkModal(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah MK</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaultSeed}
            title="Reset Data Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={lockAdmin}>
            Kunci Admin
          </Button>
        </div>
      </div>

      {activeTab === 'mahasiswa' ? (
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Cari nama atau NIM..."
              value={searchMhs}
              onChange={(e) => setSearchMhs(e.target.value)}
              className="pl-8 py-1.5 text-xs"
            />
          </div>

          <div className="divide-y divide-stone-200/70 max-h-[520px] overflow-y-auto">
            {filteredMhs.map((m) => (
              <div
                key={m.id}
                className="py-2.5 px-1 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-[#2d180e] truncate">
                    {m.namaLengkap}{' '}
                    {m.role !== 'mahasiswa' && (
                      <Badge variant="ipb" className="ml-1 text-[10px]">
                        {m.role.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-500 truncate">
                    <span className="font-mono">{m.nim}</span> • {m.programStudi}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditMhs(m)}
                    className="p-1.5 rounded-lg text-stone-500 hover:bg-[#f5ebe1] cursor-pointer"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMahasiswa(m.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mataKuliahList.map((mk) => (
            <Card
              key={mk.id}
              className="p-4 flex items-center justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="ipb">{mk.kode}</Badge>
                  <span className="text-xs font-extrabold text-[#2d180e]">
                    {mk.nama}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 mt-1">
                  {mk.hariKuliah}, {mk.jamKuliah} • {mk.ruangan}
                </div>
              </div>
              <button
                onClick={() => deleteMataKuliah(mk.id)}
                className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Mahasiswa */}
      <Modal
        isOpen={openMhsModal}
        onClose={() => setOpenMhsModal(false)}
        title={editingMhs ? 'Edit Mahasiswa' : 'Tambah Mahasiswa'}
      >
        <form onSubmit={handleSaveMahasiswa} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                NIM
              </label>
              <Input
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Gender
              </label>
              <Select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Nama Lengkap
            </label>
            <Input
              required
              value={namaLengkap}
              onChange={(e) => setNamaLengkap(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Fakultas
            </label>
            <Select
              value={fakultas}
              onChange={(e) => setFakultas(e.target.value as FakultasIPB)}
            >
              {FAKULTAS_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Program Studi
              </label>
              <Input
                required
                value={programStudi}
                onChange={(e) => setProgramStudi(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Jabatan Kelas
              </label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="komti">Komti</option>
                <option value="wakomti">Wakomti</option>
                <option value="bendahara">Bendahara</option>
                <option value="sekretaris">Sekretaris</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenMhsModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Mata Kuliah */}
      <Modal
        isOpen={openMkModal}
        onClose={() => setOpenMkModal(false)}
        title="Tambah Mata Kuliah"
      >
        <form onSubmit={handleSaveMataKuliah} className="space-y-3.5">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Kode
              </label>
              <Input
                required
                placeholder="STA2111"
                value={mkKode}
                onChange={(e) => setMkKode(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Mata Kuliah
              </label>
              <Input
                required
                value={mkNama}
                onChange={(e) => setMkNama(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Hari
              </label>
              <Select
                value={mkHari}
                onChange={(e) =>
                  setMkHari(e.target.value as MataKuliah['hariKuliah'])
                }
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Jam
              </label>
              <Input
                value={mkJam}
                onChange={(e) => setMkJam(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Ruangan
              </label>
              <Input
                value={mkRuang}
                onChange={(e) => setMkRuang(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenMkModal(false)}
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

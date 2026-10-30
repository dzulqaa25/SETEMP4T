'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { KategoriPengumuman, PrioritasPengumuman } from '@/types/database';
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Textarea,
} from '@/components/ui';
import { formatTanggalIndo } from '@/lib/utils';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  ClipboardList,
  Megaphone,
  CalendarDays,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Camera,
  ImagePlus,
} from 'lucide-react';

const HARI_LIST = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;

interface SlideFoto {
  id: string;
  judul: string;
  keterangan: string;
  imageUrl: string;
}

const PHOTO_SLIDER_STORAGE_KEY = 'setemp4t_gallery_slides_v1';

const INITIAL_SLIDES: SlideFoto[] = [
  {
    id: 'slide-1',
    judul: 'Foto Bersama Keluarga Besar SETEMP4T (ST04)',
    keterangan: 'Dokumentasi kebersamaan kelas ST04 di Gedung CCR IPB Dramaga',
    imageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'slide-2',
    judul: 'Momen Kuliah & Responsi Semester 1',
    keterangan: 'Suasana belajar bareng dan diskusi kelompok SETEMP4T',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'slide-3',
    judul: 'Praktikum Biologi Dasar di Lab Biologi',
    keterangan: 'Kegiatan praktikum BIO2102 (P7) hari Rabu bersama rekan ST04',
    imageUrl:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'slide-4',
    judul: 'Tongkrongan & Kebersamaan SETEMP4T',
    keterangan: 'Slot foto bersama acara angkatan dan kumpul kelas ST04 berikutnya',
    imageUrl:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
  },
];

export function DashboardModule() {
  const {
    currentUser,
    mataKuliahList,
    pengumumanList,
    jadwalList,
    addJadwal,
    deleteJadwal,
    addPengumuman,
    deletePengumuman,
    isAdmin,
    showToast,
  } = useApp();

  const [activeView, setActiveView] = useState<
    'jadwal' | 'tugas' | 'pengumuman'
  >('jadwal');
  const [selectedHari, setSelectedHari] =
    useState<(typeof HARI_LIST)[number]>('Semua');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // State Slide Foto Bersama
  const [slides, setSlides] = useState<SlideFoto[]>(INITIAL_SLIDES);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [openPhotoModal, setOpenPhotoModal] = useState(false);
  const [photoJudul, setPhotoJudul] = useState('');
  const [photoKet, setPhotoKet] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // Muat slide foto dari localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHOTO_SLIDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      }
    } catch {}
  }, []);

  // Auto-play slide setiap 4.5 detik
  useEffect(() => {
    if (isPaused || activeView !== 'jadwal' || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, activeView, slides.length]);

  const saveSlidesToStorage = (nextSlides: SlideFoto[]) => {
    setSlides(nextSlides);
    try {
      localStorage.setItem(
        PHOTO_SLIDER_STORAGE_KEY,
        JSON.stringify(nextSlides)
      );
    } catch {}
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;
    const newSlide: SlideFoto = {
      id: `slide-${Date.now()}`,
      judul: photoJudul.trim() || 'Foto Bersama SETEMP4T',
      keterangan: photoKet.trim() || 'Momen kebersamaan kelas ST04',
      imageUrl: photoUrl.trim(),
    };
    const next = [newSlide, ...slides];
    saveSlidesToStorage(next);
    setCurrentSlide(0);
    setPhotoJudul('');
    setPhotoKet('');
    setPhotoUrl('');
    setOpenPhotoModal(false);
    showToast('Foto Berhasil Ditambahkan ke Slide');
  };

  const handleDeleteCurrentSlide = () => {
    if (slides.length <= 1) return;
    const target = slides[currentSlide];
    const next = slides.filter((s) => s.id !== target.id);
    saveSlidesToStorage(next);
    setCurrentSlide(0);
    showToast('Foto Dihapus dari Slide', undefined, 'info');
  };

  // Modal Tambah Tugas
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [taskJudul, setTaskJudul] = useState('');
  const [taskDeskripsi, setTaskDeskripsi] = useState('');
  const [taskMkId, setTaskMkId] = useState('mk-statistika');
  const [taskTanggal, setTaskTanggal] = useState('2026-10-30');
  const [taskHari, setTaskHari] = useState<
    'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu'
  >('Jumat');
  const [taskWaktu, setTaskWaktu] = useState('23:59');
  const [taskLokasi, setTaskLokasi] = useState('LMS IPB');

  // Modal Tambah Pengumuman
  const [openPengModal, setOpenPengModal] = useState(false);
  const [pengJudul, setPengJudul] = useState('');
  const [pengIsi, setPengIsi] = useState('');
  const [pengKategori, setPengKategori] =
    useState<KategoriPengumuman>('Akademik');
  const [pengPrioritas, setPengPrioritas] =
    useState<PrioritasPengumuman>('Tinggi');

  const mkMap = useMemo(
    () => new Map(mataKuliahList.map((m) => [m.id, m])),
    [mataKuliahList]
  );

  const tasks = useMemo(
    () =>
      jadwalList
        .filter((j) => j.jenis === 'Deadline tugas')
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal)),
    [jadwalList]
  );

  const pendingTaskCount = useMemo(
    () => tasks.filter((t) => !completedTaskIds.includes(t.id)).length,
    [tasks, completedTaskIds]
  );

  const jadwalKuliah = useMemo(
    () =>
      jadwalList.filter(
        (j) =>
          (j.jenis === 'Jadwal kuliah' || j.jenis === 'Praktikum') &&
          (selectedHari === 'Semua' || j.hari === selectedHari)
      ),
    [jadwalList, selectedHari]
  );

  const toggleTask = (id: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskJudul.trim()) return;
    addJadwal({
      judul: taskJudul.trim(),
      deskripsi: taskDeskripsi.trim(),
      jenis: 'Deadline tugas',
      mataKuliahId: taskMkId,
      tanggal: taskTanggal,
      hari: taskHari,
      waktuMulai: taskWaktu,
      waktuSelesai: taskWaktu,
      lokasi: taskLokasi.trim(),
    });
    setTaskJudul('');
    setTaskDeskripsi('');
    setOpenTaskModal(false);
  };

  const handleSavePengumuman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengJudul.trim() || !pengIsi.trim()) return;
    addPengumuman({
      judul: pengJudul.trim(),
      isi: pengIsi.trim(),
      tanggal: new Date().toISOString().slice(0, 10),
      kategori: pengKategori,
      prioritas: pengPrioritas,
      lampiran: [],
      penulisId: currentUser.id,
      penulisNama: currentUser.namaPanggilan,
      penulisRole: currentUser.role,
    });
    setPengJudul('');
    setPengIsi('');
    setOpenPengModal(false);
  };

  const activeSlideItem = slides[currentSlide] || slides[0];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          TAMPILAN 1 (DEFAULT): SLIDE FOTO BERSAMA + TOMBOL + JADWAL KULIAH
         ===================================================================== */}
      {activeView === 'jadwal' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SLIDE GAMBAR FOTO BERSAMA SETEMP4T */}
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="relative rounded-3xl overflow-hidden border border-[#d6c2ac] shadow-lg bg-[#2d180e] h-52 sm:h-64 md:h-72 group select-none"
          >
            {/* Gambar Slide dengan Animasi Zoom Halus */}
            <img
              key={activeSlideItem.id}
              src={activeSlideItem.imageUrl}
              alt={activeSlideItem.judul}
              className="w-full h-full object-cover object-center transition-all duration-700 scale-100 group-hover:scale-105 opacity-85 animate-fadeIn"
            />

            {/* Gradasi Coklat Gelap di Bawah untuk Teks */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1f1008]/90 via-[#2d180e]/35 to-transparent" />

            {/* Badge Kiri Atas & Tombol Tambah Foto */}
            <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs border border-amber-200/25 text-amber-100 text-xs">
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Galeri Foto Bersama SETEMP4T</span>
              </div>

              <div className="flex items-center gap-1.5">
                {isAdmin && slides.length > 1 && (
                  <button
                    onClick={handleDeleteCurrentSlide}
                    className="p-1.5 rounded-full bg-black/45 hover:bg-rose-600/80 text-white border border-white/20 transition-colors cursor-pointer"
                    title="Hapus Foto Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setOpenPhotoModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 hover:bg-white text-[#3b2216] text-xs transition-all cursor-pointer shadow-xs"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#5c3724]" />
                  <span>Tambah Foto</span>
                </button>
              </div>
            </div>

            {/* Tombol Panah Kiri & Kanan */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentSlide(
                      (prev) => (prev - 1 + slides.length) % slides.length
                    )
                  }
                  aria-label="Foto Sebelumnya"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % slides.length)
                  }
                  aria-label="Foto Berikutnya"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Caption & Indikator Titik di Bawah */}
            <div className="absolute bottom-3.5 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
              <div>
                <h2 className="text-sm sm:text-base font-medium leading-snug">
                  {activeSlideItem.judul}
                </h2>
                <p className="text-xs text-amber-100/80 mt-0.5">
                  {activeSlideItem.keterangan}
                </p>
              </div>

              {/* Dots Indicator */}
              <div className="flex items-center gap-1.5 shrink-0">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentSlide
                        ? 'w-6 bg-amber-300'
                        : 'w-2 bg-white/45 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 2 Tombol Utama Akses Cepat ke Tugas & Pengumuman */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Button 1: Buka Tugas & Deadline */}
            <button
              onClick={() => setActiveView('tugas')}
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left hero-mesh text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 animate-float">
                  <ClipboardList className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium tracking-tight">
                      Tugas & Deadline
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-300 text-[#2d180e]">
                      {pendingTaskCount} Aktif
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/80 mt-0.5">
                    Klik untuk melihat daftar tugas berjalan
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-200 transition-transform duration-200 group-hover:translate-x-1.5 shrink-0" />
            </button>

            {/* Button 2: Buka Pengumuman Kelas */}
            <button
              onClick={() => setActiveView('pengumuman')}
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 text-left card-elevated bg-gradient-to-br from-[#fffdf9] to-[#f4e8da] transition-all duration-300 hover:-translate-y-1 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl brown-shade-btn text-white flex items-center justify-center shrink-0 animate-float">
                  <Megaphone className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-medium text-[#2d180e] tracking-tight">
                      Pengumuman Kelas
                    </span>
                    <Badge variant="ipb">{pengumumanList.length} Info</Badge>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Klik untuk membaca informasi terbaru ST04
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5c3724] transition-transform duration-200 group-hover:translate-x-1.5 shrink-0" />
            </button>
          </div>

          {/* Bagian Utama: Jadwal Mata Kuliah ST04 */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl brown-shade-btn text-white flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h1 className="text-base sm:text-lg font-medium text-[#2d180e] tracking-tight">
                  Jadwal Mata Kuliah ST04
                </h1>
              </div>

              {/* Filter Pill Hari */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-[#e9dac9] p-1 rounded-2xl border border-[#d6c2ac]">
                {HARI_LIST.map((h) => {
                  const active = selectedHari === h;
                  return (
                    <button
                      key={h}
                      onClick={() => setSelectedHari(h)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 cursor-pointer shrink-0 ${
                        active
                          ? 'brown-shade-btn text-white scale-[1.03]'
                          : 'text-[#4e2e1d] hover:bg-white/60'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Kartu Jadwal Mata Kuliah Beranimasi Stagger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {jadwalKuliah.map((jdw, idx) => {
                const staggerClass = `stagger-${(idx % 6) + 1}`;
                const isResponsi = jdw.jenis === 'Praktikum';
                return (
                  <Card
                    key={`${jdw.id}-${selectedHari}`}
                    className={`p-4 flex items-center justify-between gap-3 animate-fadeIn ${staggerClass} relative overflow-hidden`}
                  >
                    <div
                      className={`absolute left-0 inset-y-0 w-1.5 ${
                        isResponsi
                          ? 'bg-gradient-to-b from-amber-500 to-orange-600'
                          : 'bg-gradient-to-b from-[#3b2216] to-[#8b5a2b]'
                      }`}
                    />

                    <div className="pl-2.5 space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="ipb">{jdw.hari}</Badge>
                        <span className="text-xs text-[#6e422b] inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {jdw.waktuMulai} – {jdw.waktuSelesai} WIB
                        </span>
                        {isResponsi && (
                          <Badge variant="warning">
                            {jdw.judul.includes('(P') ? 'Praktikum' : 'Responsi'}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-medium text-[#2d180e] truncate">
                        {jdw.judul}
                      </h3>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#f5ebe1] border border-[#d8be9f] text-xs text-[#4e2e1d]">
                        <MapPin className="w-3.5 h-3.5 text-[#5c3724]" />
                        <span>{jdw.lokasi}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAMPILAN 2: HALAMAN TUGAS & DEADLINE (SAAT TOMBOL TUGAS DIKLIK)
         ===================================================================== */}
      {activeView === 'tugas' && (
        <div className="space-y-4 animate-sheet">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setActiveView('jadwal')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fffcf8] border border-[#dfd0bf] hover:bg-[#f5ebe1] text-xs text-[#3b2216] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#5c3724]" />
              <span>Kembali ke Jadwal Kuliah</span>
            </button>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setOpenTaskModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tugas</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 px-1">
            <ClipboardList className="w-5 h-5 text-[#5c3724]" />
            <h2 className="text-base sm:text-lg font-medium text-[#2d180e]">
              Daftar Tugas & Deadline ({tasks.length})
            </h2>
          </div>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center text-xs text-stone-500">
              Belum ada tugas yang sedang berjalan.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tasks.map((t, idx) => {
                const done = completedTaskIds.includes(t.id);
                const mk = t.mataKuliahId
                  ? mkMap.get(t.mataKuliahId)
                  : undefined;
                return (
                  <Card
                    key={t.id}
                    className={`p-4 flex flex-col justify-between gap-3 animate-fadeIn stagger-${
                      (idx % 6) + 1
                    } ${done ? 'opacity-60 bg-stone-50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {mk && <Badge variant="ipb">{mk.nama}</Badge>}
                          <span className="text-[11px] text-rose-700 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {t.hari}, {formatTanggalIndo(t.tanggal)} •{' '}
                            {t.waktuMulai}
                          </span>
                        </div>
                        <h3
                          className={`text-sm font-medium text-[#2d180e] ${
                            done ? 'line-through' : ''
                          }`}
                        >
                          {t.judul}
                        </h3>
                        {t.deskripsi && (
                          <p className="text-xs text-stone-600">
                            {t.deskripsi}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleTask(t.id)}
                          className="p-1 text-stone-400 hover:text-[#5c3724] transition-transform hover:scale-110 cursor-pointer"
                          title={done ? 'Tandai belum selesai' : 'Selesai'}
                        >
                          {done ? (
                            <CheckCircle2 className="w-5 h-5 text-[#5c3724]" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => deleteJadwal(t.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer"
                            title="Hapus Tugas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-2 border-t border-stone-100">
                      <MapPin className="w-3 h-3 text-[#6e422b]" />
                      <span className="truncate">{t.lokasi}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAMPILAN 3: HALAMAN PENGUMUMAN (SAAT TOMBOL PENGUMUMAN DIKLIK)
         ===================================================================== */}
      {activeView === 'pengumuman' && (
        <div className="space-y-4 animate-sheet">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => setActiveView('jadwal')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fffcf8] border border-[#dfd0bf] hover:bg-[#f5ebe1] text-xs text-[#3b2216] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#5c3724]" />
              <span>Kembali ke Jadwal Kuliah</span>
            </button>

            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setOpenPengModal(true)}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengumuman</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 px-1">
            <Megaphone className="w-5 h-5 text-[#5c3724]" />
            <h2 className="text-base sm:text-lg font-medium text-[#2d180e]">
              Pengumuman Kelas ({pengumumanList.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pengumumanList.map((p, idx) => (
              <Card
                key={p.id}
                className={`p-4 space-y-2 animate-fadeIn stagger-${
                  (idx % 6) + 1
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        p.kategori === 'Akademik'
                          ? 'ipb'
                          : p.kategori === 'Keuangan'
                          ? 'warning'
                          : 'info'
                      }
                    >
                      {p.kategori}
                    </Badge>
                    <span className="text-[11px] text-stone-400">
                      {formatTanggalIndo(p.tanggal)}
                    </span>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => deletePengumuman(p.id)}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-medium text-[#2d180e]">
                  {p.judul}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">{p.isi}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tambah Foto Bersama ke Slide */}
      <Modal
        isOpen={openPhotoModal}
        onClose={() => setOpenPhotoModal(false)}
        title="Tambah Foto Bersama SETEMP4T"
      >
        <form onSubmit={handleAddSlide} className="space-y-3.5">
          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Pilih Foto dari Perangkat (HP / Laptop)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-[#f5ebe1] file:text-[#4e2e1d] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Atau Tempel Link URL Gambar
            </label>
            <Input
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Judul Momen / Foto
            </label>
            <Input
              placeholder="Contoh: Foto Bersama seusai Kuliah Biologi"
              value={photoJudul}
              onChange={(e) => setPhotoJudul(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Keterangan Singkat
            </label>
            <Input
              placeholder="Contoh: Gedung CCR IPB Dramaga"
              value={photoKet}
              onChange={(e) => setPhotoKet(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPhotoModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={!photoUrl.trim()}>
              Simpan ke Slide
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Tugas */}
      <Modal
        isOpen={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        title="Tambah Tugas Baru"
      >
        <form onSubmit={handleSaveTask} className="space-y-3.5">
          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Judul Tugas
            </label>
            <Input
              required
              placeholder="Contoh: Latihan Soal Statistika"
              value={taskJudul}
              onChange={(e) => setTaskJudul(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Mata Kuliah
              </label>
              <Select
                value={taskMkId}
                onChange={(e) => setTaskMkId(e.target.value)}
              >
                {mataKuliahList.map((mk) => (
                  <option key={mk.id} value={mk.id}>
                    {mk.nama}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Tanggal Deadline
              </label>
              <Input
                type="date"
                required
                value={taskTanggal}
                onChange={(e) => setTaskTanggal(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Hari
              </label>
              <Select
                value={taskHari}
                onChange={(e) =>
                  setTaskHari(e.target.value as typeof taskHari)
                }
              >
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Jam
              </label>
              <Input
                type="time"
                value={taskWaktu}
                onChange={(e) => setTaskWaktu(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Tempat Pengumpulan
            </label>
            <Input
              required
              value={taskLokasi}
              onChange={(e) => setTaskLokasi(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Keterangan Singkat
            </label>
            <Textarea
              rows={2}
              value={taskDeskripsi}
              onChange={(e) => setTaskDeskripsi(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenTaskModal(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Tambah Pengumuman */}
      <Modal
        isOpen={openPengModal}
        onClose={() => setOpenPengModal(false)}
        title="Tambah Pengumuman"
      >
        <form onSubmit={handleSavePengumuman} className="space-y-3.5">
          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Judul
            </label>
            <Input
              required
              value={pengJudul}
              onChange={(e) => setPengJudul(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Kategori
              </label>
              <Select
                value={pengKategori}
                onChange={(e) =>
                  setPengKategori(e.target.value as KategoriPengumuman)
                }
              >
                <option value="Akademik">Akademik</option>
                <option value="Keuangan">Keuangan</option>
                <option value="Acara">Acara</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-stone-700 mb-1">
                Prioritas
              </label>
              <Select
                value={pengPrioritas}
                onChange={(e) =>
                  setPengPrioritas(e.target.value as PrioritasPengumuman)
                }
              >
                <option value="Tinggi">Tinggi</option>
                <option value="Sedang">Sedang</option>
                <option value="Rendah">Rendah</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-stone-700 mb-1">
              Isi Informasi
            </label>
            <Textarea
              required
              rows={3}
              value={pengIsi}
              onChange={(e) => setPengIsi(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenPengModal(false)}
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

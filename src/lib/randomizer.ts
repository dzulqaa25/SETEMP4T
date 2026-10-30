import {
  HasilKelompokRandomizer,
  Kelompok,
  Mahasiswa,
  ModeRandomizer,
  RiwayatRandomisasi,
} from '@/types/database';

/**
 * Fisher-Yates Shuffle (Unbiased)
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Membuat key pasangan terurut untuk 2 ID mahasiswa
 */
function getPairKey(idA: string, idB: string): string {
  return idA < idB ? `${idA}__${idB}` : `${idB}__${idA}`;
}

/**
 * Membangun matriks frekuensi pasangan yang pernah satu kelompok sebelumnya
 */
export function buildPairHistoryMap(
  existingGroups: Kelompok[],
  pastRandomizations: RiwayatRandomisasi[]
): Map<string, number> {
  const pairCounts = new Map<string, number>();

  const recordMembers = (memberIds: string[]) => {
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const key = getPairKey(memberIds[i], memberIds[j]);
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }
  };

  existingGroups.forEach((g) => recordMembers(g.anggotaIds));
  pastRandomizations.forEach((r) => {
    r.hasilKelompok.forEach((hk) => recordMembers(hk.anggotaIds));
  });

  return pairCounts;
}

/**
 * Menghitung skor anti-duplikasi (0 - 100%)
 * 100% berarti seluruh pasangan dalam hasil pengelompokan belum pernah satu kelompok sebelumnya.
 */
export function calculateAntiDuplicationScore(
  buckets: Mahasiswa[][],
  pairHistory: Map<string, number>
): { score: number; duplicatePairsCount: number; totalPairsCount: number } {
  let totalPairsCount = 0;
  let duplicatePairsCount = 0;

  for (const group of buckets) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        totalPairsCount++;
        const key = getPairKey(group[i].id, group[j].id);
        if ((pairHistory.get(key) || 0) > 0) {
          duplicatePairsCount++;
        }
      }
    }
  }

  if (totalPairsCount === 0) {
    return { score: 100, duplicatePairsCount: 0, totalPairsCount: 0 };
  }

  const uniqueRatio = (totalPairsCount - duplicatePairsCount) / totalPairsCount;
  return {
    score: Math.round(uniqueRatio * 100),
    duplicatePairsCount,
    totalPairsCount,
  };
}

/**
 * Distribusi berstrata (Stratified Round-Robin Snake Draft)
 * Digunakan untuk mode Gender, Fakultas, dan Prodi agar distribusi tiap kelompok merata
 */
function distributeStratified(
  students: Mahasiswa[],
  numGroups: number,
  keyExtractor: (m: Mahasiswa) => string
): Mahasiswa[][] {
  const strataMap = new Map<string, Mahasiswa[]>();

  for (const s of students) {
    const key = keyExtractor(s);
    if (!strataMap.has(key)) strataMap.set(key, []);
    strataMap.get(key)!.push(s);
  }

  // Acak urutan mahasiswa di dalam setiap strata
  const flattened: Mahasiswa[] = [];
  const sortedKeys = Array.from(strataMap.keys()).sort(
    (a, b) => (strataMap.get(b)?.length || 0) - (strataMap.get(a)?.length || 0)
  );

  for (const key of sortedKeys) {
    flattened.push(...shuffleArray(strataMap.get(key)!));
  }

  // Snake draft distribution agar ukuran kelompok dan komposisi strata sangat seimbang
  const buckets: Mahasiswa[][] = Array.from({ length: numGroups }, () => []);
  flattened.forEach((student, idx) => {
    const cycle = Math.floor(idx / numGroups);
    const bucketIdx =
      cycle % 2 === 0 ? idx % numGroups : numGroups - 1 - (idx % numGroups);
    buckets[bucketIdx].push(student);
  });

  return buckets;
}

/**
 * Algoritma Anti-Duplikasi (Greedy Minimum-Collision Assignment + Iterative Local Swap Optimization)
 */
function distributeAntiDuplication(
  students: Mahasiswa[],
  numGroups: number,
  pairHistory: Map<string, number>
): Mahasiswa[][] {
  const shuffled = shuffleArray(students);
  const buckets: Mahasiswa[][] = Array.from({ length: numGroups }, () => []);
  const maxCapacity = Math.ceil(students.length / numGroups);

  // Fase 1: Greedy Penempatan dengan Penalti Terendah
  for (const student of shuffled) {
    let bestBucketIdx = 0;
    let lowestPenalty = Infinity;

    // Cari bucket yang belum penuh dengan penalti pasangan masa lalu paling kecil
    const candidateIndices = shuffleArray(
      Array.from({ length: numGroups }, (_, idx) => idx)
    );

    for (const bIdx of candidateIndices) {
      const bucket = buckets[bIdx];
      if (bucket.length >= maxCapacity) continue;

      // Penalti berdasarkan jumlah histori satu kelompok + faktor keseimbangan ukuran
      let penalty = bucket.length * 0.15;
      for (const member of bucket) {
        const key = getPairKey(student.id, member.id);
        penalty += (pairHistory.get(key) || 0) * 10;
      }

      if (penalty < lowestPenalty) {
        lowestPenalty = penalty;
        bestBucketIdx = bIdx;
      }
    }

    buckets[bestBucketIdx].push(student);
  }

  // Fase 2: Local Swap Optimization (150 iterasi) untuk menekan duplikasi lebih lanjut
  const computeBucketCost = (group: Mahasiswa[]): number => {
    let cost = 0;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        cost += pairHistory.get(getPairKey(group[i].id, group[j].id)) || 0;
      }
    }
    return cost;
  };

  for (let iter = 0; iter < 150; iter++) {
    const g1 = Math.floor(Math.random() * numGroups);
    const g2 = Math.floor(Math.random() * numGroups);
    if (g1 === g2 || buckets[g1].length === 0 || buckets[g2].length === 0) continue;

    const i1 = Math.floor(Math.random() * buckets[g1].length);
    const i2 = Math.floor(Math.random() * buckets[g2].length);

    const beforeCost = computeBucketCost(buckets[g1]) + computeBucketCost(buckets[g2]);

    // Tukar sementara
    const temp = buckets[g1][i1];
    buckets[g1][i1] = buckets[g2][i2];
    buckets[g2][i2] = temp;

    const afterCost = computeBucketCost(buckets[g1]) + computeBucketCost(buckets[g2]);

    // Jika tidak lebih baik, batalkan pertukaran
    if (afterCost > beforeCost) {
      buckets[g2][i2] = buckets[g1][i1];
      buckets[g1][i1] = temp;
    }
  }

  return buckets;
}

/**
 * Fungsi Utama Generator Kelompok (MODUL 5)
 */
export function generateGroups(params: {
  mahasiswaList: Mahasiswa[];
  mode: ModeRandomizer;
  jumlahKelompok: number;
  existingGroups: Kelompok[];
  pastRandomizations: RiwayatRandomisasi[];
}): {
  hasilKelompok: HasilKelompokRandomizer[];
  skorAntiDuplikasi: number;
  duplicatePairsCount: number;
  totalPairsCount: number;
} {
  const {
    mahasiswaList,
    mode,
    jumlahKelompok,
    existingGroups,
    pastRandomizations,
  } = params;

  const validGroupCount = Math.max(1, Math.min(jumlahKelompok, mahasiswaList.length));
  const pairHistory = buildPairHistoryMap(existingGroups, pastRandomizations);

  let buckets: Mahasiswa[][] = [];

  switch (mode) {
    case 'Random biasa': {
      const shuffled = shuffleArray(mahasiswaList);
      buckets = Array.from({ length: validGroupCount }, () => []);
      shuffled.forEach((m, idx) => {
        buckets[idx % validGroupCount].push(m);
      });
      break;
    }
    case 'Random berdasarkan Gender': {
      buckets = distributeStratified(mahasiswaList, validGroupCount, (m) => m.gender);
      break;
    }
    case 'Random berdasarkan Fakultas': {
      buckets = distributeStratified(mahasiswaList, validGroupCount, (m) => m.fakultas);
      break;
    }
    case 'Random berdasarkan Prodi': {
      buckets = distributeStratified(
        mahasiswaList,
        validGroupCount,
        (m) => m.programStudi
      );
      break;
    }
    case 'Anti-duplikasi anggota': {
      buckets = distributeAntiDuplication(
        mahasiswaList,
        validGroupCount,
        pairHistory
      );
      break;
    }
  }

  const stats = calculateAntiDuplicationScore(buckets, pairHistory);

  const hasilKelompok: HasilKelompokRandomizer[] = buckets.map((members, index) => {
    const nomor = index + 1;
    // Pilih ketua kelompok secara acak dari anggota kelompok
    const ketua = members[Math.floor(Math.random() * members.length)];
    return {
      nomorKelompok: nomor,
      namaKelompok: `Kelompok ${nomor}`,
      ketuaId: ketua ? ketua.id : '',
      anggotaIds: members.map((m) => m.id),
    };
  });

  return {
    hasilKelompok,
    skorAntiDuplikasi: stats.score,
    duplicatePairsCount: stats.duplicatePairsCount,
    totalPairsCount: stats.totalPairsCount,
  };
}

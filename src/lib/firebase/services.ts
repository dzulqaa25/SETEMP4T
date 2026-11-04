import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from './config';
import {
  Dokumen,
  Jadwal,
  Kelompok,
  Mahasiswa,
  MataKuliah,
  PembayaranKas,
  Pengumuman,
  RiwayatRandomisasi,
  TransaksiKas,
} from '@/types/database';

export const COLLECTIONS = {
  MAHASISWA: 'mahasiswa',
  MATA_KULIAH: 'mata_kuliah',
  KELOMPOK: 'kelompok',
  PEMBAYARAN_KAS: 'pembayaran_kas',
  TRANSAKSI_KAS: 'transaksi_kas',
  PENGUMUMAN: 'pengumuman',
  JADWAL: 'jadwal',
  DOKUMEN: 'dokumen',
  RIWAYAT_RANDOMISASI: 'riwayat_randomisasi',
  APP_STATE: 'app_state',
} as const;

/**
 * Bersihkan properti bernilai undefined agar Firestore tidak menolak dokumen
 */
function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function fetchCollectionData<T>(
  collectionName: string,
  orderByField?: string
): Promise<T[] | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const colRef = collection(db, collectionName);
    const q = orderByField
      ? query(colRef, orderBy(orderByField, 'desc'))
      : colRef;
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
  } catch (error) {
    console.warn(`Firestore read error on [${collectionName}]:`, error);
    return null;
  }
}

export async function upsertDocument<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, sanitizeForFirestore(data), { merge: true });
    return true;
  } catch (error) {
    console.warn(`Firestore write error on [${collectionName}/${data.id}]:`, error);
    return false;
  }
}

export async function removeDocument(
  collectionName: string,
  docId: string
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.warn(`Firestore delete error on [${collectionName}/${docId}]:`, error);
    return false;
  }
}

export async function getSharedState<T>(key: string): Promise<T | null> {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const docRef = doc(db, COLLECTIONS.APP_STATE, key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data()?.value as T) ?? null;
    }
    return null;
  } catch (error) {
    console.warn(`Firestore state read error on [${key}]:`, error);
    return null;
  }
}

export async function setSharedState<T>(
  key: string,
  value: T
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) return false;
  try {
    const docRef = doc(db, COLLECTIONS.APP_STATE, key);
    await setDoc(
      docRef,
      sanitizeForFirestore({ value, updatedAt: new Date().toISOString() }),
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn(`Firestore state write error on [${key}]:`, error);
    return false;
  }
}

export function subscribeSharedState<T>(
  key: string,
  onUpdate: (value: T | null) => void
): () => void {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const docRef = doc(db, COLLECTIONS.APP_STATE, key);
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          onUpdate((snap.data()?.value as T) ?? null);
        }
      },
      (err) => {
        console.warn(`Firestore onSnapshot error on [${key}]:`, err);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.warn(`Firestore subscribe error on [${key}]:`, error);
    return () => {};
  }
}

export async function uploadFileToStorage(
  file: File,
  folderPath: string
): Promise<string> {
  if (!isFirebaseConfigured || !storage) {
    return URL.createObjectURL(file);
  }
  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storageRef = ref(storage, `${folderPath}/${safeName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return await getDownloadURL(snapshot.ref);
}

export const FirebaseServices = {
  mahasiswa: {
    getAll: () => fetchCollectionData<Mahasiswa>(COLLECTIONS.MAHASISWA),
    save: (item: Mahasiswa) => upsertDocument(COLLECTIONS.MAHASISWA, item),
    delete: (id: string) => removeDocument(COLLECTIONS.MAHASISWA, id),
  },
  mataKuliah: {
    getAll: () => fetchCollectionData<MataKuliah>(COLLECTIONS.MATA_KULIAH),
    save: (item: MataKuliah) => upsertDocument(COLLECTIONS.MATA_KULIAH, item),
    delete: (id: string) => removeDocument(COLLECTIONS.MATA_KULIAH, id),
  },
  kelompok: {
    getAll: () => fetchCollectionData<Kelompok>(COLLECTIONS.KELOMPOK),
    save: (item: Kelompok) => upsertDocument(COLLECTIONS.KELOMPOK, item),
    delete: (id: string) => removeDocument(COLLECTIONS.KELOMPOK, id),
  },
  pembayaranKas: {
    getAll: () => fetchCollectionData<PembayaranKas>(COLLECTIONS.PEMBAYARAN_KAS),
    save: (item: PembayaranKas) =>
      upsertDocument(COLLECTIONS.PEMBAYARAN_KAS, item),
    delete: (id: string) => removeDocument(COLLECTIONS.PEMBAYARAN_KAS, id),
  },
  transaksiKas: {
    getAll: () =>
      fetchCollectionData<TransaksiKas>(COLLECTIONS.TRANSAKSI_KAS, 'tanggal'),
    save: (item: TransaksiKas) =>
      upsertDocument(COLLECTIONS.TRANSAKSI_KAS, item),
    delete: (id: string) => removeDocument(COLLECTIONS.TRANSAKSI_KAS, id),
  },
  pengumuman: {
    getAll: () =>
      fetchCollectionData<Pengumuman>(COLLECTIONS.PENGUMUMAN, 'tanggal'),
    save: (item: Pengumuman) => upsertDocument(COLLECTIONS.PENGUMUMAN, item),
    delete: (id: string) => removeDocument(COLLECTIONS.PENGUMUMAN, id),
  },
  jadwal: {
    getAll: () => fetchCollectionData<Jadwal>(COLLECTIONS.JADWAL, 'tanggal'),
    save: (item: Jadwal) => upsertDocument(COLLECTIONS.JADWAL, item),
    delete: (id: string) => removeDocument(COLLECTIONS.JADWAL, id),
  },
  dokumen: {
    getAll: () =>
      fetchCollectionData<Dokumen>(COLLECTIONS.DOKUMEN, 'tanggalUpload'),
    save: (item: Dokumen) => upsertDocument(COLLECTIONS.DOKUMEN, item),
    delete: (id: string) => removeDocument(COLLECTIONS.DOKUMEN, id),
  },
  riwayatRandomisasi: {
    getAll: () =>
      fetchCollectionData<RiwayatRandomisasi>(
        COLLECTIONS.RIWAYAT_RANDOMISASI,
        'tanggal'
      ),
    save: (item: RiwayatRandomisasi) =>
      upsertDocument(COLLECTIONS.RIWAYAT_RANDOMISASI, item),
    delete: (id: string) =>
      removeDocument(COLLECTIONS.RIWAYAT_RANDOMISASI, id),
  },
  sharedState: {
    get: getSharedState,
    set: setSharedState,
    subscribe: subscribeSharedState,
  },
};

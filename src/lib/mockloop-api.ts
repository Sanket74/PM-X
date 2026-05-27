import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
  runTransaction,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Note: Ensure `db` and `appId` are exported from App.tsx or a shared firebase setup file.
import { db, appId } from '../../App';
import { AvailabilitySlot, Booking } from '../types/mockloop';

export const createAvailabilitySlot = async (data: Omit<AvailabilitySlot, 'id' | 'status' | 'createdAt'>) => {
  if (!db) throw new Error("Firebase DB not initialized");
  
  const auth = getAuth();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const slotsRef = collection(db, 'artifacts', appId, 'public', 'data', 'mockloop_slots');
  const newSlot = {
    ...data,
    status: 'available',
    createdAt: serverTimestamp()
  };
  
  const docRef = await addDoc(slotsRef, newSlot);
  return docRef.id;
};

export const batchCreateSlots = async (slotsData: Omit<AvailabilitySlot, 'id' | 'status' | 'createdAt'>[]) => {
  if (!db) throw new Error("Firebase DB not initialized");
  
  const auth = getAuth();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const slotsRef = collection(db, 'artifacts', appId, 'public', 'data', 'mockloop_slots');
  const batch = writeBatch(db);
  
  slotsData.forEach(data => {
    const docRef = doc(slotsRef);
    batch.set(docRef, {
      ...data,
      status: 'available',
      createdAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};

export const getAvailableSlots = async (): Promise<AvailabilitySlot[]> => {
  if (!db) return [];
  
  const slotsRef = collection(db, 'artifacts', appId, 'public', 'data', 'mockloop_slots');
  const q = query(slotsRef, where("status", "==", "available"), orderBy("startTime", "asc"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AvailabilitySlot));
};

export const bookSlot = async (slotId: string, bookerData: { name: string; email: string; notes?: string }) => {
  if (!db) throw new Error("Firebase DB not initialized");

  const auth = getAuth();
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  const slotRef = doc(db, 'artifacts', appId, 'public', 'data', 'mockloop_slots', slotId);
  const bookingsRef = collection(db, 'artifacts', appId, 'public', 'data', 'mockloop_bookings');

  // Use a transaction to ensure we don't double-book
  await runTransaction(db, async (transaction) => {
    const slotDoc = await transaction.get(slotRef);
    if (!slotDoc.exists()) {
      throw new Error("Slot does not exist!");
    }
    
    const slotData = slotDoc.data() as AvailabilitySlot;
    if (slotData.status !== 'available') {
      throw new Error("Slot is no longer available.");
    }
    
    // Check if the booker is trying to book themselves
    if (slotData.hostEmail.toLowerCase() === bookerData.email.toLowerCase()) {
      throw new Error("You cannot book your own slot.");
    }

    // Update slot status
    transaction.update(slotRef, { status: 'booked' });
    
    // Create booking record
    const newBookingRef = doc(bookingsRef);
    transaction.set(newBookingRef, {
      slotId,
      hostEmail: slotData.hostEmail,
      bookerName: bookerData.name,
      bookerEmail: bookerData.email,
      bookingTime: serverTimestamp(),
      status: 'confirmed',
      notes: bookerData.notes || ""
    });
  });
};

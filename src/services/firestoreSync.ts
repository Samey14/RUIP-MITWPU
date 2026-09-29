import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Expense, TripRecord, ImmersionCamp, FacultyCoordinator, RegisteredUser } from '../types';
import { INITIAL_EXPENSES, DEFAULT_TRIPS, DEFAULT_IMMERSION, DEFAULT_FACULTY, DEFAULT_REGISTERED_USERS, StorageService } from './storage';

/**
 * Recursively removes all `undefined` fields from an object or array.
 * Firestore setDoc/writeBatch rejects documents containing `undefined` values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export const FirestoreService = {
  // Sync expenses collection in real-time
  subscribeExpenses(onData: (expenses: Expense[]) => void): () => void {
    const colPath = 'expenses';
    try {
      const unsub = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Expense[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Expense;
              list.push({ ...data, id: docSnap.id });
            });
            // Sort by date descending
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            onData(list);
            StorageService.saveExpenses(list);
          } else {
            // Seed initial expenses if Firestore collection is empty
            FirestoreService.seedInitialExpenses().then(() => {
              onData(INITIAL_EXPENSES);
            }).catch(() => {
              onData(StorageService.getExpenses());
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, colPath);
        }
      );
      return unsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, colPath);
      return () => {};
    }
  },

  async seedInitialExpenses(): Promise<void> {
    const colPath = 'expenses';
    try {
      const batch = writeBatch(db);
      for (const exp of INITIAL_EXPENSES) {
        const ref = doc(db, colPath, exp.id);
        batch.set(ref, sanitizeForFirestore(exp));
      }
      await batch.commit();
    } catch (error) {
      console.warn('Seeding initial expenses to Firestore skipped or failed:', error);
    }
  },

  async saveExpense(expense: Expense): Promise<void> {
    const docPath = `expenses/${expense.id}`;
    try {
      await setDoc(doc(db, 'expenses', expense.id), sanitizeForFirestore(expense));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const docPath = `expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Sync Trips in real-time
  subscribeTrips(onData: (trips: TripRecord[]) => void): () => void {
    const colPath = 'trips';
    try {
      const unsub = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: TripRecord[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ ...(docSnap.data() as TripRecord), id: docSnap.id });
            });
            onData(list);
            StorageService.saveTrips(list);
          } else {
            FirestoreService.seedInitialTrips().then(() => {
              onData(DEFAULT_TRIPS);
            }).catch(() => {
              onData(StorageService.getTrips());
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, colPath);
        }
      );
      return unsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, colPath);
      return () => {};
    }
  },

  async seedInitialTrips(): Promise<void> {
    const colPath = 'trips';
    try {
      const batch = writeBatch(db);
      for (const trip of DEFAULT_TRIPS) {
        const ref = doc(db, colPath, trip.id);
        batch.set(ref, sanitizeForFirestore(trip));
      }
      await batch.commit();
    } catch (error) {
      console.warn('Seeding initial trips to Firestore skipped or failed:', error);
    }
  },

  async saveTrip(trip: TripRecord): Promise<void> {
    const docPath = `trips/${trip.id}`;
    try {
      await setDoc(doc(db, 'trips', trip.id), sanitizeForFirestore(trip));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Sync Active Immersion Camp
  subscribeImmersion(onData: (camp: ImmersionCamp) => void): () => void {
    const docPath = 'camps/active';
    try {
      const unsub = onSnapshot(
        doc(db, 'camps', 'active'),
        (snapshot) => {
          if (snapshot.exists()) {
            const camp = snapshot.data() as ImmersionCamp;
            onData(camp);
            StorageService.saveImmersion(camp);
          } else {
            FirestoreService.saveImmersion(DEFAULT_IMMERSION);
            onData(DEFAULT_IMMERSION);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, docPath);
        }
      );
      return unsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return () => {};
    }
  },

  async saveImmersion(camp: ImmersionCamp): Promise<void> {
    const docPath = 'camps/active';
    try {
      await setDoc(doc(db, 'camps', 'active'), sanitizeForFirestore(camp));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Signatures
  subscribeSignatures(tripCode: string, onData: (signatures: Record<string, string>) => void): () => void {
    const docPath = `signatures/${tripCode}`;
    try {
      const unsub = onSnapshot(
        doc(db, 'signatures', tripCode),
        (snapshot) => {
          if (snapshot.exists()) {
            const sigs = (snapshot.data()?.signatures || {}) as Record<string, string>;
            onData(sigs);
            StorageService.saveSignatures(tripCode, sigs);
          } else {
            onData(StorageService.getSignatures(tripCode));
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, docPath);
        }
      );
      return unsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
      return () => {};
    }
  },

  async saveSignatures(tripCode: string, signatures: Record<string, string>): Promise<void> {
    const docPath = `signatures/${tripCode}`;
    try {
      await setDoc(
        doc(db, 'signatures', tripCode),
        sanitizeForFirestore({ signatures, updatedAt: new Date().toISOString() }),
        { merge: true }
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Sync Registered Users (Admin managed directory)
  subscribeRegisteredUsers(onData: (users: RegisteredUser[]) => void): () => void {
    const colPath = 'registered_users';
    try {
      const unsub = onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          if (!snapshot.empty) {
            const list: RegisteredUser[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ ...(docSnap.data() as RegisteredUser), id: docSnap.id });
            });
            onData(list);
            StorageService.saveRegisteredUsers(list);
          } else {
            FirestoreService.seedInitialRegisteredUsers().then(() => {
              onData(DEFAULT_REGISTERED_USERS);
            }).catch(() => {
              onData(StorageService.getRegisteredUsers());
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, colPath);
        }
      );
      return unsub;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, colPath);
      return () => {};
    }
  },

  async seedInitialRegisteredUsers(): Promise<void> {
    const colPath = 'registered_users';
    try {
      const batch = writeBatch(db);
      for (const user of DEFAULT_REGISTERED_USERS) {
        const ref = doc(db, colPath, user.id);
        batch.set(ref, sanitizeForFirestore(user));
      }
      await batch.commit();
    } catch (error) {
      console.warn('Seeding initial registered users to Firestore skipped:', error);
    }
  },

  async saveRegisteredUser(user: RegisteredUser): Promise<void> {
    const docPath = `registered_users/${user.id}`;
    try {
      await setDoc(doc(db, 'registered_users', user.id), sanitizeForFirestore(user));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteRegisteredUser(userId: string): Promise<void> {
    const docPath = `registered_users/${userId}`;
    try {
      await deleteDoc(doc(db, 'registered_users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }
};

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
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
    if (!auth.currentUser) {
      onData(StorageService.getExpenses() || INITIAL_EXPENSES);
      return () => {};
    }
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
            // Provide cached or initial expenses
            onData(StorageService.getExpenses() || INITIAL_EXPENSES);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, colPath);
          } catch {
            // Logged as required by Firestore error handling standards
          }
          // Gracefully fallback to local storage
          onData(StorageService.getExpenses());
        }
      );
      return unsub;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch {
        // Logged
      }
      onData(StorageService.getExpenses());
      return () => {};
    }
  },

  async seedInitialExpenses(): Promise<void> {
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
    const docPath = `expenses/${expense.id}`;
    try {
      await setDoc(doc(db, 'expenses', expense.id), sanitizeForFirestore(expense));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    if (!auth.currentUser) return;
    const docPath = `expenses/${expenseId}`;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  },

  // Sync Trips in real-time
  subscribeTrips(onData: (trips: TripRecord[]) => void): () => void {
    if (!auth.currentUser) {
      onData(StorageService.getTrips() || DEFAULT_TRIPS);
      return () => {};
    }
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
            onData(StorageService.getTrips() || DEFAULT_TRIPS);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, colPath);
          } catch {
            // Logged as required
          }
          onData(StorageService.getTrips());
        }
      );
      return unsub;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch {
        // Logged
      }
      onData(StorageService.getTrips());
      return () => {};
    }
  },

  async seedInitialTrips(): Promise<void> {
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
    const docPath = `trips/${trip.id}`;
    try {
      await setDoc(doc(db, 'trips', trip.id), sanitizeForFirestore(trip));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Sync Active Immersion Camp
  subscribeImmersion(onData: (camp: ImmersionCamp) => void): () => void {
    if (!auth.currentUser) {
      onData(StorageService.getImmersion() || DEFAULT_IMMERSION);
      return () => {};
    }
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
            onData(StorageService.getImmersion() || DEFAULT_IMMERSION);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, docPath);
          } catch {
            // Logged as required
          }
          onData(StorageService.getImmersion());
        }
      );
      return unsub;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch {
        // Logged
      }
      onData(StorageService.getImmersion());
      return () => {};
    }
  },

  async saveImmersion(camp: ImmersionCamp): Promise<void> {
    if (!auth.currentUser) return;
    const docPath = 'camps/active';
    try {
      await setDoc(doc(db, 'camps', 'active'), sanitizeForFirestore(camp));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  // Signatures
  subscribeSignatures(tripCode: string, onData: (signatures: Record<string, string>) => void): () => void {
    if (!auth.currentUser) {
      onData(StorageService.getSignatures(tripCode));
      return () => {};
    }
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
          try {
            handleFirestoreError(error, OperationType.GET, docPath);
          } catch {
            // Logged as required
          }
          onData(StorageService.getSignatures(tripCode));
        }
      );
      return unsub;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, docPath);
      } catch {
        // Logged
      }
      onData(StorageService.getSignatures(tripCode));
      return () => {};
    }
  },

  async saveSignatures(tripCode: string, signatures: Record<string, string>): Promise<void> {
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) {
      onData(StorageService.getRegisteredUsers() || DEFAULT_REGISTERED_USERS);
      return () => {};
    }
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
            onData(StorageService.getRegisteredUsers() || DEFAULT_REGISTERED_USERS);
          }
        },
        (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, colPath);
          } catch {
            // Logged as required
          }
          onData(StorageService.getRegisteredUsers());
        }
      );
      return unsub;
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.GET, colPath);
      } catch {
        // Logged
      }
      onData(StorageService.getRegisteredUsers());
      return () => {};
    }
  },

  async seedInitialRegisteredUsers(): Promise<void> {
    if (!auth.currentUser) return;
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
    if (!auth.currentUser) return;
    const docPath = `registered_users/${user.id}`;
    try {
      await setDoc(doc(db, 'registered_users', user.id), sanitizeForFirestore(user));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  },

  async deleteRegisteredUser(userId: string): Promise<void> {
    if (!auth.currentUser) return;
    const docPath = `registered_users/${userId}`;
    try {
      await deleteDoc(doc(db, 'registered_users', userId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }
};

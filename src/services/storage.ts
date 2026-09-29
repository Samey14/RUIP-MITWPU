import { Expense, FacultyCoordinator, ImmersionCamp, TripRecord, UserSession, RegisteredUser } from '../types';

export const STORAGE_KEYS = {
  TRIPS: 'ruip_trips_v1',
  EXPENSES: 'ruip_expenses_v2',
  FACULTY: 'ruip_current_faculty_v2',
  IMMERSION: 'ruip_immersion_v2',
  THEME: 'ruip_theme',
  SESSION: 'ruip_auth_session',
  SELECTED_TRIP: 'ruip_selected_trip',
  REGISTERED_USERS: 'ruip_registered_users_v1',
  SIGNATURES: (tripCode: string) => `ruip_statement_signatures_${tripCode}`
};

export const DEFAULT_REGISTERED_USERS: RegisteredUser[] = [
  {
    id: 'user-admin-01',
    email: 'accounts@mitwpu.edu.in',
    name: 'Accounts & Finance Administration',
    role: 'admin',
    password: 'admin123',
    department: 'Finance & Accounts Division',
    designation: 'Senior Financial Officer / Head Auditor',
    employeeId: 'MIT-FIN-1001',
    phone: '+91 20 7117 7100',
    status: 'active',
    registeredBy: 'Admin Department',
    registeredAt: '2026-01-10T09:00:00.000Z'
  },
  {
    id: 'user-faculty-01',
    email: 'prachi.patil@mitwpu.edu.in',
    name: 'Dr. Prachi Patil',
    role: 'faculty',
    password: 'prachi@mit2026',
    department: 'Computer Engineering',
    designation: 'Assistant Professor & Faculty Coordinator',
    employeeId: 'MIT-ENG-4492',
    phone: '+91 98220 18492',
    status: 'active',
    registeredBy: 'Admin Department',
    registeredAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'user-faculty-02',
    email: 'rahul.sharma@mitwpu.edu.in',
    name: 'Prof. Rahul Sharma',
    role: 'faculty',
    password: 'rahul@mit2026',
    department: 'Computer Engineering',
    designation: 'Associate Professor',
    employeeId: 'MIT-ENG-3108',
    phone: '+91 98450 72109',
    status: 'active',
    registeredBy: 'Admin Department',
    registeredAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'user-faculty-03',
    email: 'sneha.joshi@mitwpu.edu.in',
    name: 'Prof. Sneha Joshi',
    role: 'faculty',
    password: 'sneha@mit2026',
    department: 'Electronics & Comm.',
    designation: 'Assistant Professor',
    employeeId: 'MIT-ETC-5219',
    phone: '+91 94230 44581',
    status: 'active',
    registeredBy: 'Admin Department',
    registeredAt: '2026-01-15T10:00:00.000Z'
  }
];

export const DEFAULT_FACULTY: FacultyCoordinator = {
  name: 'Prof. Prachi Patil',
  email: 'prachi.patil@mitwpu.edu.in',
  department: 'Computer Engineering',
  designation: 'Assistant Professor & Faculty Coordinator',
  employeeId: 'MIT-ENG-4492',
  phone: '+91 98220 18492',
  avatarInitials: 'PP'
};

export const FACULTY_ROSTER: FacultyCoordinator[] = [
  DEFAULT_FACULTY,
  {
    name: 'Prof. Rahul Sharma',
    email: 'rahul.sharma@mitwpu.edu.in',
    department: 'Computer Engineering',
    designation: 'Associate Professor',
    employeeId: 'MIT-ENG-3108',
    phone: '+91 98450 72109',
    avatarInitials: 'RS'
  },
  {
    name: 'Prof. Sneha Joshi',
    email: 'sneha.joshi@mitwpu.edu.in',
    department: 'Electronics & Comm.',
    designation: 'Assistant Professor',
    employeeId: 'MIT-ETC-5219',
    phone: '+91 94230 44581',
    avatarInitials: 'SJ'
  }
];

export const DEFAULT_IMMERSION: ImmersionCamp = {
  tripCode: 'RUIP-2026-DURGAON',
  village: 'Durgaon',
  taluka: 'Shirur',
  district: 'Pune',
  academicYear: '2025–26',
  department: 'Computer Engineering',
  startDate: '2026-02-27',
  endDate: '2026-03-05',
  totalDays: 7,
  currentDay: 6,
  totalStudents: 64,
  totalFaculty: 3,
  advanceReceived: 58000,
  advanceDate: '25 Feb 2026',
  status: 'Ongoing',
  coordinators: ['Prof. Prachi Patil', 'Prof. Rahul Sharma', 'Prof. Sneha Joshi']
};

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-01',
    tripId: 'trip-default',
    date: '2026-02-28',
    category: 'Food',
    vendor: 'Marimata Hotel & Lodging',
    amount: 29500,
    paymentMode: 'Cash',
    description: 'Breakfast, lunch and dinner — day 2, 64 students & 3 faculty',
    billNumber: 'MH-2802',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-01',
        name: 'marimata-hotel-28feb.jpg',
        type: 'bill',
        sizeKb: 342,
        uploadedAt: '2026-02-28 21:40'
      }
    ],
    notes: 'Verified against mess register plates count (67 total plates).',
    createdAt: '2026-02-28T21:40:00Z'
  },
  {
    id: 'exp-02',
    tripId: 'trip-default',
    date: '2026-02-28',
    category: 'Grocery',
    vendor: 'Kothari Super Market',
    amount: 19900,
    paymentMode: 'Cash',
    description: 'Dry rations, bottled water cans (40 jars), biscuits & first aid tea items',
    billNumber: 'KSM-8941',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-02',
        name: 'kothari-supermarket-receipt.pdf',
        type: 'bill',
        sizeKb: 480,
        uploadedAt: '2026-02-28 22:15'
      }
    ],
    createdAt: '2026-02-28T22:15:00Z'
  },
  {
    id: 'exp-03',
    tripId: 'trip-default',
    date: '2026-03-01',
    category: 'Mattress',
    vendor: 'Sangam Bhandi & Mandap Decorators',
    amount: 5600,
    paymentMode: 'Cash',
    description: '70 mattresses and 70 blankets on hire for primary school hall stay (7 days)',
    billNumber: 'SB-044',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-03',
        name: 'sangam-bhandi-bill.jpg',
        type: 'bill',
        sizeKb: 512,
        uploadedAt: '2026-03-01 10:30'
      }
    ],
    notes: 'Advance crossed after this entry.',
    createdAt: '2026-03-01T10:30:00Z'
  },
  {
    id: 'exp-04',
    tripId: 'trip-default',
    date: '2026-03-01',
    category: 'Transportation',
    vendor: 'Kiran Adhav (Village Transport)',
    amount: 2000,
    paymentMode: 'UPI / online',
    description: 'Luggage transport from Shirur bus depot to Durgaon Gram Panchayat hall',
    billNumber: 'KA-UPI-01',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Rahul Sharma',
    hasBillProof: true,
    hasUpiProof: true,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-04a',
        name: 'kiran-adhav-voucher.jpg',
        type: 'bill',
        sizeKb: 210,
        uploadedAt: '2026-03-01 16:15'
      },
      {
        id: 'att-04b',
        name: 'upi-kiran-adhav-axis.png',
        type: 'upi',
        sizeKb: 184,
        uploadedAt: '2026-03-01 16:18'
      }
    ],
    createdAt: '2026-03-01T16:15:00Z'
  },
  {
    id: 'exp-05',
    tripId: 'trip-default',
    date: '2026-03-03',
    category: 'Stationery',
    vendor: 'DMart Shirur',
    amount: 1867,
    paymentMode: 'Cash',
    description: 'Survey questionnaires printing, clipboards, chart papers and markers for team groups',
    billNumber: 'DM-99420',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: false,
    hasUpiProof: false,
    billVerification: 'Pending',
    attachments: [],
    notes: 'Cash receipt lost by student team leader, duplicate request pending at store.',
    createdAt: '2026-03-03T11:20:00Z'
  },
  {
    id: 'exp-06',
    tripId: 'trip-default',
    date: '2026-03-04',
    category: 'Fuel',
    vendor: 'Shell Petrol Pump — Rashmi Warke',
    amount: 500,
    paymentMode: 'UPI / online',
    description: 'Emergency generator fuel for village community hall presentation night',
    billNumber: 'SH-771',
    chargeTo: 'Shared',
    paidByFaculty: 'Prof. Sneha Joshi',
    hasBillProof: true,
    hasUpiProof: true,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-06a',
        name: 'shell-pump-fuel-receipt.jpg',
        type: 'bill',
        sizeKb: 195,
        uploadedAt: '2026-03-04 18:00'
      }
    ],
    createdAt: '2026-03-04T18:00:00Z'
  },
  {
    id: 'exp-07',
    tripId: 'trip-default',
    date: '2026-03-04',
    category: 'Faculty Expense',
    vendor: 'Auto Rickshaw & Local Conveyance',
    amount: 995,
    paymentMode: 'Cash',
    description: 'Local conveyance for 3 faculty members to Shirur Tahsildar office & ZP School',
    billNumber: 'VOUCHER-F01',
    chargeTo: 'Faculty (3)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: false,
    hasUpiProof: false,
    billVerification: 'Pending',
    attachments: [],
    notes: 'Self-declaration voucher to be signed by HOD.',
    createdAt: '2026-03-04T19:30:00Z'
  },
  {
    id: 'exp-08',
    tripId: 'trip-default',
    date: '2026-03-05',
    category: 'Food',
    vendor: 'Marimata Hotel & Lodging',
    amount: 2284,
    paymentMode: 'Cash',
    description: 'Closing day afternoon snacks and tea for Gram Panchayat sarpanch & elders meet',
    billNumber: 'MH-0503',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Prachi Patil',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-08',
        name: 'marimata-tea-snacks-bill.jpg',
        type: 'bill',
        sizeKb: 280,
        uploadedAt: '2026-03-05 14:10'
      }
    ],
    createdAt: '2026-03-05T14:10:00Z'
  },
  {
    id: 'exp-09',
    tripId: 'trip-default',
    date: '2026-03-02',
    category: 'Transportation',
    vendor: 'Kiran Adhav (Village Transport)',
    amount: 373,
    paymentMode: 'Cash',
    description: 'Emergency medicines transport from Shirur primary health center',
    billNumber: 'KA-CASH-02',
    chargeTo: 'Students (64)',
    paidByFaculty: 'Prof. Rahul Sharma',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-09',
        name: 'phc-transit-chit.jpg',
        type: 'bill',
        sizeKb: 160,
        uploadedAt: '2026-03-02 18:40'
      }
    ],
    createdAt: '2026-03-02T18:40:00Z'
  },
  {
    id: 'exp-10',
    tripId: 'trip-default',
    date: '2026-03-03',
    category: 'Faculty Expense',
    vendor: 'Durgaon Gram Sewak Canteen',
    amount: 215,
    paymentMode: 'Cash',
    description: 'Official tea and refreshment during joint survey coordination meeting',
    billNumber: 'GS-88',
    chargeTo: 'Faculty (3)',
    paidByFaculty: 'Prof. Sneha Joshi',
    hasBillProof: true,
    hasUpiProof: false,
    billVerification: 'Verified',
    attachments: [
      {
        id: 'att-10',
        name: 'canteen-slip-03mar.jpg',
        type: 'bill',
        sizeKb: 140,
        uploadedAt: '2026-03-03 16:50'
      }
    ],
    createdAt: '2026-03-03T16:50:00Z'
  }
];

export const DEFAULT_TRIPS: TripRecord[] = [
  {
    id: 'trip-default',
    tripCode: 'RUIP-2026-DURGAON',
    location: 'Durgaon, Shirur',
    village: 'Durgaon',
    taluka: 'Shirur',
    district: 'Pune',
    department: 'Computer Engineering',
    startDate: '2026-02-27',
    endDate: '2026-03-05',
    totalStudents: 64,
    totalFaculty: 3,
    budget: 58000,
    status: 'Ongoing',
    coordinatorEmails: [
      'prachi.patil@mitwpu.edu.in',
      'rahul.sharma@mitwpu.edu.in',
      'sneha.joshi@mitwpu.edu.in'
    ],
    notes: 'Official Rural Immersion Programme 2026 camp at Durgaon, Shirur taluka.',
    createdAt: '2026-02-25T10:00:00.000Z'
  }
];

export const StorageService = {
  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (!data) return INITIAL_EXPENSES;
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          tripId: item.tripId || 'trip-default',
          billVerification: item.billVerification || (item.hasBillProof ? 'Verified' : 'Pending'),
          attachments: item.attachments || [],
          ...item
        }));
      }
      return INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  },

  saveExpenses(expenses: Expense[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  },

  getFaculty(): FacultyCoordinator {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FACULTY);
      return data ? JSON.parse(data) : DEFAULT_FACULTY;
    } catch {
      return DEFAULT_FACULTY;
    }
  },

  saveFaculty(faculty: FacultyCoordinator): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FACULTY, JSON.stringify(faculty));
    } catch (e) {
      console.warn('Faculty save error:', e);
    }
  },

  getImmersion(): ImmersionCamp {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.IMMERSION);
      return data ? JSON.parse(data) : DEFAULT_IMMERSION;
    } catch {
      return DEFAULT_IMMERSION;
    }
  },

  saveImmersion(camp: ImmersionCamp): void {
    try {
      localStorage.setItem(STORAGE_KEYS.IMMERSION, JSON.stringify(camp));
    } catch (e) {
      console.warn('Camp save error:', e);
    }
  },

  getTrips(): TripRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRIPS);
      if (!data) return DEFAULT_TRIPS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_TRIPS;
    } catch {
      return DEFAULT_TRIPS;
    }
  },

  saveTrips(trips: TripRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    } catch (e) {
      console.warn('Trips save error:', e);
    }
  },

  getSession(): UserSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveSession(session: UserSession | null): void {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (e) {
      console.warn('Session save error:', e);
    }
  },

  getSignatures(tripCode: string): Record<string, string> {
    try {
      const key = STORAGE_KEYS.SIGNATURES(tripCode);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveSignatures(tripCode: string, signatures: Record<string, string>): void {
    try {
      const key = STORAGE_KEYS.SIGNATURES(tripCode);
      localStorage.setItem(key, JSON.stringify(signatures));
    } catch (e) {
      console.warn('Signatures save error:', e);
    }
  },

  getRegisteredUsers(): RegisteredUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
      if (!data) return DEFAULT_REGISTERED_USERS;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_REGISTERED_USERS;
    } catch {
      return DEFAULT_REGISTERED_USERS;
    }
  },

  saveRegisteredUsers(users: RegisteredUser[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Registered users save error:', e);
    }
  },

  findRegisteredUser(email: string): RegisteredUser | undefined {
    const cleanEmail = email.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    return users.find(u => u.email.trim().toLowerCase() === cleanEmail);
  },

  saveRegisteredUser(user: RegisteredUser): void {
    const users = this.getRegisteredUsers();
    const index = users.findIndex(u => u.email.trim().toLowerCase() === user.email.trim().toLowerCase() || u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.saveRegisteredUsers(users);
  },

  deleteRegisteredUser(userId: string): void {
    const users = this.getRegisteredUsers().filter(u => u.id !== userId);
    this.saveRegisteredUsers(users);
  }
};

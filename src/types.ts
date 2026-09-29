export interface Attachment {
  id: string;
  name: string;
  type: 'bill' | 'upi';
  sizeKb: number;
  uploadedAt: string;
  dataUrl?: string;
}

export type BillVerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export interface Expense {
  id: string;
  tripId?: string;
  date: string;
  category: string;
  vendor: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI / online' | 'Card' | 'Net Banking';
  description?: string;
  billNumber?: string;
  chargeTo: string;
  paidByFaculty: string;
  hasBillProof: boolean;
  hasUpiProof: boolean;
  billVerification?: BillVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionRemark?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  attachments: Attachment[];
  notes?: string;
  createdAt: string;
}

export interface FacultyCoordinator {
  name: string;
  email: string;
  department: string;
  designation: string;
  employeeId: string;
  phone: string;
  avatarInitials: string;
}

export interface ImmersionCamp {
  tripCode: string;
  village: string;
  taluka: string;
  district: string;
  academicYear: string;
  department: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  totalStudents: number;
  totalFaculty: number;
  advanceReceived: number;
  advanceDate: string;
  status: 'Planned' | 'Ongoing' | 'Completed' | 'Submitted';
  ledgerStatus?: 'Pending' | 'Verified' | 'Rejected';
  ledgerRejectionRemark?: string;
  ledgerAuditedBy?: string;
  ledgerAuditedAt?: string;
  coordinators: string[];
}

export interface TripRecord {
  id: string;
  tripCode: string;
  location: string;
  village: string;
  taluka: string;
  district: string;
  department: string;
  startDate: string;
  endDate: string;
  totalStudents: number;
  totalFaculty: number;
  budget: number;
  status: 'Planned' | 'Ongoing' | 'Completed';
  coordinatorEmails: string[];
  studentsList?: string[];
  notes?: string;
  createdAt: string;
}

export interface UserSession {
  email: string;
  role: 'faculty' | 'admin';
  name: string;
  issuedAt: number;
  provider: 'email' | 'google';
}

export interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  role: 'faculty' | 'admin';
  password?: string;
  department: string;
  designation: string;
  employeeId: string;
  phone?: string;
  status: 'active' | 'suspended';
  registeredBy: string;
  registeredAt: string;
}

export type Role = 'librarian' | 'parent' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  relationship: '爸爸' | '妈妈' | '爷爷' | '奶奶' | '外公' | '外婆' | '孩子';
  age?: number;
  avatar?: string;
  isPrimary: boolean;
}

export interface Family {
  id: string;
  name: string;
  primaryContactId: string;
  memberLevel: 'normal' | 'silver' | 'gold';
  borrowQuota: number;
  currentBorrowed: number;
  joinDate: string;
  address?: string;
}

export interface Parent {
  id: string;
  name: string;
  familyId: string;
  childName: string;
  childAge: number;
  phone: string;
  avatar?: string;
  memberLevel: 'normal' | 'silver' | 'gold';
  joinDate: string;
}

export interface Library {
  id: string;
  name: string;
  address: string;
  manager?: string;
  phone?: string;
  createdAt: string;
}

export interface BookStock {
  id: string;
  bookId: string;
  libraryId: string;
  stock: number;
  available: number;
  location: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  isbn?: string;
  category: string;
  theme?: string;
  ageRange: string;
  price: number;
  stock: number;
  available: number;
  coverUrl: string;
  description: string;
  status: 'available' | 'borrowed' | 'damaged' | 'lost' | 'repairing';
  location: string;
  libraryId: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus = 'borrowing' | 'returned' | 'overdue' | 'renewed';

export interface Loan {
  id: string;
  bookId: string;
  parentId: string;
  familyId: string;
  memberId?: string;
  loanDate: string;
  dueDate: string;
  originalDueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  isOverdue: boolean;
  hasDamage: boolean;
  damageDescription?: string;
  damageLevel?: 'minor' | 'moderate' | 'severe' | 'lost';
  renewCount: number;
  lastRenewResult?: 'success' | 'failed';
  lastRenewMessage?: string;
  createdAt: string;
}

export interface Checkin {
  id: string;
  loanId: string;
  parentId: string;
  familyId: string;
  memberId?: string;
  bookId: string;
  checkinDate: string;
  date: string;
  photoUrl?: string;
  notes?: string;
  durationMinutes: number;
  pageRead?: number;
  createdAt: string;
}

export type CompensationType = 'damage' | 'lost' | 'overdue';
export type CompensationStatus = 'pending' | 'paid' | 'waived';
export type CompensationMode = 'tiered' | 'full';

export interface CompensationTier {
  level: 'minor' | 'moderate' | 'severe' | 'lost';
  name: string;
  ratio: number;
  description: string;
}

export interface Compensation {
  id: string;
  loanId: string;
  bookId: string;
  parentId: string;
  familyId: string;
  type: CompensationType;
  damageReason: string;
  damageLevel?: 'minor' | 'moderate' | 'severe' | 'lost';
  compensationMode: CompensationMode;
  tierRatio: number;
  amount: number;
  status: CompensationStatus;
  reportedDate: string;
  paidDate: string | null;
  isLocked: boolean;
  processedBy?: string;
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'balance';
  notes?: string;
}

export interface LibrarianSettings {
  defaultLoanDays: number;
  loanPeriod: number;
  allowRenewalTimes: number;
  allowOverdue: boolean;
  enableOverdueReminder: boolean;
  overdueFinePerDay: number;
  maxBorrowCount?: number;
  allowHolidayPostpone: boolean;
  compensationTiers: CompensationTier[];
}

export interface DamageReport {
  loanId: string;
  bookId: string;
  parentId: string;
  damageReason: string;
  damageLevel: 'minor' | 'moderate' | 'severe' | 'lost';
  compensationMode: CompensationMode;
}

export interface Holiday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'national' | 'custom';
  createdAt: string;
}

export type RepairStatus = 'pending' | 'repairing' | 'completed' | 'scrapped';

export interface RepairRecord {
  id: string;
  bookId: string;
  loanId?: string;
  reportedBy: string;
  reportedDate: string;
  damageDescription: string;
  damageLevel: 'minor' | 'moderate' | 'severe';
  repairCost?: number;
  repairer?: string;
  repairNotes?: string;
  completedDate?: string;
  status: RepairStatus;
  libraryId: string;
}

export type TransferStatus = 'pending' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'cancelled';

export interface BookTransfer {
  id: string;
  bookId: string;
  fromLibraryId: string;
  toLibraryId: string;
  quantity: number;
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  shippedDate?: string;
  receivedDate?: string;
  status: TransferStatus;
  reason?: string;
  notes?: string;
}

export interface ThemeStockDiff {
  theme: string;
  libraryStocks: {
    libraryId: string;
    libraryName: string;
    count: number;
    available: number;
  }[];
}

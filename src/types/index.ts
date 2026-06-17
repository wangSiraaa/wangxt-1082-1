export type Role = 'librarian' | 'parent' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface Parent {
  id: string;
  name: string;
  childName: string;
  childAge: number;
  phone: string;
  avatar?: string;
  memberLevel: 'normal' | 'silver' | 'gold';
  joinDate: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  publishDate: string;
  isbn?: string;
  category: string;
  ageRange: string;
  price: number;
  stock: number;
  available: number;
  coverUrl: string;
  description: string;
  status: 'available' | 'borrowed' | 'damaged' | 'lost';
  location: string;
  createdAt: string;
  updatedAt: string;
}

export type LoanStatus = 'borrowing' | 'returned' | 'overdue' | 'renewed';

export interface Loan {
  id: string;
  bookId: string;
  parentId: string;
  loanDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  isOverdue: boolean;
  hasDamage: boolean;
  damageDescription?: string;
  damageLevel?: 'minor' | 'severe' | 'lost';
  renewCount: number;
  createdAt: string;
}

export interface Checkin {
  id: string;
  loanId: string;
  parentId: string;
  bookId: string;
  checkinDate: string;
  photoUrl?: string;
  notes?: string;
  durationMinutes: number;
  createdAt: string;
}

export type CompensationStatus = 'pending' | 'paid' | 'waived';

export interface Compensation {
  id: string;
  loanId: string;
  bookId: string;
  parentId: string;
  damageReason: string;
  amount: number;
  status: CompensationStatus;
  reportedDate: string;
  paidDate: string | null;
  isLocked: boolean;
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'balance';
  notes?: string;
}

export interface LibrarianSettings {
  defaultLoanDays: number;
  allowRenewalTimes: number;
  allowOverdue: boolean;
  enableOverdueReminder: boolean;
  overdueFinePerDay: number;
  maxBorrowCount?: number;
}

export interface DamageReport {
  loanId: string;
  bookId: string;
  parentId: string;
  damageReason: string;
  damageLevel: 'minor' | 'severe' | 'lost';
}

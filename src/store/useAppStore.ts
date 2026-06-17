import { create } from 'zustand';
import type { 
  Book, Loan, Checkin, Compensation, User, Parent, 
  LibrarianSettings, Role, DamageReport 
} from '../types';
import { initialBooks } from '../data/books';
import { initialLoans } from '../data/loans';
import { initialCheckins } from '../data/checkins';
import { initialCompensations } from '../data/compensations';
import { initialUsers } from '../data/users';
import { initialParents } from '../data/parents';
import { initialSettings } from '../data/settings';
import { 
  validateLoan, canParentBorrow, canRenewLoan, 
  computeCompensationAmount, isLoanOverdue,
  getLoanDueDate, getRenewDueDate, canEditDamageReason 
} from '../utils/businessRules';
import { today, formatDate } from '../utils/date';

interface AppState {
  currentUser: User | null;
  currentParent: Parent | null;
  currentRole: Role;
  users: User[];
  parents: Parent[];
  books: Book[];
  loans: Loan[];
  checkins: Checkin[];
  compensations: Compensation[];
  settings: LibrarianSettings;
  selectedParentId: string | null;
  
  setCurrentRole: (role: Role) => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentParent: (parent: Parent | null) => void;
  setSelectedParentId: (parentId: string | null) => void;
  
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  
  createLoan: (bookId: string, parentId: string) => { success: boolean; message: string };
  returnLoan: (loanId: string, hasDamage?: boolean, damageDescription?: string) => { success: boolean; message: string };
  renewLoan: (loanId: string) => { success: boolean; message: string };
  updateOverdueStatus: () => void;
  
  addCheckin: (checkin: Omit<Checkin, 'id' | 'createdAt'>) => void;
  
  createCompensation: (report: DamageReport) => Compensation;
  processCompensation: (id: string, action: 'paid' | 'waived', paymentMethod?: string) => { success: boolean; message: string };
  updateDamageReason: (id: string, reason: string) => { success: boolean; message: string };
  getCompensationsByStatus: (status: 'pending' | 'paid' | 'waived') => Compensation[];
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  updateSettings: (settings: Partial<LibrarianSettings>) => void;
  
  getBookById: (id: string) => Book | undefined;
  getLoanById: (id: string) => Loan | undefined;
  getParentById: (id: string) => Parent | undefined;
  getCompensationById: (id: string) => Compensation | undefined;
  getLoansByParent: (parentId: string) => Loan[];
  getCheckinsByLoan: (loanId: string) => Checkin[];
  getCheckinsByParent: (parentId: string) => Checkin[];
  getCompensationsByParent: (parentId: string) => Compensation[];
  getOverdueLoans: () => Loan[];
  getPendingCompensations: () => Compensation[];
}

const generateId = (prefix: string) => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentParent: null,
  currentRole: 'librarian',
  users: initialUsers,
  parents: initialParents,
  books: initialBooks,
  loans: initialLoans,
  checkins: initialCheckins,
  compensations: initialCompensations,
  settings: initialSettings,
  selectedParentId: null,

  setCurrentRole: (role) => {
    set({ currentRole: role });
    if (role === 'librarian') {
      const librarian = get().users.find(u => u.role === 'librarian');
      set({ currentUser: librarian || null, currentParent: null });
    } else if (role === 'admin') {
      const admin = get().users.find(u => u.role === 'admin');
      set({ currentUser: admin || null, currentParent: null });
    } else if (role === 'parent') {
      const parentUser = get().users.find(u => u.role === 'parent');
      const parent = get().parents[0] || null;
      set({ currentUser: parentUser || null, currentParent: parent });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentParent: (parent) => set({ currentParent: parent }),
  setSelectedParentId: (parentId) => set({ selectedParentId: parentId }),

  addBook: (book) => {
    const now = today();
    const newBook: Book = {
      ...book,
      id: generateId('bk'),
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ books: [...state.books, newBook] }));
  },

  updateBook: (id, book) => {
    const now = today();
    set((state) => ({
      books: state.books.map((b) =>
        b.id === id ? { ...b, ...book, updatedAt: now } : b
      ),
    }));
  },

  deleteBook: (id) => {
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
    }));
  },

  createLoan: (bookId, parentId) => {
    const state = get();
    const validation = validateLoan(parentId, bookId, state.loans, state.books, state.settings);
    
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const loanDate = today();
    const dueDate = getLoanDueDate(loanDate, state.settings);
    const newLoan: Loan = {
      id: generateId('ln'),
      bookId,
      parentId,
      loanDate,
      dueDate,
      returnDate: null,
      status: 'borrowing',
      isOverdue: false,
      hasDamage: false,
      renewCount: 0,
      createdAt: today(),
    };

    set((state) => ({
      loans: [...state.loans, newLoan],
      books: state.books.map((b) =>
        b.id === bookId ? { ...b, available: b.available - 1 } : b
      ),
    }));

    return { success: true, message: '借阅成功' };
  },

  returnLoan: (loanId, hasDamage = false, damageDescription) => {
    const state = get();
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, message: '借阅记录不存在' };
    }

    const returnDate = today();
    const isOverdue = isLoanOverdue({ ...loan, returnDate });

    const defaultDamageLevel = hasDamage ? (
      damageDescription?.includes('严重') || damageDescription?.includes('撕')
        ? 'severe' as const
        : damageDescription?.includes('遗失') || damageDescription?.includes('丢')
        ? 'lost' as const
        : 'minor' as const
    ) : undefined;

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              returnDate,
              status: isOverdue ? 'overdue' : 'returned',
              hasDamage,
              damageDescription,
              damageLevel: defaultDamageLevel,
              isOverdue,
            }
          : l
      ),
      books: state.books.map((b) =>
        b.id === loan.bookId
          ? { ...b, available: b.available + 1, status: hasDamage ? 'damaged' : 'available' }
          : b
      ),
    }));

    if (hasDamage) {
      const book = state.books.find((b) => b.id === loan.bookId);
      if (book) {
        get().createCompensation({
          loanId,
          bookId: loan.bookId,
          parentId: loan.parentId,
          damageReason: damageDescription || '归还时发现破损',
          damageLevel: defaultDamageLevel as 'minor' | 'severe' | 'lost',
        });
      }
    }

    return { success: true, message: '归还成功' };
  },

  renewLoan: (loanId) => {
    const state = get();
    const loan = state.loans.find((l) => l.id === loanId);
    
    if (!loan) {
      return { success: false, message: '借阅记录不存在' };
    }

    if (!canRenewLoan(loan, state.settings)) {
      if (loan.isOverdue) {
        return { success: false, message: '逾期图书不能续借' };
      }
      if (loan.renewCount >= state.settings.allowRenewalTimes) {
        return { success: false, message: '已达到最大续借次数' };
      }
      return { success: false, message: '续借失败' };
    }

    const newDueDate = getRenewDueDate(loan.dueDate, state.settings);

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              dueDate: newDueDate,
              renewCount: l.renewCount + 1,
              status: 'renewed',
            }
          : l
      ),
    }));

    return { success: true, message: '续借成功' };
  },

  updateOverdueStatus: () => {
    set((state) => ({
      loans: state.loans.map((loan) => {
        if (loan.status === 'returned') return loan;
        const isOverdue = isLoanOverdue(loan);
        return {
          ...loan,
          isOverdue,
          status: isOverdue ? 'overdue' : loan.status === 'overdue' ? 'borrowing' : loan.status,
        };
      }),
    }));
  },

  addCheckin: (checkin) => {
    const newCheckin: Checkin = {
      ...checkin,
      id: generateId('ck'),
      createdAt: today(),
    };
    set((state) => ({ checkins: [...state.checkins, newCheckin] }));
  },

  createCompensation: (report) => {
    const book = get().books.find((b) => b.id === report.bookId);
    const amount = book ? computeCompensationAmount(book.price, report.damageLevel) : 0;

    const newCompensation: Compensation = {
      id: generateId('cp'),
      loanId: report.loanId,
      bookId: report.bookId,
      parentId: report.parentId,
      damageReason: report.damageReason,
      amount,
      status: 'pending',
      reportedDate: today(),
      paidDate: null,
      isLocked: false,
    };

    set((state) => ({ compensations: [...state.compensations, newCompensation] }));
    return newCompensation;
  },

  processCompensation: (id, action, paymentMethod) => {
    const state = get();
    const compensation = state.compensations.find((c) => c.id === id);
    
    if (!compensation) {
      return { success: false, message: '赔付记录不存在' };
    }
    
    if (compensation.isLocked) {
      return { success: false, message: '该记录已锁定，不能重复处理' };
    }
    
    const now = today();
    set((state) => ({
      compensations: state.compensations.map((c) =>
        c.id === id
          ? {
              ...c,
              status: action,
              paidDate: now,
              isLocked: true,
              paymentMethod: paymentMethod as any,
            }
          : c
      ),
    }));
    
    return { success: true, message: '处理成功' };
  },

  updateDamageReason: (id, reason) => {
    const state = get();
    const compensation = state.compensations.find((c) => c.id === id);
    
    if (!compensation) {
      return { success: false, message: '赔付记录不存在' };
    }

    if (!canEditDamageReason(compensation)) {
      return { success: false, message: '已赔付的记录不能修改破损原因' };
    }

    set((state) => ({
      compensations: state.compensations.map((c) =>
        c.id === id ? { ...c, damageReason: reason } : c
      ),
    }));

    return { success: true, message: '修改成功' };
  },

  updateSettings: (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }));
  },

  getBookById: (id) => get().books.find((b) => b.id === id),
  getLoanById: (id) => get().loans.find((l) => l.id === id),
  getParentById: (id) => get().parents.find((p) => p.id === id),
  getCompensationById: (id) => get().compensations.find((c) => c.id === id),
  getLoansByParent: (parentId) => get().loans.filter((l) => l.parentId === parentId),
  getCheckinsByLoan: (loanId) => get().checkins.filter((c) => c.loanId === loanId),
  getCheckinsByParent: (parentId) => get().checkins.filter((c) => c.parentId === parentId),
  getCompensationsByParent: (parentId) => get().compensations.filter((c) => c.parentId === parentId),
  getOverdueLoans: () => get().loans.filter((l) => l.isOverdue || l.status === 'overdue'),
  getPendingCompensations: () => get().compensations.filter((c) => c.status === 'pending'),
  getCompensationsByStatus: (status) => get().compensations.filter((c) => c.status === status),
  updateLoan: (id, updates) => {
    set((state) => ({
      loans: state.loans.map((l) => l.id === id ? { ...l, ...updates } : l),
    }));
  },
}));

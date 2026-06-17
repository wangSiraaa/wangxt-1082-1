import { create } from 'zustand';
import type { 
  Book, Loan, Checkin, Compensation, User, Parent, 
  LibrarianSettings, Role, DamageReport, Family, FamilyMember,
  Library, Holiday, RepairRecord, BookTransfer, CompensationMode
} from '../types';
import { initialBooks } from '../data/books';
import { initialLoans } from '../data/loans';
import { initialCheckins } from '../data/checkins';
import { initialCompensations } from '../data/compensations';
import { initialUsers } from '../data/users';
import { initialParents } from '../data/parents';
import { initialSettings } from '../data/settings';
import { initialFamilies } from '../data/families';
import { initialFamilyMembers } from '../data/familyMembers';
import { initialLibraries } from '../data/libraries';
import { initialHolidays } from '../data/holidays';
import { initialRepairRecords } from '../data/repairRecords';
import { initialTransfers } from '../data/transfers';
import { 
  validateLoan, canRenewLoan, 
  computeCompensationAmount, isLoanOverdue,
  getLoanDueDate, getRenewDueDate, canEditDamageReason,
  canEditCompensation, computeTieredCompensation, computeOverdueFine,
  canFamilyBorrow, getFamilyRemainingQuota, canCreateTransfer,
  getFamilyBorrowingCount
} from '../utils/businessRules';
import { today, formatDate, addDays } from '../utils/date';

interface AppState {
  currentUser: User | null;
  currentParent: Parent | null;
  currentFamily: Family | null;
  currentRole: Role;
  users: User[];
  parents: Parent[];
  families: Family[];
  familyMembers: FamilyMember[];
  libraries: Library[];
  holidays: Holiday[];
  books: Book[];
  loans: Loan[];
  checkins: Checkin[];
  compensations: Compensation[];
  repairRecords: RepairRecord[];
  transfers: BookTransfer[];
  settings: LibrarianSettings;
  selectedParentId: string | null;
  selectedLibraryId: string;
  
  setCurrentRole: (role: Role) => void;
  setCurrentUser: (user: User | null) => void;
  setCurrentParent: (parent: Parent | null) => void;
  setCurrentFamily: (family: Family | null) => void;
  setSelectedParentId: (parentId: string | null) => void;
  setSelectedLibraryId: (libraryId: string) => void;
  
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBook: (id: string, book: Partial<Book>) => void;
  deleteBook: (id: string) => void;
  
  createLoan: (bookId: string, parentId: string, memberId?: string) => { success: boolean; message: string };
  returnLoan: (loanId: string, hasDamage?: boolean, damageDescription?: string, damageLevel?: 'minor' | 'moderate' | 'severe' | 'lost', compensationMode?: CompensationMode) => { success: boolean; message: string };
  renewLoan: (loanId: string) => { success: boolean; message: string };
  updateOverdueStatus: () => void;
  postponeOverdue: (loanId: string, days: number, reason: string) => { success: boolean; message: string };
  
  addCheckin: (checkin: Omit<Checkin, 'id' | 'createdAt'>) => void;
  
  createCompensation: (report: DamageReport) => Compensation;
  createOverdueCompensation: (loanId: string) => Compensation | null;
  processCompensation: (id: string, action: 'paid' | 'waived', paymentMethod?: string) => { success: boolean; message: string };
  updateDamageReason: (id: string, reason: string) => { success: boolean; message: string };
  updateCompensationAmount: (id: string, amount: number, mode: CompensationMode, tierRatio: number) => { success: boolean; message: string };
  getCompensationsByStatus: (status: 'pending' | 'paid' | 'waived') => Compensation[];
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  updateSettings: (settings: Partial<LibrarianSettings>) => void;
  
  createRepairRecord: (record: Omit<RepairRecord, 'id'>) => RepairRecord;
  updateRepairRecord: (id: string, updates: Partial<RepairRecord>) => void;
  completeRepair: (id: string, repairCost?: number, repairer?: string, repairNotes?: string) => { success: boolean; message: string };
  scrapBook: (id: string, notes?: string) => { success: boolean; message: string };
  
  createTransfer: (transfer: Omit<BookTransfer, 'id' | 'requestedDate' | 'status'>) => { success: boolean; message: string; transfer?: BookTransfer };
  approveTransfer: (id: string) => { success: boolean; message: string };
  rejectTransfer: (id: string, reason: string) => { success: boolean; message: string };
  shipTransfer: (id: string) => { success: boolean; message: string };
  receiveTransfer: (id: string) => { success: boolean; message: string };
  cancelTransfer: (id: string) => { success: boolean; message: string };
  
  addHoliday: (holiday: Omit<Holiday, 'id' | 'createdAt'>) => Holiday;
  updateHoliday: (id: string, updates: Partial<Holiday>) => void;
  deleteHoliday: (id: string) => void;
  
  getBookById: (id: string) => Book | undefined;
  getLoanById: (id: string) => Loan | undefined;
  getParentById: (id: string) => Parent | undefined;
  getFamilyById: (id: string) => Family | undefined;
  getFamilyMembers: (familyId: string) => FamilyMember[];
  getCompensationById: (id: string) => Compensation | undefined;
  getRepairRecordById: (id: string) => RepairRecord | undefined;
  getTransferById: (id: string) => BookTransfer | undefined;
  getLibraryById: (id: string) => Library | undefined;
  getLoansByParent: (parentId: string) => Loan[];
  getLoansByFamily: (familyId: string) => Loan[];
  getCheckinsByLoan: (loanId: string) => Checkin[];
  getCheckinsByFamily: (familyId: string) => Checkin[];
  getCompensationsByFamily: (familyId: string) => Compensation[];
  getOverdueLoans: () => Loan[];
  getPendingCompensations: () => Compensation[];
  getPendingRepairs: () => RepairRecord[];
  getPendingTransfers: () => BookTransfer[];
  getBooksByLibrary: (libraryId: string) => Book[];
}

const generateId = (prefix: string) => {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentParent: null,
  currentFamily: null,
  currentRole: 'librarian',
  users: initialUsers,
  parents: initialParents,
  families: initialFamilies,
  familyMembers: initialFamilyMembers,
  libraries: initialLibraries,
  holidays: initialHolidays,
  books: initialBooks,
  loans: initialLoans,
  checkins: initialCheckins,
  compensations: initialCompensations,
  repairRecords: initialRepairRecords,
  transfers: initialTransfers,
  settings: initialSettings,
  selectedParentId: null,
  selectedLibraryId: 'lib001',

  setCurrentRole: (role) => {
    set({ currentRole: role });
    if (role === 'librarian') {
      const librarian = get().users.find(u => u.role === 'librarian');
      set({ currentUser: librarian || null, currentParent: null, currentFamily: null });
    } else if (role === 'admin') {
      const admin = get().users.find(u => u.role === 'admin');
      set({ currentUser: admin || null, currentParent: null, currentFamily: null });
    } else if (role === 'parent') {
      const parentUser = get().users.find(u => u.role === 'parent');
      const parent = get().parents[0] || null;
      const family = parent ? get().families.find(f => f.id === parent.familyId) || null : null;
      set({ currentUser: parentUser || null, currentParent: parent, currentFamily: family });
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentParent: (parent) => {
    const family = parent ? get().families.find(f => f.id === parent.familyId) || null : null;
    set({ currentParent: parent, currentFamily: family });
  },
  setCurrentFamily: (family) => set({ currentFamily: family }),
  setSelectedParentId: (parentId) => set({ selectedParentId: parentId }),
  setSelectedLibraryId: (libraryId) => set({ selectedLibraryId: libraryId }),

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

  createLoan: (bookId, parentId, memberId) => {
    const state = get();
    const parent = state.parents.find(p => p.id === parentId);
    const family = parent ? state.families.find(f => f.id === parent.familyId) : undefined;
    const validation = validateLoan(parentId, bookId, state.loans, state.books, state.settings, family, state.holidays);
    
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const loanDate = today();
    const dueDate = getLoanDueDate(loanDate, state.settings, state.holidays);
    const familyId = parent?.familyId || '';
    
    const newLoan: Loan = {
      id: generateId('ln'),
      bookId,
      parentId,
      familyId,
      memberId,
      loanDate,
      dueDate,
      originalDueDate: dueDate,
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
      families: familyId ? state.families.map(f => 
        f.id === familyId 
          ? { ...f, currentBorrowed: f.currentBorrowed + 1 }
          : f
      ) : state.families
    }));

    return { success: true, message: '借阅成功' };
  },

  returnLoan: (loanId, hasDamage = false, damageDescription, damageLevel, compensationMode = 'tiered') => {
    const state = get();
    const loan = state.loans.find((l) => l.id === loanId);
    if (!loan) {
      return { success: false, message: '借阅记录不存在' };
    }

    const returnDate = today();
    const isOverdue = isLoanOverdue({ ...loan, returnDate });
    const actualDamageLevel = hasDamage ? (
      damageLevel || (
        damageDescription?.includes('严重') || damageDescription?.includes('撕') || damageDescription?.includes('撕裂')
          ? 'severe' as const
          : damageDescription?.includes('遗失') || damageDescription?.includes('丢')
          ? 'lost' as const
          : damageDescription?.includes('涂鸦') || damageDescription?.includes('书脊')
          ? 'moderate' as const
          : 'minor' as const
      )
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
              damageLevel: actualDamageLevel,
              isOverdue,
            }
          : l
      ),
      books: state.books.map((b) =>
        b.id === loan.bookId
          ? { 
              ...b, 
              available: b.available + 1, 
              status: hasDamage 
                ? (actualDamageLevel === 'severe' || actualDamageLevel === 'lost' ? 'damaged' : 'available')
                : 'available' 
            }
          : b
      ),
      families: loan.familyId ? state.families.map(f =>
        f.id === loan.familyId
          ? { ...f, currentBorrowed: Math.max(0, f.currentBorrowed - 1) }
          : f
      ) : state.families
    }));

    if (hasDamage && actualDamageLevel) {
      const book = state.books.find((b) => b.id === loan.bookId);
      if (book) {
        get().createCompensation({
          loanId,
          bookId: loan.bookId,
          parentId: loan.parentId,
          damageReason: damageDescription || '归还时发现破损',
          damageLevel: actualDamageLevel,
          compensationMode
        });

        get().createRepairRecord({
          bookId: loan.bookId,
          loanId,
          reportedBy: 'system',
          reportedDate: today(),
          damageDescription: damageDescription || '归还时发现破损',
          damageLevel: actualDamageLevel === 'lost' ? 'severe' : actualDamageLevel,
          status: actualDamageLevel === 'lost' ? 'scrapped' : 'pending',
          libraryId: book.libraryId
        });
      }
    }

    if (isOverdue) {
      get().createOverdueCompensation(loanId);
    }

    return { success: true, message: '归还成功' };
  },

  renewLoan: (loanId) => {
    const state = get();
    const loan = state.loans.find((l) => l.id === loanId);
    
    if (!loan) {
      set((s) => ({
        loans: s.loans.map(l => l.id === loanId 
          ? { ...l, lastRenewResult: 'failed' as const, lastRenewMessage: '借阅记录不存在' }
          : l
        )
      }));
      return { success: false, message: '借阅记录不存在' };
    }

    if (!canRenewLoan(loan, state.settings)) {
      let failMessage = '续借失败';
      if (loan.isOverdue) failMessage = '逾期图书不能续借';
      else if (loan.renewCount >= state.settings.allowRenewalTimes) failMessage = '已达到最大续借次数';
      
      set((s) => ({
        loans: s.loans.map(l => l.id === loanId 
          ? { ...l, lastRenewResult: 'failed' as const, lastRenewMessage: failMessage }
          : l
        )
      }));
      return { success: false, message: failMessage };
    }

    const newDueDate = getRenewDueDate(loan.dueDate, state.settings, state.holidays);

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              dueDate: newDueDate,
              renewCount: l.renewCount + 1,
              status: 'renewed',
              lastRenewResult: 'success',
              lastRenewMessage: `续借成功，新到期日：${newDueDate}`
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

  postponeOverdue: (loanId, days, reason) => {
    const state = get();
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) {
      return { success: false, message: '借阅记录不存在' };
    }

    const newDueDate = addDays(loan.dueDate, days);
    set((s) => ({
      loans: s.loans.map(l => l.id === loanId
        ? { ...l, dueDate: newDueDate, isOverdue: false, status: l.status === 'overdue' ? 'borrowing' : l.status }
        : l
      )
    }));
    return { success: true, message: `已顺延${days}天：${reason}` };
  },

  addCheckin: (checkin) => {
    const parent = get().parents.find(p => p.id === checkin.parentId);
    const familyId = parent?.familyId || '';
    const newCheckin: Checkin = {
      ...checkin,
      familyId,
      id: generateId('ck'),
      createdAt: today(),
    };
    set((state) => ({ checkins: [...state.checkins, newCheckin] }));
  },

  createCompensation: (report) => {
    const state = get();
    const book = state.books.find((b) => b.id === report.bookId);
    const parent = state.parents.find(p => p.id === report.parentId);
    const { amount, ratio, tierName } = book 
      ? computeTieredCompensation(book.price, report.damageLevel, state.settings.compensationTiers)
      : { amount: 0, ratio: 1.0, tierName: '全价赔付' };

    const isFullMode = report.compensationMode === 'full';
    const finalAmount = isFullMode ? (book?.price || 0) : amount;
    const finalRatio = isFullMode ? 1.0 : ratio;

    const newCompensation: Compensation = {
      id: generateId('cp'),
      loanId: report.loanId,
      bookId: report.bookId,
      parentId: report.parentId,
      familyId: parent?.familyId || '',
      type: report.damageLevel === 'lost' ? 'lost' : 'damage',
      damageReason: report.damageReason,
      damageLevel: report.damageLevel,
      compensationMode: report.compensationMode,
      tierRatio: finalRatio,
      amount: finalAmount,
      status: 'pending',
      reportedDate: today(),
      paidDate: null,
      isLocked: false,
    };

    set((state) => ({ compensations: [...state.compensations, newCompensation] }));
    return newCompensation;
  },

  createOverdueCompensation: (loanId) => {
    const state = get();
    const loan = state.loans.find(l => l.id === loanId);
    if (!loan) return null;
    
    const parent = state.parents.find(p => p.id === loan.parentId);
    const fine = computeOverdueFine(loan, state.settings, state.holidays);
    if (fine <= 0) return null;

    const newCompensation: Compensation = {
      id: generateId('cp'),
      loanId,
      bookId: loan.bookId,
      parentId: loan.parentId,
      familyId: parent?.familyId || '',
      type: 'overdue',
      damageReason: `逾期罚款（${loan.dueDate}至${today()}）`,
      compensationMode: 'full',
      tierRatio: 1.0,
      amount: fine,
      status: 'pending',
      reportedDate: today(),
      paidDate: null,
      isLocked: false,
    };

    set((s) => ({ compensations: [...s.compensations, newCompensation] }));
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

  updateCompensationAmount: (id, amount, mode, tierRatio) => {
    const state = get();
    const compensation = state.compensations.find(c => c.id === id);
    if (!compensation) {
      return { success: false, message: '赔付记录不存在' };
    }
    if (!canEditCompensation(compensation)) {
      return { success: false, message: '该记录已锁定，不能修改' };
    }
    set((s) => ({
      compensations: s.compensations.map(c => c.id === id 
        ? { ...c, amount, compensationMode: mode, tierRatio }
        : c
      )
    }));
    return { success: true, message: '赔付金额已更新' };
  },

  updateSettings: (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }));
  },

  createRepairRecord: (record) => {
    const newRecord: RepairRecord = {
      ...record,
      id: generateId('rp')
    };
    set((s) => ({ repairRecords: [...s.repairRecords, newRecord] }));
    
    if (record.status === 'pending' || record.status === 'repairing') {
      set((s) => ({
        books: s.books.map(b => b.id === record.bookId 
          ? { ...b, status: 'repairing' }
          : b
        )
      }));
    }
    return newRecord;
  },

  updateRepairRecord: (id, updates) => {
    set((s) => ({
      repairRecords: s.repairRecords.map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  },

  completeRepair: (id, repairCost, repairer, repairNotes) => {
    const state = get();
    const record = state.repairRecords.find(r => r.id === id);
    if (!record) return { success: false, message: '修补记录不存在' };
    
    set((s) => ({
      repairRecords: s.repairRecords.map(r => r.id === id 
        ? { ...r, status: 'completed', completedDate: today(), repairCost, repairer, repairNotes }
        : r
      ),
      books: s.books.map(b => b.id === record.bookId
        ? { ...b, status: 'available' }
        : b
      )
    }));
    return { success: true, message: '修补完成，已重新入库' };
  },

  scrapBook: (id, notes) => {
    const state = get();
    const record = state.repairRecords.find(r => r.id === id);
    if (!record) return { success: false, message: '修补记录不存在' };
    
    set((s) => ({
      repairRecords: s.repairRecords.map(r => r.id === id
        ? { ...r, status: 'scrapped', completedDate: today(), repairNotes: notes || r.repairNotes }
        : r
      ),
      books: s.books.map(b => b.id === record.bookId
        ? { ...b, status: 'lost', available: Math.max(0, b.available - 1), stock: Math.max(0, b.stock - 1) }
        : b
      )
    }));
    return { success: true, message: '已登记报废' };
  },

  createTransfer: (transfer) => {
    const state = get();
    const validation = canCreateTransfer(transfer, state.books);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const newTransfer: BookTransfer = {
      ...transfer,
      id: generateId('tr'),
      requestedDate: today(),
      status: 'pending'
    };
    set((s) => ({ transfers: [...s.transfers, newTransfer] }));
    return { success: true, message: '调拨申请已提交', transfer: newTransfer };
  },

  approveTransfer: (id) => {
    const state = get();
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) return { success: false, message: '调拨记录不存在' };
    if (transfer.status !== 'pending') return { success: false, message: '该调拨状态不允许审批' };

    const book = state.books.find(b => b.id === transfer.bookId);
    if (!book || book.available < transfer.quantity) {
      return { success: false, message: '库存不足，无法批准' };
    }

    set((s) => ({
      transfers: s.transfers.map(t => t.id === id 
        ? { ...t, status: 'approved', approvedBy: 'admin', approvedDate: today() }
        : t
      ),
      books: s.books.map(b => b.id === transfer.bookId
        ? { ...b, available: b.available - transfer.quantity }
        : b
      )
    }));
    return { success: true, message: '调拨已批准' };
  },

  rejectTransfer: (id, reason) => {
    const state = get();
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) return { success: false, message: '调拨记录不存在' };

    set((s) => ({
      transfers: s.transfers.map(t => t.id === id
        ? { ...t, status: 'rejected', notes: reason }
        : t
      )
    }));
    return { success: true, message: '调拨已驳回' };
  },

  shipTransfer: (id) => {
    set((s) => ({
      transfers: s.transfers.map(t => t.id === id
        ? { ...t, status: 'in_transit', shippedDate: today() }
        : t
      )
    }));
    return { success: true, message: '已发货' };
  },

  receiveTransfer: (id) => {
    const state = get();
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) return { success: false, message: '调拨记录不存在' };

    const targetBook = state.books.find(b => b.id === transfer.bookId && b.libraryId === transfer.toLibraryId);
    const sourceBook = state.books.find(b => b.id === transfer.bookId && b.libraryId === transfer.fromLibraryId);

    set((s) => {
      let newBooks = [...s.books];
      
      if (targetBook) {
        newBooks = newBooks.map(b => b.id === targetBook.id && b.libraryId === transfer.toLibraryId
          ? { ...b, stock: b.stock + transfer.quantity, available: b.available + transfer.quantity }
          : b
        );
      } else if (sourceBook) {
        const newBookCopy: Book = {
          ...sourceBook,
          id: generateId('bk'),
          libraryId: transfer.toLibraryId,
          stock: transfer.quantity,
          available: transfer.quantity,
          location: '新调拨-待上架',
          createdAt: today(),
          updatedAt: today()
        };
        newBooks = [...newBooks, newBookCopy];
      }

      newBooks = newBooks.map(b => b.id === transfer.bookId && b.libraryId === transfer.fromLibraryId
        ? { ...b, stock: Math.max(0, b.stock - transfer.quantity) }
        : b
      );

      return {
        transfers: s.transfers.map(t => t.id === id
          ? { ...t, status: 'completed', receivedDate: today() }
          : t
        ),
        books: newBooks
      };
    });
    return { success: true, message: '调拨完成，已入库' };
  },

  cancelTransfer: (id) => {
    const state = get();
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer) return { success: false, message: '调拨记录不存在' };
    if (transfer.status === 'in_transit' || transfer.status === 'completed') {
      return { success: false, message: '运输中或已完成的调拨不能取消' };
    }

    if (transfer.status === 'approved') {
      set((s) => ({
        books: s.books.map(b => b.id === transfer.bookId && b.libraryId === transfer.fromLibraryId
          ? { ...b, available: b.available + transfer.quantity }
          : b
        )
      }));
    }

    set((s) => ({
      transfers: s.transfers.map(t => t.id === id
        ? { ...t, status: 'cancelled' }
        : t
      )
    }));
    return { success: true, message: '调拨已取消' };
  },

  addHoliday: (holiday) => {
    const newHoliday: Holiday = {
      ...holiday,
      id: generateId('hd'),
      createdAt: today()
    };
    set((s) => ({ holidays: [...s.holidays, newHoliday] }));
    return newHoliday;
  },

  updateHoliday: (id, updates) => {
    set((s) => ({
      holidays: s.holidays.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  },

  deleteHoliday: (id) => {
    set((s) => ({
      holidays: s.holidays.filter(h => h.id !== id)
    }));
  },

  getBookById: (id) => get().books.find((b) => b.id === id),
  getLoanById: (id) => get().loans.find((l) => l.id === id),
  getParentById: (id) => get().parents.find((p) => p.id === id),
  getFamilyById: (id) => get().families.find((f) => f.id === id),
  getFamilyMembers: (familyId) => get().familyMembers.filter(m => m.familyId === familyId),
  getCompensationById: (id) => get().compensations.find((c) => c.id === id),
  getRepairRecordById: (id) => get().repairRecords.find(r => r.id === id),
  getTransferById: (id) => get().transfers.find(t => t.id === id),
  getLibraryById: (id) => get().libraries.find(l => l.id === id),
  getLoansByParent: (parentId) => get().loans.filter((l) => l.parentId === parentId),
  getLoansByFamily: (familyId) => get().loans.filter(l => l.familyId === familyId),
  getCheckinsByLoan: (loanId) => get().checkins.filter((c) => c.loanId === loanId),
  getCheckinsByFamily: (familyId) => get().checkins.filter(c => c.familyId === familyId),
  getCompensationsByFamily: (familyId) => get().compensations.filter(c => c.familyId === familyId),
  getOverdueLoans: () => get().loans.filter((l) => l.isOverdue || l.status === 'overdue'),
  getPendingCompensations: () => get().compensations.filter((c) => c.status === 'pending'),
  getPendingRepairs: () => get().repairRecords.filter(r => r.status === 'pending' || r.status === 'repairing'),
  getPendingTransfers: () => get().transfers.filter(t => t.status === 'pending' || t.status === 'approved' || t.status === 'in_transit'),
  getBooksByLibrary: (libraryId) => get().books.filter(b => b.libraryId === libraryId),
  getCompensationsByStatus: (status) => get().compensations.filter((c) => c.status === status),
  updateLoan: (id, updates) => {
    set((state) => ({
      loans: state.loans.map((l) => l.id === id ? { ...l, ...updates } : l),
    }));
  },
}));

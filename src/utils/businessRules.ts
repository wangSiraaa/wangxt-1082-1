import type { Loan, Book, Parent, Compensation, LibrarianSettings, Holiday, Family, FamilyMember, CompensationTier, BookTransfer, RepairRecord } from '../types';
import { daysBetween, today, addDays, getOverdueDays, formatDate } from './date';

export function canParentBorrow(parentId: string, loans: Loan[]): boolean {
  const parentLoans = loans.filter(loan => loan.parentId === parentId && loan.status !== 'returned');
  const hasOverdue = parentLoans.some(loan => loan.status === 'overdue' || loan.isOverdue);
  return !hasOverdue;
}

export function canFamilyBorrow(familyId: string, loans: Loan[], family?: Family): boolean {
  if (!family) return true;
  const familyLoans = loans.filter(loan => loan.familyId === familyId && loan.status !== 'returned');
  const hasOverdue = familyLoans.some(loan => loan.status === 'overdue' || loan.isOverdue);
  if (hasOverdue) return false;
  return familyLoans.length < family.borrowQuota;
}

export function getFamilyBorrowingCount(familyId: string, loans: Loan[]): number {
  return loans.filter(loan => loan.familyId === familyId && loan.status !== 'returned').length;
}

export function getFamilyRemainingQuota(family: Family, loans: Loan[]): number {
  const borrowed = getFamilyBorrowingCount(family.id, loans);
  return Math.max(0, family.borrowQuota - borrowed);
}

export function getParentBorrowingCount(parentId: string, loans: Loan[]): number {
  return loans.filter(loan => loan.parentId === parentId && loan.status !== 'returned').length;
}

export function canRenewLoan(loan: Loan, settings: LibrarianSettings): boolean {
  if (loan.status === 'returned') return false;
  if (loan.isOverdue) return false;
  if (loan.renewCount >= settings.allowRenewalTimes) return false;
  return true;
}

export function getHolidaysBetween(startDate: string, endDate: string, holidays: Holiday[]): Holiday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return holidays.filter(h => {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    return !(end < hStart || start > hEnd);
  });
}

export function getHolidayDaysBetween(startDate: string, endDate: string, holidays: Holiday[]): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalDays = 0;

  holidays.forEach(h => {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    const overlapStart = start > hStart ? start : hStart;
    const overlapEnd = end < hEnd ? end : hEnd;
    if (overlapStart <= overlapEnd) {
      totalDays += Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  });

  return totalDays;
}

export function adjustDueDateForHolidays(dueDate: string, holidays: Holiday[], settings: LibrarianSettings): string {
  if (!settings.allowHolidayPostpone) return dueDate;
  
  const loanEnd = new Date(dueDate);
  const overlappingHolidays = getHolidaysBetween(dueDate, dueDate, holidays);
  
  if (overlappingHolidays.length === 0) return dueDate;

  let extraDays = 0;
  overlappingHolidays.forEach(h => {
    const hEnd = new Date(h.endDate);
    if (hEnd > loanEnd) {
      extraDays += Math.ceil((hEnd.getTime() - loanEnd.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
  });

  return extraDays > 0 ? addDays(dueDate, extraDays) : dueDate;
}

export function computeCompensationAmount(bookPrice: number, damageLevel: 'minor' | 'moderate' | 'severe' | 'lost', tiers: CompensationTier[]): number {
  const tier = tiers.find(t => t.level === damageLevel);
  const ratio = tier ? tier.ratio : 1.0;
  return Math.round(bookPrice * ratio * 100) / 100;
}

export function computeTieredCompensation(bookPrice: number, damageLevel: 'minor' | 'moderate' | 'severe' | 'lost', tiers: CompensationTier[]): { amount: number; ratio: number; tierName: string } {
  const tier = tiers.find(t => t.level === damageLevel);
  const ratio = tier ? tier.ratio : 1.0;
  const tierName = tier ? tier.name : '全价赔付';
  const amount = Math.round(bookPrice * ratio * 100) / 100;
  return { amount, ratio, tierName };
}

export function computeOverdueFine(loan: Loan, settings: LibrarianSettings, holidays?: Holiday[]): number {
  if (!loan.isOverdue) return 0;
  let overdueDays = getOverdueDays(loan.dueDate);
  if (settings.allowHolidayPostpone && holidays && overdueDays > 0) {
    const holidayDays = getHolidayDaysBetween(loan.dueDate, today(), holidays);
    overdueDays = Math.max(0, overdueDays - holidayDays);
  }
  return Math.round(overdueDays * settings.overdueFinePerDay * 100) / 100;
}

export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status === 'returned') return false;
  if (loan.returnDate) return false;
  return daysBetween(new Date(loan.dueDate), new Date()) > 0;
}

export function isBookAvailable(book: Book): boolean {
  return book.available > 0 && book.status === 'available';
}

export function canEditDamageReason(compensation: Compensation): boolean {
  return !compensation.isLocked && compensation.status !== 'paid';
}

export function canEditCompensation(compensation: Compensation): boolean {
  return !compensation.isLocked;
}

export function getLoanDueDate(loanDate: string, settings: LibrarianSettings, holidays?: Holiday[]): string {
  let dueDate = addDays(loanDate, settings.defaultLoanDays);
  if (settings.allowHolidayPostpone && holidays) {
    dueDate = adjustDueDateForHolidays(dueDate, holidays, settings);
  }
  return dueDate;
}

export function getRenewDueDate(currentDueDate: string, settings: LibrarianSettings, holidays?: Holiday[]): string {
  let newDueDate = addDays(currentDueDate, settings.defaultLoanDays);
  if (settings.allowHolidayPostpone && holidays) {
    newDueDate = adjustDueDateForHolidays(newDueDate, holidays, settings);
  }
  return newDueDate;
}

export function shouldShowDamagePrompt(loan: Loan): boolean {
  return loan.hasDamage && loan.status === 'borrowing';
}

export function getOverdueLoans(loans: Loan[]): Loan[] {
  return loans.filter(loan => loan.isOverdue || loan.status === 'overdue');
}

export function getPendingCompensations(compensations: Compensation[]): Compensation[] {
  return compensations.filter(c => c.status === 'pending');
}

export function getDamageLevelText(level: 'minor' | 'moderate' | 'severe' | 'lost'): string {
  const map = {
    minor: '轻微破损',
    moderate: '中度破损',
    severe: '严重破损',
    lost: '遗失'
  };
  return map[level];
}

export function getCompensationModeText(mode: 'tiered' | 'full'): string {
  return mode === 'tiered' ? '阶梯赔付' : '全价报损';
}

export function getCompensationTypeText(type: 'damage' | 'lost' | 'overdue'): string {
  const map = {
    damage: '破损赔付',
    lost: '遗失赔付',
    overdue: '逾期罚款'
  };
  return map[type];
}

export function getStatusText(status: Loan['status']): string {
  const map = {
    borrowing: '借阅中',
    returned: '已归还',
    overdue: '已逾期',
    renewed: '已续借'
  };
  return map[status];
}

export function getCompensationStatusText(status: Compensation['status']): string {
  const map = {
    pending: '待处理',
    paid: '已赔付',
    waived: '已减免'
  };
  return map[status];
}

export function getMemberLevelText(level: Parent['memberLevel']): string {
  const map = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员'
  };
  return map[level];
}

export function getRepairStatusText(status: RepairRecord['status']): string {
  const map = {
    pending: '待修补',
    repairing: '修补中',
    completed: '已完成',
    scrapped: '已报废'
  };
  return map[status];
}

export function getTransferStatusText(status: BookTransfer['status']): string {
  const map = {
    pending: '待审批',
    approved: '已批准',
    in_transit: '运输中',
    completed: '已完成',
    rejected: '已驳回',
    cancelled: '已取消'
  };
  return map[status];
}

export function checkDuplicateThemeBooks(familyId: string, newBookId: string, loans: Loan[], books: Book[]): { hasDuplicate: boolean; count: number; theme?: string } {
  const newBook = books.find(b => b.id === newBookId);
  if (!newBook || !newBook.theme) return { hasDuplicate: false, count: 0 };

  const activeLoans = loans.filter(l => l.familyId === familyId && l.status !== 'returned');
  const sameThemeBooks = activeLoans.filter(loan => {
    const book = books.find(b => b.id === loan.bookId);
    return book && book.theme === newBook.theme;
  });

  return {
    hasDuplicate: sameThemeBooks.length >= 2,
    count: sameThemeBooks.length,
    theme: newBook.theme
  };
}

export function validateLoan(parentId: string, bookId: string, loans: Loan[], books: Book[], settings: LibrarianSettings, family?: Family, holidays?: Holiday[]): { valid: boolean; message: string } {
  if (family) {
    if (!canFamilyBorrow(family.id, loans, family)) {
      const borrowed = getFamilyBorrowingCount(family.id, loans);
      if (borrowed >= family.borrowQuota) {
        return { valid: false, message: `家庭借阅额度已用完（${borrowed}/${family.borrowQuota}本），请先归还部分图书` };
      }
      return { valid: false, message: '家庭中有逾期未还的绘本，暂不能借阅新书' };
    }
  } else if (!canParentBorrow(parentId, loans)) {
    return { valid: false, message: '您有逾期未还的绘本，暂不能借阅新书' };
  }

  const book = books.find(b => b.id === bookId);
  if (!book) {
    return { valid: false, message: '绘本不存在' };
  }

  if (!isBookAvailable(book)) {
    return { valid: false, message: '该绘本暂无库存' };
  }

  if (family) {
    const themeCheck = checkDuplicateThemeBooks(family.id, bookId, loans, books);
    if (themeCheck.hasDuplicate) {
      return { valid: false, message: `同主题（${themeCheck.theme}）绘本已借阅${themeCheck.count}本，为了阅读多样性，请选择其他主题的图书` };
    }
  }

  if (settings.maxBorrowCount) {
    const currentCount = getParentBorrowingCount(parentId, loans);
    if (currentCount >= settings.maxBorrowCount) {
      return { valid: false, message: `您已借阅${currentCount}本，达到最大借阅数量限制` };
    }
  }

  return { valid: true, message: '' };
}

export function getFamilyMemberCheckinStats(familyId: string, checkins: any[], members: FamilyMember[]): { memberId: string; memberName: string; checkinCount: number; totalMinutes: number }[] {
  return members
    .filter(m => m.familyId === familyId)
    .map(member => {
      const memberCheckins = checkins.filter(c => c.memberId === member.id);
      return {
        memberId: member.id,
        memberName: member.name,
        checkinCount: memberCheckins.length,
        totalMinutes: memberCheckins.reduce((sum, c) => sum + (c.durationMinutes || 0), 0)
      };
    });
}

export function getLastRenewResult(loans: Loan[], familyId?: string): { loan: Loan; book?: Book; books?: Book[] } | null {
  const familyLoans = familyId 
    ? loans.filter(l => l.familyId === familyId && l.lastRenewResult)
    : loans.filter(l => l.lastRenewResult);
  
  if (familyLoans.length === 0) return null;
  
  const sorted = familyLoans.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  return { loan: sorted[0] };
}

export function canCreateTransfer(transfer: Partial<BookTransfer>, books: Book[]): { valid: boolean; message: string } {
  if (!transfer.bookId || !transfer.fromLibraryId || !transfer.toLibraryId || !transfer.quantity) {
    return { valid: false, message: '请填写完整的调拨信息' };
  }
  if (transfer.fromLibraryId === transfer.toLibraryId) {
    return { valid: false, message: '调出馆和调入馆不能相同' };
  }
  const book = books.find(b => b.id === transfer.bookId);
  if (!book) {
    return { valid: false, message: '绘本不存在' };
  }
  if (book.libraryId !== transfer.fromLibraryId) {
    return { valid: false, message: '该绘本不在调出馆库存中' };
  }
  if ((transfer.quantity || 0) > book.available) {
    return { valid: false, message: `调出馆可用库存不足（仅剩${book.available}本）` };
  }
  return { valid: true, message: '' };
}

export function getThemeStockDiff(books: Book[], libraries: any[]): { theme: string; totalStock: number; libraryStocks: any[] }[] {
  const themeMap = new Map<string, { theme: string; totalStock: number; libraryStocks: Map<string, any> }>();

  books.forEach(book => {
    if (!book.theme) return;
    if (!themeMap.has(book.theme)) {
      themeMap.set(book.theme, {
        theme: book.theme,
        totalStock: 0,
        libraryStocks: new Map()
      });
    }
    const themeData = themeMap.get(book.theme)!;
    themeData.totalStock += book.stock;
    
    if (!themeData.libraryStocks.has(book.libraryId)) {
      const library = libraries.find(l => l.id === book.libraryId);
      themeData.libraryStocks.set(book.libraryId, {
        libraryId: book.libraryId,
        libraryName: library?.name || '未知',
        stock: 0,
        available: 0
      });
    }
    const libStock = themeData.libraryStocks.get(book.libraryId)!;
    libStock.stock += book.stock;
    libStock.available += book.available;
  });

  return Array.from(themeMap.values()).map(item => ({
    theme: item.theme,
    totalStock: item.totalStock,
    libraryStocks: Array.from(item.libraryStocks.values())
  }));
}

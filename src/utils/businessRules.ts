import type { Loan, Book, Parent, Compensation, LibrarianSettings } from '../types';
import { daysBetween, today, addDays, getOverdueDays } from './date';

export function canParentBorrow(parentId: string, loans: Loan[]): boolean {
  const parentLoans = loans.filter(loan => loan.parentId === parentId && loan.status !== 'returned');
  const hasOverdue = parentLoans.some(loan => loan.status === 'overdue' || loan.isOverdue);
  return !hasOverdue;
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

export function computeCompensationAmount(bookPrice: number, damageLevel: 'minor' | 'severe' | 'lost'): number {
  const ratios = {
    minor: 0.2,
    severe: 0.6,
    lost: 1.0,
  };
  return Math.round(bookPrice * ratios[damageLevel] * 100) / 100;
}

export function computeOverdueFine(loan: Loan, settings: LibrarianSettings): number {
  if (!loan.isOverdue) return 0;
  const overdueDays = getOverdueDays(loan.dueDate);
  return Math.round(overdueDays * settings.overdueFinePerDay * 100) / 100;
}

export function isLoanOverdue(loan: Loan): boolean {
  if (loan.status === 'returned') {
    return false;
  }
  if (loan.returnDate) {
    return false;
  }
  return daysBetween(new Date(loan.dueDate), new Date()) > 0;
}

export function isBookAvailable(book: Book): boolean {
  return book.available > 0 && book.status === 'available';
}

export function canEditDamageReason(compensation: Compensation): boolean {
  return !compensation.isLocked && compensation.status !== 'paid';
}

export function getLoanDueDate(loanDate: string, settings: LibrarianSettings): string {
  return addDays(loanDate, settings.defaultLoanDays);
}

export function getRenewDueDate(currentDueDate: string, settings: LibrarianSettings): string {
  return addDays(currentDueDate, settings.defaultLoanDays);
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

export function getDamageLevelText(level: 'minor' | 'severe' | 'lost'): string {
  const map = {
    minor: '轻微破损',
    severe: '严重破损',
    lost: '遗失'
  };
  return map[level];
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

export function validateLoan(parentId: string, bookId: string, loans: Loan[], books: Book[], settings: LibrarianSettings): { valid: boolean; message: string } {
  if (!canParentBorrow(parentId, loans)) {
    return { valid: false, message: '您有逾期未还的绘本，暂不能借阅新书' };
  }

  const book = books.find(b => b.id === bookId);
  if (!book) {
    return { valid: false, message: '绘本不存在' };
  }

  if (!isBookAvailable(book)) {
    return { valid: false, message: '该绘本暂无库存' };
  }

  if (settings.maxBorrowCount) {
    const currentCount = getParentBorrowingCount(parentId, loans);
    if (currentCount >= settings.maxBorrowCount) {
      return { valid: false, message: `您已借阅${currentCount}本，达到最大借阅数量限制` };
    }
  }

  return { valid: true, message: '' };
}

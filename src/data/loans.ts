import type { Loan } from "../types";

export const initialLoans: Loan[] = [
  { id: "ln001", bookId: "bk001", parentId: "pt001", loanDate: "2026-05-01", dueDate: "2026-05-15", returnDate: null, status: "borrowing", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-01" },
  { id: "ln002", bookId: "bk002", parentId: "pt002", loanDate: "2026-05-03", dueDate: "2026-05-17", returnDate: "2026-05-16", status: "returned", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-03" },
  { id: "ln003", bookId: "bk003", parentId: "pt003", loanDate: "2026-04-20", dueDate: "2026-05-04", returnDate: null, status: "overdue", isOverdue: true, hasDamage: false, renewCount: 0, createdAt: "2026-04-20" },
  { id: "ln004", bookId: "bk004", parentId: "pt004", loanDate: "2026-05-05", dueDate: "2026-05-19", returnDate: null, status: "borrowing", isOverdue: false, hasDamage: true, renewCount: 0, createdAt: "2026-05-05" },
  { id: "ln005", bookId: "bk005", parentId: "pt005", loanDate: "2026-04-15", dueDate: "2026-04-29", returnDate: null, status: "overdue", isOverdue: true, hasDamage: true, renewCount: 0, createdAt: "2026-04-15" },
  { id: "ln006", bookId: "bk006", parentId: "pt001", loanDate: "2026-05-08", dueDate: "2026-05-22", returnDate: "2026-05-21", status: "returned", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-08" },
  { id: "ln007", bookId: "bk007", parentId: "pt002", loanDate: "2026-05-10", dueDate: "2026-05-24", returnDate: null, status: "borrowing", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-10" },
  { id: "ln008", bookId: "bk008", parentId: "pt006", loanDate: "2026-05-02", dueDate: "2026-05-16", returnDate: "2026-05-15", status: "returned", isOverdue: false, hasDamage: true, renewCount: 0, createdAt: "2026-05-02" },
  { id: "ln009", bookId: "bk009", parentId: "pt003", loanDate: "2026-05-06", dueDate: "2026-05-20", returnDate: null, status: "borrowing", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-06" },
  { id: "ln010", bookId: "bk010", parentId: "pt005", loanDate: "2026-05-07", dueDate: "2026-05-21", returnDate: "2026-05-20", status: "returned", isOverdue: false, hasDamage: false, renewCount: 0, createdAt: "2026-05-07" },
];

export default initialLoans;

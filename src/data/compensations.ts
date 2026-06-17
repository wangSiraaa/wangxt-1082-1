import type { Compensation } from "../types";

export const initialCompensations: Compensation[] = [
  { id: "cp001", loanId: "ln004", bookId: "bk004", parentId: "pt004", damageReason: "封面有轻微折痕", amount: 7.16, status: "pending", reportedDate: "2026-05-15", paidDate: null, isLocked: false },
  { id: "cp002", loanId: "ln005", bookId: "bk005", parentId: "pt005", damageReason: "页面有多处涂鸦", amount: 34.8, status: "paid", reportedDate: "2026-05-02", paidDate: "2026-05-08", isLocked: true },
  { id: "cp003", loanId: "ln008", bookId: "bk008", parentId: "pt006", damageReason: "书脊脱落，修复后可用", amount: 9.0, status: "waived", reportedDate: "2026-05-18", paidDate: null, isLocked: false },
  { id: "cp004", loanId: "ln003", bookId: "bk003", parentId: "pt003", damageReason: "逾期超期罚款", amount: 25.0, status: "pending", reportedDate: "2026-05-08", paidDate: null, isLocked: false },
  { id: "cp005", loanId: "ln001", bookId: "bk001", parentId: "pt001", damageReason: "整本书丢失", amount: 39.8, status: "paid", reportedDate: "2026-05-12", paidDate: "2026-05-14", isLocked: true },
];

export default initialCompensations;

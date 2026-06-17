import type { Compensation } from "../types";

export const initialCompensations: Compensation[] = [
  { id: "cp001", loanId: "ln004", bookId: "bk004", parentId: "pt004", familyId: "fm004", type: "damage", damageReason: "封面有轻微折痕", damageLevel: "minor", compensationMode: "tiered", tierRatio: 0.2, amount: 7.16, status: "pending", reportedDate: "2026-05-15", paidDate: null, isLocked: false },
  { id: "cp002", loanId: "ln005", bookId: "bk005", parentId: "pt005", familyId: "fm005", type: "damage", damageReason: "页面有多处涂鸦，内页撕裂", damageLevel: "severe", compensationMode: "tiered", tierRatio: 0.6, amount: 34.8, status: "paid", reportedDate: "2026-05-02", paidDate: "2026-05-08", isLocked: true, paymentMethod: "wechat" },
  { id: "cp003", loanId: "ln008", bookId: "bk008", parentId: "pt006", familyId: "fm006", type: "damage", damageReason: "书脊脱落，修复后可用", damageLevel: "moderate", compensationMode: "tiered", tierRatio: 0.4, amount: 18.0, status: "waived", reportedDate: "2026-05-18", paidDate: null, isLocked: true, notes: "首次破损且家长主动说明，予以减免" },
  { id: "cp004", loanId: "ln003", bookId: "bk003", parentId: "pt003", familyId: "fm003", type: "overdue", damageReason: "逾期超期罚款", compensationMode: "full", tierRatio: 1.0, amount: 25.0, status: "pending", reportedDate: "2026-05-08", paidDate: null, isLocked: false },
  { id: "cp005", loanId: "ln001", bookId: "bk001", parentId: "pt001", familyId: "fm001", type: "lost", damageReason: "整本书丢失", damageLevel: "lost", compensationMode: "full", tierRatio: 1.0, amount: 39.8, status: "paid", reportedDate: "2026-05-12", paidDate: "2026-05-14", isLocked: true, paymentMethod: "alipay" },
];

export default initialCompensations;

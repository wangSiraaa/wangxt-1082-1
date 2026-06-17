import type { RepairRecord } from '../types';

export const initialRepairRecords: RepairRecord[] = [
  {
    id: 'rp001',
    bookId: 'bk004',
    loanId: 'ln004',
    reportedBy: 'lib001',
    reportedDate: '2026-05-15',
    damageDescription: '封面有轻微折痕，边角磨损',
    damageLevel: 'minor',
    status: 'pending',
    libraryId: 'lib001'
  },
  {
    id: 'rp002',
    bookId: 'bk008',
    loanId: 'ln008',
    reportedBy: 'lib002',
    reportedDate: '2026-05-18',
    damageDescription: '书脊脱落，页面有涂鸦',
    damageLevel: 'moderate',
    repairCost: 25,
    repairer: '张师傅',
    repairNotes: '已重新装订，清除涂鸦',
    completedDate: '2026-05-22',
    status: 'completed',
    libraryId: 'lib002'
  },
  {
    id: 'rp003',
    bookId: 'bk005',
    loanId: 'ln005',
    reportedBy: 'lib001',
    reportedDate: '2026-05-10',
    damageDescription: '内页多处撕裂，封面破损严重',
    damageLevel: 'severe',
    repairCost: 50,
    repairer: '张师傅',
    status: 'repairing',
    libraryId: 'lib001'
  },
  {
    id: 'rp004',
    bookId: 'bk012',
    reportedBy: 'lib003',
    reportedDate: '2026-05-20',
    damageDescription: '封面有水渍，部分页面粘连',
    damageLevel: 'moderate',
    status: 'pending',
    libraryId: 'lib003'
  }
];

export default initialRepairRecords;

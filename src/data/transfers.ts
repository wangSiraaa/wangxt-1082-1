import type { BookTransfer } from '../types';

export const initialTransfers: BookTransfer[] = [
  {
    id: 'tr001',
    bookId: 'bk001',
    fromLibraryId: 'lib001',
    toLibraryId: 'lib002',
    quantity: 2,
    requestedBy: 'admin',
    requestedDate: '2026-05-10',
    approvedBy: 'admin',
    approvedDate: '2026-05-11',
    shippedDate: '2026-05-12',
    receivedDate: '2026-05-14',
    status: 'completed',
    reason: '城东分馆库存不足，需求较大',
    notes: '已签收确认'
  },
  {
    id: 'tr002',
    bookId: 'bk002',
    fromLibraryId: 'lib001',
    toLibraryId: 'lib003',
    quantity: 3,
    requestedBy: 'admin',
    requestedDate: '2026-05-15',
    approvedBy: 'admin',
    approvedDate: '2026-05-16',
    shippedDate: '2026-05-17',
    status: 'in_transit',
    reason: '城西分馆儿童节活动需要',
    notes: '运输中'
  },
  {
    id: 'tr003',
    bookId: 'bk006',
    fromLibraryId: 'lib002',
    toLibraryId: 'lib001',
    quantity: 2,
    requestedBy: 'lib001',
    requestedDate: '2026-05-18',
    status: 'pending',
    reason: '国学启蒙类书籍需求增加',
  },
  {
    id: 'tr004',
    bookId: 'bk010',
    fromLibraryId: 'lib003',
    toLibraryId: 'lib001',
    quantity: 1,
    requestedBy: 'lib001',
    requestedDate: '2026-05-12',
    status: 'rejected',
    reason: '城西分馆自身库存也不足',
    notes: '审批驳回：请调整调拨数量'
  }
];

export default initialTransfers;

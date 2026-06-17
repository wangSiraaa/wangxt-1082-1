import type { Holiday } from '../types';

export const initialHolidays: Holiday[] = [
  {
    id: 'hd001',
    name: '元旦',
    startDate: '2026-01-01',
    endDate: '2026-01-03',
    type: 'national',
    createdAt: '2025-12-01'
  },
  {
    id: 'hd002',
    name: '春节',
    startDate: '2026-02-16',
    endDate: '2026-02-22',
    type: 'national',
    createdAt: '2025-12-01'
  },
  {
    id: 'hd003',
    name: '清明节',
    startDate: '2026-04-04',
    endDate: '2026-04-06',
    type: 'national',
    createdAt: '2025-12-01'
  },
  {
    id: 'hd004',
    name: '劳动节',
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    type: 'national',
    createdAt: '2025-12-01'
  },
  {
    id: 'hd005',
    name: '端午节',
    startDate: '2026-06-19',
    endDate: '2026-06-21',
    type: 'national',
    createdAt: '2025-12-01'
  },
  {
    id: 'hd006',
    name: '暑假',
    startDate: '2026-07-15',
    endDate: '2026-08-31',
    type: 'custom',
    createdAt: '2026-05-01'
  },
  {
    id: 'hd007',
    name: '国庆节',
    startDate: '2026-10-01',
    endDate: '2026-10-07',
    type: 'national',
    createdAt: '2025-12-01'
  }
];

export default initialHolidays;

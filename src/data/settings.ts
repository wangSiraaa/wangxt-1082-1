import type { LibrarianSettings } from "../types";

export const initialSettings: LibrarianSettings = {
  defaultLoanDays: 14,
  allowRenewalTimes: 2,
  allowOverdue: false,
  enableOverdueReminder: true,
  overdueFinePerDay: 0.5,
  maxBorrowCount: 5,
  allowHolidayPostpone: true,
  compensationTiers: [
    { level: 'minor', name: '轻微破损', ratio: 0.2, description: '封面/边角轻微磨损、小范围折痕，不影响阅读' },
    { level: 'moderate', name: '中度破损', ratio: 0.4, description: '书页少量涂鸦、书脊轻微松动、小面积污渍' },
    { level: 'severe', name: '严重破损', ratio: 0.6, description: '内页撕裂、书脊脱落、大面积涂鸦或水渍' },
    { level: 'lost', name: '遗失', ratio: 1.0, description: '图书遗失或破损至无法修复，按全价赔偿' }
  ]
};

export default initialSettings;

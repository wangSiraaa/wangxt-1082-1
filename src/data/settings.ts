import type { LibrarianSettings } from "../types";

export const initialSettings: LibrarianSettings = {
  defaultLoanDays: 14,
  allowRenewalTimes: 2,
  allowOverdue: false,
  enableOverdueReminder: true,
  overdueFinePerDay: 0.5,
};

export default initialSettings;

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function daysBetween(date1: Date, date2: string | Date): number {
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = d2.getTime() - date1.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export function today(): string {
  return formatDate(new Date());
}

export function getOverdueDays(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = daysBetween(due, now);
  return diff > 0 ? diff : 0;
}

export function isDateInPast(date: string): boolean {
  return daysBetween(new Date(date), new Date()) > 0;
}

export function getAgeText(age: number): string {
  if (age < 1) return '未满1岁';
  if (age === 1) return '1岁';
  return `${age}岁`;
}

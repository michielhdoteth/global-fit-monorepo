/**
 * Date Utilities
 * Helper functions for date/time handling
 */

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateAsString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateString(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * Format time as HH:mm
 */
export function formatTimeAsString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Check if current time is within business hours
 */
export function isWithinBusinessHours(
  startTime: string,
  endTime: string
): boolean {
  const now = new Date();
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  const currentTotalMins = currentHour * 60 + currentMin;
  const startTotalMins = startHour * 60 + startMin;
  const endTotalMins = endHour * 60 + endMin;

  return currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins;
}

/**
 * Get the day of week (0 = Monday, 6 = Sunday)
 */
export function getDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if appointment is today
 */
export function isToday(dateStr: string): boolean {
  const today = formatDateAsString(new Date());
  return dateStr === today;
}

/**
 * Check if appointment is overdue
 */
export function isOverdue(dateStr: string): boolean {
  const today = formatDateAsString(new Date());
  return dateStr < today;
}

/**
 * Check if appointment is upcoming
 */
export function isUpcoming(dateStr: string): boolean {
  const today = formatDateAsString(new Date());
  return dateStr > today;
}

/**
 * Get human-readable date difference
 */
export function getTimeDifference(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return "a while ago";
}

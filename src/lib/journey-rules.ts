/**
 * Centralized journey rules for activity logging.
 * 
 * Sequence: 12 activities total, 3 per week, 4 weeks.
 *   Week 1: Activity 1, 2, 3
 *   Week 2: Activity 4, 5, 6
 *   Week 3: Activity 7, 8, 9
 *   Week 4: Activity 10, 11, 12
 * 
 * Max 1 activity per calendar day.
 */

export const MAX_ACTIVITIES = 12;
export const ACTIVITIES_PER_WEEK = 3;
export const TOTAL_WEEKS = 4;

/** Filter out recap entries (day_number >= 1000) to get real activities only */
export function getRealActivities<T extends { dayNumber: number }>(activities: T[]): T[] {
  return activities.filter(a => a.dayNumber > 0 && a.dayNumber <= MAX_ACTIVITIES);
}

/** Get the next sequential day_number (1-12) based on count of real activities */
export function getNextDayNumber<T extends { dayNumber: number }>(activities: T[]): number {
  const real = getRealActivities(activities);
  if (real.length >= MAX_ACTIVITIES) return MAX_ACTIVITIES;
  // Next day = count of existing real activities + 1 (strictly sequential)
  return real.length + 1;
}

/** Check if the user has already logged an activity today */
export function hasLoggedToday<T extends { createdAt?: string }>(activities: T[]): boolean {
  const today = new Date().toDateString();
  return activities.some(a => a.createdAt && new Date(a.createdAt).toDateString() === today);
}

/** Check if the journey is complete (12 real activities logged) */
export function isJourneyComplete<T extends { dayNumber: number }>(activities: T[]): boolean {
  return getRealActivities(activities).length >= MAX_ACTIVITIES;
}

/** Can the user log a new activity right now? */
export function canLogActivity<T extends { dayNumber: number; createdAt?: string }>(activities: T[]): boolean {
  const real = getRealActivities(activities);
  if (real.length >= MAX_ACTIVITIES) return false;
  if (hasLoggedToday(real)) return false;
  return true;
}

/** Get current week number (1-4) based on real activity count */
export function getCurrentWeek<T extends { dayNumber: number }>(activities: T[]): number {
  const count = getRealActivities(activities).length;
  return Math.min(Math.floor(count / ACTIVITIES_PER_WEEK) + 1, TOTAL_WEEKS);
}

/** Get activity-in-week number (1-3) */
export function getDayInWeek(dayNumber: number): number {
  return ((dayNumber - 1) % ACTIVITIES_PER_WEEK) + 1;
}

/** Get week number for a given day_number */
export function getWeekForDay(dayNumber: number): number {
  return Math.ceil(dayNumber / ACTIVITIES_PER_WEEK);
}

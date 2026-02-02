/**
 * Activity Context Utilities
 * Provides activity-aware data points, ninja states, and contextual labels
 * for templates in both Preview and Reel views.
 */

// Activity definitions with contextual metrics
export interface ActivityConfig {
  name: string;
  primaryMetric: string;
  primaryUnit: string;
  primaryInputType: 'wheel' | 'decimal' | 'number';
  secondaryMetric: string;
  secondaryUnit: string;
  secondaryInputType: 'wheel' | 'decimal' | 'number' | 'none';
  icon?: string; // Optional icon identifier
}

export const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  running: {
    name: 'Running',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Distance',
    secondaryUnit: 'km',
    secondaryInputType: 'decimal',
  },
  cycling: {
    name: 'Cycling',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Distance',
    secondaryUnit: 'km',
    secondaryInputType: 'decimal',
  },
  trekking: {
    name: 'Trekking',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Elevation',
    secondaryUnit: 'm',
    secondaryInputType: 'number',
  },
  swimming: {
    name: 'Swimming',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Laps',
    secondaryUnit: 'laps',
    secondaryInputType: 'number',
  },
  yoga: {
    name: 'Yoga',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Session',
    secondaryUnit: '',
    secondaryInputType: 'none',
  },
  gym: {
    name: 'GYM',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Sets',
    secondaryUnit: 'sets',
    secondaryInputType: 'number',
  },
  cricket: {
    name: 'Cricket',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Runs',
    secondaryUnit: 'runs',
    secondaryInputType: 'number',
  },
  badminton: {
    name: 'Badminton',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Games',
    secondaryUnit: 'games',
    secondaryInputType: 'number',
  },
  tennis: {
    name: 'Tennis',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Sets',
    secondaryUnit: 'sets',
    secondaryInputType: 'number',
  },
  meditation: {
    name: 'Meditation',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Session',
    secondaryUnit: '',
    secondaryInputType: 'none',
  },
  boxing: {
    name: 'Boxing',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Rounds',
    secondaryUnit: 'rounds',
    secondaryInputType: 'number',
  },
  dance: {
    name: 'Dance',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Session',
    secondaryUnit: '',
    secondaryInputType: 'none',
  },
};

/**
 * Get activity configuration by name
 */
export function getActivityConfig(activityName: string): ActivityConfig {
  const key = activityName.toLowerCase().replace(/\s+/g, '');
  return ACTIVITY_CONFIGS[key] || {
    name: activityName || 'Activity',
    primaryMetric: 'Duration',
    primaryUnit: 'min',
    primaryInputType: 'wheel',
    secondaryMetric: 'Metric',
    secondaryUnit: '',
    secondaryInputType: 'number',
  };
}

/**
 * Get contextual labels for template frames
 */
export function getActivityLabels(activityName: string): {
  durationLabel: string;
  metricLabel: string;
  metricUnit: string;
} {
  const config = getActivityConfig(activityName);
  return {
    durationLabel: config.primaryMetric,
    metricLabel: config.secondaryMetric,
    metricUnit: config.secondaryUnit,
  };
}

// Ninja state types
export interface NinjaState {
  currentDay: number;
  currentWeek: number;
  dayInWeek: number; // 1-3
  totalDaysCompleted: number;
  isFirstDay: boolean;
  isWeekComplete: boolean; // Day 3 of any week
  isMilestone: boolean; // Special milestones (Week 1, Week 2, Week 4 complete)
  streakLabel: string;
  milestoneLabel: string | null;
  progressLabel: string; // e.g., "Day 1 of 12" or "Week 1 • Day 1"
}

/**
 * Calculate ninja state from day number and total activities
 */
export function getNinjaState(dayNumber: number, totalActivities: number = 0): NinjaState {
  const week = Math.ceil(dayNumber / 3);
  const dayInWeek = ((dayNumber - 1) % 3) + 1;
  const isFirstDay = dayNumber === 1;
  const isWeekComplete = dayInWeek === 3;
  
  // Milestones: completing Week 1, Week 2, Week 4
  const milestoneDays = [3, 6, 12]; // End of Week 1, 2, 4
  const isMilestone = milestoneDays.includes(dayNumber) && isWeekComplete;
  
  // Streak label
  let streakLabel = `Day ${dayNumber}`;
  if (dayNumber >= 12) {
    streakLabel = '🔥 12-Day Streak!';
  } else if (dayNumber >= 6) {
    streakLabel = `🔥 ${dayNumber}-Day Streak`;
  }
  
  // Milestone labels
  let milestoneLabel: string | null = null;
  if (dayNumber === 3) milestoneLabel = 'Week 1 Complete!';
  if (dayNumber === 6) milestoneLabel = 'Week 2 Done! 💪';
  if (dayNumber === 9) milestoneLabel = 'Week 3 Crushed!';
  if (dayNumber === 12) milestoneLabel = 'Journey Complete! 🏆';
  
  // Progress label
  const progressLabel = `Week ${week} • Day ${dayInWeek}`;
  
  return {
    currentDay: dayNumber,
    currentWeek: week,
    dayInWeek,
    totalDaysCompleted: totalActivities,
    isFirstDay,
    isWeekComplete,
    isMilestone,
    streakLabel,
    milestoneLabel,
    progressLabel,
  };
}

/**
 * Get PR display with unit for the activity type
 */
export function formatPRDisplay(activityName: string, prValue: string): string {
  if (!prValue) return '';
  
  const config = getActivityConfig(activityName);
  const unit = config.secondaryUnit;
  
  // If value already includes unit, return as-is
  if (unit && !prValue.includes(unit)) {
    return `${prValue}${unit}`;
  }
  return prValue;
}

/**
 * Get duration display formatted properly
 */
export function formatDurationDisplay(durationValue: string): string {
  if (!durationValue) return '';
  
  // Already formatted
  if (durationValue.includes('hr') || durationValue.includes('min')) {
    return durationValue;
  }
  
  // Parse numeric value and format
  const num = parseInt(durationValue.replace(/[^0-9]/g, ''), 10);
  if (isNaN(num) || num === 0) return durationValue;
  
  if (num >= 60) {
    const hours = Math.floor(num / 60);
    const mins = num % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}hrs`;
  }
  return `${num}min`;
}

/**
 * Combined template context for frames
 */
export interface TemplateContext {
  activity: string;
  week: number;
  day: number;
  dayInWeek: number;
  duration: string;
  pr: string;
  durationLabel: string;
  metricLabel: string;
  metricUnit: string;
  streakLabel: string;
  milestoneLabel: string | null;
  progressLabel: string;
  isWeekComplete: boolean;
  isMilestone: boolean;
}

/**
 * Build complete template context from activity data
 */
export function buildTemplateContext(params: {
  activity: string;
  dayNumber: number;
  duration?: string;
  pr?: string;
  totalActivities?: number;
}): TemplateContext {
  const { activity, dayNumber, duration = '', pr = '', totalActivities = 0 } = params;
  
  const labels = getActivityLabels(activity);
  const ninjaState = getNinjaState(dayNumber, totalActivities);
  
  return {
    activity: activity || 'Activity',
    week: ninjaState.currentWeek,
    day: dayNumber,
    dayInWeek: ninjaState.dayInWeek,
    duration: formatDurationDisplay(duration),
    pr: formatPRDisplay(activity, pr),
    durationLabel: labels.durationLabel,
    metricLabel: labels.metricLabel,
    metricUnit: labels.metricUnit,
    streakLabel: ninjaState.streakLabel,
    milestoneLabel: ninjaState.milestoneLabel,
    progressLabel: ninjaState.progressLabel,
    isWeekComplete: ninjaState.isWeekComplete,
    isMilestone: ninjaState.isMilestone,
  };
}

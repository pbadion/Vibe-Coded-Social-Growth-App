export type Platform = 'youtube' | 'tiktok' | 'instagram';

export interface Milestone {
  target: number;
  label: string;
}

export interface GrowthData {
  currentSubscribers: number;
  sevenDayGrowth: number;
  platform: Platform;
}

export interface ProjectionPoint {
  date: string;
  subscribers: number;
  isMilestone?: boolean;
  milestoneLabel?: string;
}

import type { Set } from './set';

export type SessionStatus = 'active' | 'complete';

export interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  createdAt: string;
}

export interface SessionSummary {
  totalSets: number;
  totalVolume: number;
  duration: number;
  exerciseCount: number;
}

export interface SessionDetail extends Session {
  sets: Set[];
  summary: SessionSummary;
}

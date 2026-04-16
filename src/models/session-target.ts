export interface SessionTarget {
  id: string;
  sessionId: string;
  exerciseId: string;
  ordinal: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

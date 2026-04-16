export interface Set {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir: number | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogSetInput {
  sessionId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  rir?: number;
}

export interface UpdateSetInput {
  weight?: number;
  reps?: number;
  rir?: number | null;
}

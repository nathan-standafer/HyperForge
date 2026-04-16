export interface WorkoutTemplate {
  id: string;
  name: string;
  styleTag: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  ordinal: number;
  targetSets: number;
  targetReps: number;
  targetWeight: number | null;
}

export interface TemplateDetail extends WorkoutTemplate {
  exercises: (TemplateExercise & { exerciseName: string })[];
}

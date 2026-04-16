export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

export interface Program {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramDay {
  id: string;
  programId: string;
  dayOfWeek: DayOfWeek;
  templateId: string;
}

export interface ProgramDetail extends Program {
  days: (ProgramDay & { templateName: string })[];
}

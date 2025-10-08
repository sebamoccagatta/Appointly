export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Domingo a Sábado

export interface DailyWindow {
  start: string; //09:00
  end: string; //18:00
}

export interface WeeklyTemplateItem {
  weekday: Weekday;
  windows: DailyWindow[];
}

export interface ScheduleException {
  date: string; // YYYY-MM-DD
  available: boolean;
  windows?: DailyWindow[];
}

export interface Schedule {
  id: string;
  professionalId: string;
  weeklyTemplate: WeeklyTemplateItem[];
  exceptions?: ScheduleException[];
  bufferMinutes: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

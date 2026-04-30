export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "abs"
  | "traps"
  | "forearms";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "smith_machine";

export type WeightUnit = "kg" | "lbs";

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  isCustom?: boolean;
  instructions?: string[];
  tips?: string[];
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  rir: number;
  completed: boolean;
  timestamp?: number;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  restSeconds: number;
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  routineId?: string;
  routineName: string;
  startTime: number;
  endTime?: number;
  exercises: ExerciseLog[];
  completed: boolean;
}

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
  order: number;
}

export interface Routine {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  isActive: boolean;
  mesocycleId?: string;
}

export interface MesocycleWeek {
  weekNumber: number;
  targetRIR: number;
  isDeload: boolean;
}

export interface MesocycleDay {
  id: string;
  weekNumber: number;
  dayIndex: number;
  routineId: string;
  routineName: string;
  label: string;
  completed: boolean;
  completedAt?: number;
  workoutLogId?: string;
}

export interface Mesocycle {
  id: string;
  name: string;
  weeks: MesocycleWeek[];
  currentWeek: number;
  routineIds: string[];
  templateId?: string;
  schedule: MesocycleDay[];
}

export interface ExerciseHistoryEntry {
  date: number;
  sets: { reps: number; weight: number; rir: number }[];
  volume: number;
  estimated1RM: number;
}

export interface ExerciseHistory {
  exerciseId: string;
  entries: ExerciseHistoryEntry[];
}

export interface ProgressionSuggestion {
  sameWeight: { weight: number; reps: number };
  heavier: { weight: number; reps: number };
  heaviest: { weight: number; reps: number };
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: number;
}

export interface UserStats {
  totalWorkouts: number;
  totalVolume: number;
  totalReps: number;
  totalDurationMs: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: number;
  personalRecords: PersonalRecord[];
}

export interface MesocycleTemplate {
  id: string;
  name: string;
  description: string;
  splitType: string;
  daysPerWeek: number;
  routines: Omit<Routine, "id" | "isActive" | "mesocycleId">[];
  defaultWeeks: number;
}

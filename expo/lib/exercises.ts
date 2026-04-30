import { Exercise, MuscleGroup, Equipment } from "@/types/fitness";

export const defaultExercises: Exercise[] = [
  { id: "bench_press", name: "Bench Press", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "barbell" },
  { id: "squat", name: "Squat", muscleGroups: ["quads", "glutes", "hamstrings"], equipment: "barbell" },
  { id: "deadlift", name: "Deadlift", muscleGroups: ["back", "hamstrings", "glutes", "traps"], equipment: "barbell" },
  { id: "overhead_press", name: "Overhead Press", muscleGroups: ["shoulders", "triceps"], equipment: "barbell" },
  { id: "barbell_row", name: "Barbell Row", muscleGroups: ["back", "biceps", "traps"], equipment: "barbell" },
  { id: "incline_bench", name: "Incline Bench Press", muscleGroups: ["chest", "shoulders", "triceps"], equipment: "barbell" },
  { id: "romanian_deadlift", name: "Romanian Deadlift", muscleGroups: ["hamstrings", "glutes", "back"], equipment: "barbell" },
  { id: "front_squat", name: "Front Squat", muscleGroups: ["quads", "glutes", "back"], equipment: "barbell" },
  { id: "dumbbell_press", name: "Dumbbell Bench Press", muscleGroups: ["chest", "shoulders", "triceps"], equipment: "dumbbell" },
  { id: "dumbbell_row", name: "Dumbbell Row", muscleGroups: ["back", "biceps", "traps"], equipment: "dumbbell" },
  { id: "dumbbell_curl", name: "Dumbbell Curl", muscleGroups: ["biceps"], equipment: "dumbbell" },
  { id: "dumbbell_fly", name: "Dumbbell Fly", muscleGroups: ["chest"], equipment: "dumbbell" },
  { id: "lateral_raise", name: "Lateral Raise", muscleGroups: ["shoulders"], equipment: "dumbbell" },
  { id: "leg_press", name: "Leg Press", muscleGroups: ["quads", "glutes", "hamstrings"], equipment: "machine" },
  { id: "leg_curl", name: "Leg Curl", muscleGroups: ["hamstrings"], equipment: "machine" },
  { id: "leg_extension", name: "Leg Extension", muscleGroups: ["quads"], equipment: "machine" },
  { id: "chest_press", name: "Chest Press Machine", muscleGroups: ["chest", "shoulders", "triceps"], equipment: "machine" },
  { id: "lat_pulldown", name: "Lat Pulldown", muscleGroups: ["back", "biceps"], equipment: "cable" },
  { id: "cable_row", name: "Cable Row", muscleGroups: ["back", "biceps", "traps"], equipment: "cable" },
  { id: "tricep_pushdown", name: "Tricep Pushdown", muscleGroups: ["triceps"], equipment: "cable" },
  { id: "bicep_curl_cable", name: "Cable Bicep Curl", muscleGroups: ["biceps"], equipment: "cable" },
  { id: "face_pull", name: "Face Pull", muscleGroups: ["shoulders", "back"], equipment: "cable" },
  { id: "pull_up", name: "Pull Up", muscleGroups: ["back", "biceps"], equipment: "bodyweight" },
  { id: "dip", name: "Dip", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "bodyweight" },
  { id: "push_up", name: "Push Up", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "bodyweight" },
  { id: "lunges", name: "Lunges", muscleGroups: ["quads", "glutes", "hamstrings"], equipment: "bodyweight" },
  { id: "calf_raise", name: "Calf Raise", muscleGroups: ["calves"], equipment: "bodyweight" },
  { id: "plank", name: "Plank", muscleGroups: ["abs"], equipment: "bodyweight" },
];

export const muscleGroups: { id: MuscleGroup; label: string }[] = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "quads", label: "Quads" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "glutes", label: "Glutes" },
  { id: "calves", label: "Calves" },
  { id: "abs", label: "Abs" },
  { id: "traps", label: "Traps" },
  { id: "forearms", label: "Forearms" },
];

export const equipmentTypes: { id: Equipment; label: string }[] = [
  { id: "barbell", label: "Barbell" },
  { id: "dumbbell", label: "Dumbbell" },
  { id: "machine", label: "Machine" },
  { id: "cable", label: "Cable" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "smith_machine", label: "Smith Machine" },
];

export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
  return defaultExercises.filter(e => e.muscleGroups.includes(muscleGroup));
}

export function getExerciseById(id: string): Exercise | undefined {
  return defaultExercises.find(e => e.id === id);
}

export function searchExercises(query: string): Exercise[] {
  const lowerQuery = query.toLowerCase();
  return defaultExercises.filter(e => 
    e.name.toLowerCase().includes(lowerQuery) ||
    e.muscleGroups.some(mg => mg.toLowerCase().includes(lowerQuery))
  );
}

export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

export function calculateVolume(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((total, set) => total + (set.weight * set.reps), 0);
}

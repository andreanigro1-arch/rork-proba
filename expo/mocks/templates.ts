import { MesocycleTemplate } from "@/types/fitness";

export const mesocycleTemplates: MesocycleTemplate[] = [
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    description: "Classic 6-day split targeting each muscle group twice per week",
    splitType: "PPL",
    daysPerWeek: 6,
    defaultWeeks: 6,
    routines: [
      {
        name: "Push A",
        exercises: [
          { exerciseId: "bench_press", exerciseName: "Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "overhead_press", exerciseName: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "incline_bench", exerciseName: "Incline Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 2 },
          { exerciseId: "lateral_raise", exerciseName: "Lateral Raise", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, order: 3 },
          { exerciseId: "tricep_pushdown", exerciseName: "Tricep Pushdown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 4 },
        ],
      },
      {
        name: "Pull A",
        exercises: [
          { exerciseId: "deadlift", exerciseName: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 180, order: 0 },
          { exerciseId: "barbell_row", exerciseName: "Barbell Row", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "lat_pulldown", exerciseName: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90, order: 2 },
          { exerciseId: "face_pull", exerciseName: "Face Pull", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, order: 3 },
          { exerciseId: "dumbbell_curl", exerciseName: "Dumbbell Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 4 },
        ],
      },
      {
        name: "Legs A",
        exercises: [
          { exerciseId: "squat", exerciseName: "Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "romanian_deadlift", exerciseName: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "leg_press", exerciseName: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120, order: 2 },
          { exerciseId: "leg_curl", exerciseName: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 3 },
          { exerciseId: "calf_raise", exerciseName: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60, order: 4 },
        ],
      },
    ],
  },
  {
    id: "upper_lower",
    name: "Upper / Lower",
    description: "4-day split alternating upper and lower body workouts",
    splitType: "Upper/Lower",
    daysPerWeek: 4,
    defaultWeeks: 6,
    routines: [
      {
        name: "Upper A",
        exercises: [
          { exerciseId: "bench_press", exerciseName: "Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "barbell_row", exerciseName: "Barbell Row", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "overhead_press", exerciseName: "Overhead Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 2 },
          { exerciseId: "lat_pulldown", exerciseName: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90, order: 3 },
          { exerciseId: "dumbbell_curl", exerciseName: "Dumbbell Curl", targetSets: 2, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 4 },
          { exerciseId: "tricep_pushdown", exerciseName: "Tricep Pushdown", targetSets: 2, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 5 },
        ],
      },
      {
        name: "Lower A",
        exercises: [
          { exerciseId: "squat", exerciseName: "Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "romanian_deadlift", exerciseName: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "leg_press", exerciseName: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120, order: 2 },
          { exerciseId: "leg_curl", exerciseName: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 3 },
          { exerciseId: "calf_raise", exerciseName: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60, order: 4 },
        ],
      },
    ],
  },
  {
    id: "bro_split",
    name: "Bro Split",
    description: "5-day bodybuilding split — one muscle group per session",
    splitType: "Bro Split",
    daysPerWeek: 5,
    defaultWeeks: 6,
    routines: [
      {
        name: "Chest",
        exercises: [
          { exerciseId: "bench_press", exerciseName: "Bench Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "incline_bench", exerciseName: "Incline Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "dumbbell_fly", exerciseName: "Dumbbell Fly", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 2 },
          { exerciseId: "chest_press", exerciseName: "Chest Press Machine", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 3 },
        ],
      },
      {
        name: "Back",
        exercises: [
          { exerciseId: "deadlift", exerciseName: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 180, order: 0 },
          { exerciseId: "barbell_row", exerciseName: "Barbell Row", targetSets: 4, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 1 },
          { exerciseId: "lat_pulldown", exerciseName: "Lat Pulldown", targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90, order: 2 },
          { exerciseId: "cable_row", exerciseName: "Cable Row", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 3 },
        ],
      },
      {
        name: "Shoulders",
        exercises: [
          { exerciseId: "overhead_press", exerciseName: "Overhead Press", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150, order: 0 },
          { exerciseId: "lateral_raise", exerciseName: "Lateral Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, order: 1 },
          { exerciseId: "face_pull", exerciseName: "Face Pull", targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60, order: 2 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { exerciseId: "squat", exerciseName: "Squat", targetSets: 4, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "leg_press", exerciseName: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120, order: 1 },
          { exerciseId: "romanian_deadlift", exerciseName: "Romanian Deadlift", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 2 },
          { exerciseId: "leg_extension", exerciseName: "Leg Extension", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 3 },
          { exerciseId: "leg_curl", exerciseName: "Leg Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90, order: 4 },
          { exerciseId: "calf_raise", exerciseName: "Calf Raise", targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60, order: 5 },
        ],
      },
      {
        name: "Arms",
        exercises: [
          { exerciseId: "dumbbell_curl", exerciseName: "Dumbbell Curl", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 60, order: 0 },
          { exerciseId: "tricep_pushdown", exerciseName: "Tricep Pushdown", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 60, order: 1 },
          { exerciseId: "bicep_curl_cable", exerciseName: "Cable Bicep Curl", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 2 },
          { exerciseId: "dip", exerciseName: "Dip", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 90, order: 3 },
        ],
      },
    ],
  },
  {
    id: "full_body",
    name: "Full Body",
    description: "3-day full body program for strength and hypertrophy",
    splitType: "Full Body",
    daysPerWeek: 3,
    defaultWeeks: 6,
    routines: [
      {
        name: "Full Body A",
        exercises: [
          { exerciseId: "squat", exerciseName: "Squat", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 180, order: 0 },
          { exerciseId: "bench_press", exerciseName: "Bench Press", targetSets: 3, targetRepsMin: 6, targetRepsMax: 10, restSeconds: 150, order: 1 },
          { exerciseId: "barbell_row", exerciseName: "Barbell Row", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 2 },
          { exerciseId: "overhead_press", exerciseName: "Overhead Press", targetSets: 2, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 3 },
          { exerciseId: "dumbbell_curl", exerciseName: "Dumbbell Curl", targetSets: 2, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 4 },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          { exerciseId: "deadlift", exerciseName: "Deadlift", targetSets: 3, targetRepsMin: 5, targetRepsMax: 8, restSeconds: 180, order: 0 },
          { exerciseId: "incline_bench", exerciseName: "Incline Bench Press", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 150, order: 1 },
          { exerciseId: "lat_pulldown", exerciseName: "Lat Pulldown", targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSeconds: 120, order: 2 },
          { exerciseId: "leg_press", exerciseName: "Leg Press", targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120, order: 3 },
          { exerciseId: "tricep_pushdown", exerciseName: "Tricep Pushdown", targetSets: 2, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60, order: 4 },
        ],
      },
    ],
  },
];

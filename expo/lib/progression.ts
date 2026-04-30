import { ExerciseHistory, MesocycleWeek, ProgressionSuggestion } from "@/types/fitness";

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (36 / (37 - reps)));
}

export function repsAtWeight(target1RM: number, weight: number): number {
  if (weight <= 0 || target1RM <= 0) return 0;
  const reps = Math.round(37 - (36 * weight) / target1RM);
  return Math.max(1, Math.min(30, reps));
}

export function calculateProgressionSuggestions(
  lastWeight: number,
  lastReps: number,
): ProgressionSuggestion {
  const last1RM = estimate1RM(lastWeight, lastReps);
  const target1RM = last1RM * 1.02;

  const sameWeight = {
    weight: lastWeight,
    reps: Math.min(lastReps + 1, 30),
  };

  const heavierWeight = Math.ceil((lastWeight + 1) / 0.5) * 0.5;
  const heavier = {
    weight: heavierWeight,
    reps: Math.max(1, repsAtWeight(target1RM, heavierWeight)),
  };

  const heaviestWeight = Math.ceil((lastWeight + 2) / 0.5) * 0.5;
  const heaviest = {
    weight: heaviestWeight,
    reps: Math.max(1, repsAtWeight(target1RM, heaviestWeight)),
  };

  return { sameWeight, heavier, heaviest };
}

export function getLiveTargetReps(
  currentWeight: number,
  previousWeight: number,
  previousReps: number,
): number {
  if (currentWeight <= 0 || previousWeight <= 0 || previousReps <= 0) return 0;
  const prev1RM = estimate1RM(previousWeight, previousReps);
  return Math.max(1, repsAtWeight(prev1RM, currentWeight));
}

export function calculatePlateLoading(
  weight: number,
  barWeight: number = 45
): { plate: number; count: number }[] {
  if (weight <= barWeight) return [];
  const plateWeight = (weight - barWeight) / 2;
  const plates = [45, 35, 25, 10, 5, 2.5];
  const result: { plate: number; count: number }[] = [];
  let remaining = plateWeight;
  for (const plate of plates) {
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      result.push({ plate, count });
      remaining -= count * plate;
    }
  }
  return result;
}

export function generateMesocycleWeeks(weeks: number = 6): MesocycleWeek[] {
  const mesocycleWeeks: MesocycleWeek[] = [];
  for (let i = 0; i < weeks; i++) {
    mesocycleWeeks.push({
      weekNumber: i + 1,
      targetRIR: Math.max(0, 3 - Math.floor((i * 3) / (weeks - 1))),
      isDeload: false,
    });
  }
  mesocycleWeeks.push({
    weekNumber: weeks + 1,
    targetRIR: 4,
    isDeload: true,
  });
  return mesocycleWeeks;
}

export function getRIRColor(rir: number): string {
  if (rir >= 4) return "#22c55e";
  if (rir >= 2) return "#f59e0b";
  if (rir >= 1) return "#f97316";
  return "#ef4444";
}

export function getRIRLabel(rir: number): string {
  if (rir >= 4) return "Easy";
  if (rir >= 3) return "Moderate";
  if (rir >= 2) return "Challenging";
  if (rir >= 1) return "Hard";
  return "Failure";
}

export function convertWeight(weight: number, from: "kg" | "lbs", to: "kg" | "lbs"): number {
  if (from === to) return weight;
  if (from === "kg" && to === "lbs") return Math.round(weight * 2.20462 * 10) / 10;
  return Math.round(weight / 2.20462 * 10) / 10;
}

export function isWeekCompleted(
  schedule: { weekNumber: number; completed: boolean }[],
  weekNumber: number,
): boolean {
  const weekDays = schedule.filter((d) => d.weekNumber === weekNumber);
  if (weekDays.length === 0) return false;
  return weekDays.every((d) => d.completed);
}

export function isWeekUnlocked(
  schedule: { weekNumber: number; completed: boolean }[],
  weekNumber: number,
): boolean {
  if (weekNumber <= 1) return true;
  return isWeekCompleted(schedule, weekNumber - 1);
}

export function getWeekVolume(
  schedule: { weekNumber: number; workoutLogId?: string }[],
  weekNumber: number,
  workoutHistory: { id: string; exercises: { sets: { weight: number; reps: number; completed: boolean }[] }[] }[],
): { volume: number; reps: number } {
  const weekDays = schedule.filter((d) => d.weekNumber === weekNumber);
  let volume = 0;
  let reps = 0;
  for (const day of weekDays) {
    if (!day.workoutLogId) continue;
    const log = workoutHistory.find((w) => w.id === day.workoutLogId);
    if (!log) continue;
    for (const ex of log.exercises) {
      for (const s of ex.sets) {
        if (s.completed) {
          volume += s.weight * s.reps;
          reps += s.reps;
        }
      }
    }
  }
  return { volume, reps };
}

export interface GeneratedSetTarget {
  weight: number;
  reps: number;
}

export function generateNextWeekTargets(
  previousWeight: number,
  previousReps: number,
): GeneratedSetTarget[] {
  if (previousWeight <= 0 || previousReps <= 0) {
    return [{ weight: previousWeight, reps: previousReps }];
  }
  const prev1RM = estimate1RM(previousWeight, previousReps);
  const target1RM = prev1RM * 1.025;

  const sameWeightReps = Math.min(previousReps + 1, 30);
  const heavierWeight = Math.ceil((previousWeight + 1) / 0.5) * 0.5;
  const heavierReps = Math.max(1, repsAtWeight(target1RM, heavierWeight));

  return [
    { weight: previousWeight, reps: sameWeightReps },
    { weight: heavierWeight, reps: heavierReps },
  ];
}

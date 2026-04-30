import { useEffect, useState, useCallback } from "react";
import { useWorkoutStore } from "./store";

export function useWorkoutQuery() {
  const { workoutHistory, exerciseHistory } = useWorkoutStore();

  const getExerciseProgress = useCallback((exerciseId: string) => {
    const history = exerciseHistory[exerciseId];
    if (!history || history.entries.length < 2) return null;

    const entries = history.entries.slice(-4);
    const volumes = entries.map(e => e.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const trend = volumes[volumes.length - 1] - volumes[0];

    return {
      trend,
      avgVolume,
      isImproving: trend > 0,
      entries,
    };
  }, [exerciseHistory]);

  const getWorkoutFrequency = useCallback(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const recentWorkouts = workoutHistory.filter(w => w.startTime > thirtyDaysAgo);
    
    return {
      total: recentWorkouts.length,
      perWeek: recentWorkouts.length / 4.3,
    };
  }, [workoutHistory]);

  return {
    getExerciseProgress,
    getWorkoutFrequency,
  };
}

export function useRestTimer() {
  const { restTimerEnd, isRestTimerRunning } = useWorkoutStore();
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!restTimerEnd || !isRestTimerRunning) {
      setRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const left = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
      setRemaining(left);
      
      if (left === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [restTimerEnd, isRestTimerRunning]);

  return {
    remaining,
    isRunning: isRestTimerRunning && remaining > 0,
  };
}

export function usePersonalRecords() {
  const { exerciseHistory } = useWorkoutStore();

  const getPersonalRecord = (exerciseId: string) => {
    const history = exerciseHistory[exerciseId];
    if (!history) return null;

    let bestWeight = 0;
    let best1RM = 0;
    let prEntry = null;

    history.entries.forEach(entry => {
      entry.sets.forEach(set => {
        if (set.weight > bestWeight) {
          bestWeight = set.weight;
        }
        const estimated1RM = Math.round(set.weight * (36 / (37 - set.reps)));
        if (estimated1RM > best1RM) {
          best1RM = estimated1RM;
          prEntry = { ...set, date: entry.date };
        }
      });
    });

    return {
      maxWeight: bestWeight,
      estimated1RM: best1RM,
      bestSet: prEntry,
    };
  };

  return { getPersonalRecord };
}

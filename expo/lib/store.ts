import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  WorkoutLog,
  Routine,
  Mesocycle,
  MesocycleDay,
  ExerciseHistory,
  UserStats,
  ExerciseLog,
  WorkoutSet,
  WeightUnit,
} from "@/types/fitness";
import { generateMesocycleWeeks, estimate1RM, isWeekCompleted, isWeekUnlocked, generateNextWeekTargets } from "./progression";

function uid(): string {
  return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

interface WorkoutState {
  activeWorkout: WorkoutLog | null;
  workoutHistory: WorkoutLog[];
  routines: Routine[];
  mesocycles: Mesocycle[];
  activeMesocycleId: string | null;
  exerciseHistory: Record<string, ExerciseHistory>;
  userStats: UserStats;
  weightUnit: WeightUnit;
  restTimerEnd: number | null;
  restTimerDuration: number;
  isRestTimerRunning: boolean;

  setWeightUnit: (unit: WeightUnit) => void;
  startWorkout: (routineId?: string, routineName?: string) => void;
  endWorkout: () => void;
  cancelWorkout: () => void;
  addExerciseToWorkout: (exerciseId: string, exerciseName: string, restSeconds: number) => void;
  removeExerciseFromWorkout: (exerciseIndex: number) => void;
  addSet: (exerciseIndex: number, exerciseSet: WorkoutSet) => void;
  updateSet: (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => void;
  completeSet: (exerciseIndex: number, setIndex: number, rir: number) => void;
  removeSet: (exerciseIndex: number, setIndex: number) => void;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  clearRestTimer: () => void;
  createRoutine: (routine: Omit<Routine, "id">) => void;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  setActiveRoutine: (id: string) => void;
  createMesocycle: (name: string, routineIds: string[], weeks?: number, templateId?: string) => void;
  advanceMesocycleWeek: () => void;
  setActiveMesocycle: (id: string | null) => void;
  deleteMesocycle: (id: string) => void;
  completeMesocycleDay: (mesocycleId: string, dayId: string, workoutLogId?: string) => void;
  startWorkoutFromSchedule: (mesocycleId: string, dayId: string) => void;
  isWeekLocked: (mesocycleId: string, weekNumber: number) => boolean;
  getWeekStatus: (mesocycleId: string, weekNumber: number) => 'locked' | 'active' | 'completed';
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      workoutHistory: [],
      routines: [],
      mesocycles: [],
      activeMesocycleId: null,
      exerciseHistory: {},
      userStats: {
        totalWorkouts: 0,
        totalVolume: 0,
        totalReps: 0,
        totalDurationMs: 0,
        currentStreak: 0,
        longestStreak: 0,
        personalRecords: [],
      },
      weightUnit: "lbs" as WeightUnit,
      restTimerEnd: null,
      restTimerDuration: 0,
      isRestTimerRunning: false,

      setWeightUnit: (unit: WeightUnit) => {
        set({ weightUnit: unit });
      },

      startWorkout: (routineId?: string, routineName?: string) => {
        const state = get();
        const routine = routineId ? state.routines.find(r => r.id === routineId) : undefined;
        const exercises: ExerciseLog[] = routine
          ? routine.exercises.map(re => ({
              exerciseId: re.exerciseId,
              exerciseName: re.exerciseName,
              sets: Array.from({ length: re.targetSets }, (_, i) => {
                const history = state.exerciseHistory[re.exerciseId];
                const lastEntry = history?.entries[history.entries.length - 1];
                const lastSet = lastEntry?.sets[lastEntry.sets.length - 1];
                return {
                  id: `${uid()}_${i}`,
                  reps: lastSet?.reps || re.targetRepsMin,
                  weight: lastSet?.weight || 0,
                  rir: 3,
                  completed: false,
                };
              }),
              restSeconds: re.restSeconds,
            }))
          : [];

        set({
          activeWorkout: {
            id: uid(),
            routineId,
            routineName: routineName || "Quick Workout",
            startTime: Date.now(),
            exercises,
            completed: false,
          },
        });
      },

      endWorkout: () => {
        const { activeWorkout, workoutHistory, userStats, exerciseHistory } = get();
        if (!activeWorkout) return;

        const completedWorkout: WorkoutLog = {
          ...activeWorkout,
          endTime: Date.now(),
          completed: true,
        };

        const newExerciseHistory = { ...exerciseHistory };
        let workoutVolume = 0;
        let workoutReps = 0;

        completedWorkout.exercises.forEach(exerciseLog => {
          const completedSets = exerciseLog.sets.filter(s => s.completed);
          if (completedSets.length === 0) return;

          const volume = completedSets.reduce((sum, s) => sum + (s.weight * s.reps), 0);
          const reps = completedSets.reduce((sum, s) => sum + s.reps, 0);
          workoutVolume += volume;
          workoutReps += reps;

          const max1RM = Math.max(
            ...completedSets.map(s => s.weight > 0 ? estimate1RM(s.weight, s.reps) : 0),
            0
          );

          if (!newExerciseHistory[exerciseLog.exerciseId]) {
            newExerciseHistory[exerciseLog.exerciseId] = {
              exerciseId: exerciseLog.exerciseId,
              entries: [],
            };
          }

          newExerciseHistory[exerciseLog.exerciseId].entries.push({
            date: completedWorkout.startTime,
            sets: completedSets.map(s => ({ reps: s.reps, weight: s.weight, rir: s.rir })),
            volume,
            estimated1RM: max1RM,
          });
        });

        const durationMs = completedWorkout.endTime! - completedWorkout.startTime;

        let newStreak = userStats.currentStreak;
        if (userStats.lastWorkoutDate) {
          const lastDate = new Date(userStats.lastWorkoutDate);
          const todayDate = new Date();
          const diffDays = Math.floor(
            (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays <= 1) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        const { activeMesocycleId, mesocycles } = get();
        let updatedMesocycles = mesocycles;
        if (activeMesocycleId && completedWorkout.routineId) {
          const meso = mesocycles.find(m => m.id === activeMesocycleId);
          if (meso && meso.schedule) {
            const matchingDay = meso.schedule.find(
              d => d.routineId === completedWorkout.routineId && !d.completed && d.weekNumber === meso.currentWeek + 1
            ) || meso.schedule.find(
              d => d.routineId === completedWorkout.routineId && !d.completed
            );
            if (matchingDay) {
              const updatedSchedule = meso.schedule.map(day =>
                day.id === matchingDay.id
                  ? { ...day, completed: true, completedAt: Date.now(), workoutLogId: completedWorkout.id }
                  : day
              );

              const currentWeekNum = meso.currentWeek + 1;
              const weekJustCompleted = isWeekCompleted(updatedSchedule, currentWeekNum);
              const newCurrentWeek = weekJustCompleted && currentWeekNum < meso.weeks.length
                ? meso.currentWeek + 1
                : meso.currentWeek;

              if (weekJustCompleted) {
                console.log('[Store] Week', currentWeekNum, 'completed! Auto-advancing to Week', newCurrentWeek + 1);
              }

              updatedMesocycles = mesocycles.map(m =>
                m.id !== activeMesocycleId
                  ? m
                  : {
                      ...m,
                      schedule: updatedSchedule,
                      currentWeek: newCurrentWeek,
                    }
              );
            }
          }
        }

        set({
          activeWorkout: null,
          workoutHistory: [completedWorkout, ...workoutHistory],
          exerciseHistory: newExerciseHistory,
          mesocycles: updatedMesocycles,
          userStats: {
            ...userStats,
            totalWorkouts: userStats.totalWorkouts + 1,
            totalVolume: userStats.totalVolume + workoutVolume,
            totalReps: userStats.totalReps + workoutReps,
            totalDurationMs: userStats.totalDurationMs + durationMs,
            currentStreak: newStreak,
            longestStreak: Math.max(userStats.longestStreak, newStreak),
            lastWorkoutDate: Date.now(),
          },
        });
      },

      cancelWorkout: () => {
        set({ activeWorkout: null });
      },

      addExerciseToWorkout: (exerciseId, exerciseName, restSeconds) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        set({
          activeWorkout: {
            ...activeWorkout,
            exercises: [
              ...activeWorkout.exercises,
              { exerciseId, exerciseName, sets: [], restSeconds },
            ],
          },
        });
      },

      removeExerciseFromWorkout: (exerciseIndex) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const exercises = [...activeWorkout.exercises];
        exercises.splice(exerciseIndex, 1);
        set({ activeWorkout: { ...activeWorkout, exercises } });
      },

      addSet: (exerciseIndex, exerciseSet) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const exercises = activeWorkout.exercises.map((ex, i) =>
          i === exerciseIndex ? { ...ex, sets: [...ex.sets, exerciseSet] } : ex
        );
        set({ activeWorkout: { ...activeWorkout, exercises } });
      },

      updateSet: (exerciseIndex, setIndex, updates) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const exercises = activeWorkout.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex;
          const sets = ex.sets.map((s, j) => (j === setIndex ? { ...s, ...updates } : s));
          return { ...ex, sets };
        });
        set({ activeWorkout: { ...activeWorkout, exercises } });
      },

      completeSet: (exerciseIndex, setIndex, rir) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const exercises = activeWorkout.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex;
          const sets = ex.sets.map((s, j) =>
            j === setIndex ? { ...s, rir, completed: true, timestamp: Date.now() } : s
          );
          return { ...ex, sets };
        });
        set({ activeWorkout: { ...activeWorkout, exercises } });
      },

      removeSet: (exerciseIndex, setIndex) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const exercises = activeWorkout.exercises.map((ex, i) => {
          if (i !== exerciseIndex) return ex;
          const sets = [...ex.sets];
          sets.splice(setIndex, 1);
          return { ...ex, sets };
        });
        set({ activeWorkout: { ...activeWorkout, exercises } });
      },

      startRestTimer: (seconds) => {
        set({
          restTimerEnd: Date.now() + seconds * 1000,
          restTimerDuration: seconds,
          isRestTimerRunning: true,
        });
      },

      stopRestTimer: () => set({ isRestTimerRunning: false }),
      clearRestTimer: () =>
        set({ restTimerEnd: null, restTimerDuration: 0, isRestTimerRunning: false }),

      createRoutine: (routine) => {
        const newRoutine = { ...routine, id: uid() } as Routine;
        set(state => ({ routines: [...state.routines, newRoutine] }));
      },

      updateRoutine: (id, updates) => {
        set(state => ({
          routines: state.routines.map(r => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      deleteRoutine: (id) => {
        set(state => ({ routines: state.routines.filter(r => r.id !== id) }));
      },

      setActiveRoutine: (id) => {
        set(state => ({
          routines: state.routines.map(r => ({ ...r, isActive: r.id === id })),
        }));
      },

      createMesocycle: (name, routineIds, weeks = 6, templateId) => {
        const state = get();
        const mesoWeeks = generateMesocycleWeeks(weeks);
        const schedule: MesocycleDay[] = [];

        for (let w = 0; w < mesoWeeks.length; w++) {
          const week = mesoWeeks[w];
          for (let d = 0; d < routineIds.length; d++) {
            const routine = state.routines.find(r => r.id === routineIds[d]);
            schedule.push({
              id: uid(),
              weekNumber: week.weekNumber,
              dayIndex: d + 1,
              routineId: routineIds[d],
              routineName: routine?.name || `Day ${d + 1}`,
              label: `Week ${week.weekNumber} - Day ${d + 1}: ${routine?.name || "Workout"}`,
              completed: false,
            });
          }
        }

        const newMesocycle: Mesocycle = {
          id: uid(),
          name,
          weeks: mesoWeeks,
          currentWeek: 0,
          routineIds,
          templateId,
          schedule,
        };
        set(s => ({
          mesocycles: [...s.mesocycles, newMesocycle],
          activeMesocycleId: newMesocycle.id,
        }));
      },

      advanceMesocycleWeek: () => {
        const { activeMesocycleId } = get();
        if (!activeMesocycleId) return;
        set(state => ({
          mesocycles: state.mesocycles.map(m =>
            m.id === activeMesocycleId
              ? { ...m, currentWeek: Math.min(m.currentWeek + 1, m.weeks.length - 1) }
              : m
          ),
        }));
      },

      setActiveMesocycle: (id) => set({ activeMesocycleId: id }),

      deleteMesocycle: (id) => {
        set(state => ({
          mesocycles: state.mesocycles.filter(m => m.id !== id),
          activeMesocycleId: state.activeMesocycleId === id ? null : state.activeMesocycleId,
        }));
      },

      completeMesocycleDay: (mesocycleId, dayId, workoutLogId) => {
        set(state => ({
          mesocycles: state.mesocycles.map(m =>
            m.id !== mesocycleId
              ? m
              : {
                  ...m,
                  schedule: (m.schedule || []).map(day =>
                    day.id === dayId
                      ? { ...day, completed: true, completedAt: Date.now(), workoutLogId }
                      : day
                  ),
                }
          ),
        }));
      },

      startWorkoutFromSchedule: (mesocycleId, dayId) => {
        const state = get();
        const meso = state.mesocycles.find(m => m.id === mesocycleId);
        if (!meso) return;
        const day = (meso.schedule || []).find(d => d.id === dayId);
        if (!day) return;

        if (!isWeekUnlocked(meso.schedule || [], day.weekNumber)) {
          console.log('[Store] Week', day.weekNumber, 'is locked — previous week not completed');
          return;
        }

        const routine = state.routines.find(r => r.id === day.routineId);
        if (!routine) {
          state.startWorkout(undefined, day.routineName);
          return;
        }

        const prevWeekNum = day.weekNumber - 1;
        if (prevWeekNum >= 1) {
          const prevWeekDays = (meso.schedule || []).filter(d => d.weekNumber === prevWeekNum);
          const exercises = routine.exercises.map(re => {
            const prevDayForRoutine = prevWeekDays.find(d => d.routineId === routine.id);
            let prevLog: WorkoutLog | undefined;
            if (prevDayForRoutine?.workoutLogId) {
              prevLog = state.workoutHistory.find(w => w.id === prevDayForRoutine.workoutLogId);
            }
            const prevExercise = prevLog?.exercises.find(e => e.exerciseId === re.exerciseId);

            if (prevExercise && prevExercise.sets.length > 0) {
              const completedSets = prevExercise.sets.filter(s => s.completed);
              return {
                ...re,
                _progressionHints: completedSets.map(s => {
                  const targets = generateNextWeekTargets(s.weight, s.reps);
                  return targets[0];
                }),
              };
            }
            return re;
          });

          const exerciseLogs: ExerciseLog[] = exercises.map(re => {
            const hints = (re as any)._progressionHints as { weight: number; reps: number }[] | undefined;
            return {
              exerciseId: re.exerciseId,
              exerciseName: re.exerciseName,
              sets: Array.from({ length: re.targetSets }, (_, i) => {
                const hint = hints?.[i] || hints?.[hints.length - 1];
                const history = state.exerciseHistory[re.exerciseId];
                const lastEntry = history?.entries[history.entries.length - 1];
                const lastSet = lastEntry?.sets[lastEntry.sets.length - 1];
                return {
                  id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}_${i}`,
                  reps: hint?.reps ?? lastSet?.reps ?? re.targetRepsMin,
                  weight: hint?.weight ?? lastSet?.weight ?? 0,
                  rir: 3,
                  completed: false,
                };
              }),
              restSeconds: re.restSeconds,
            };
          });

          set({
            activeWorkout: {
              id: Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10),
              routineId: routine.id,
              routineName: day.routineName,
              startTime: Date.now(),
              exercises: exerciseLogs,
              completed: false,
            },
          });
          console.log('[Store] Started workout with progression targets from Week', prevWeekNum);
          return;
        }

        state.startWorkout(routine.id, day.routineName);
      },

      isWeekLocked: (mesocycleId, weekNumber) => {
        const state = get();
        const meso = state.mesocycles.find(m => m.id === mesocycleId);
        if (!meso) return true;
        return !isWeekUnlocked(meso.schedule || [], weekNumber);
      },

      getWeekStatus: (mesocycleId, weekNumber) => {
        const state = get();
        const meso = state.mesocycles.find(m => m.id === mesocycleId);
        if (!meso) return 'locked';
        const schedule = meso.schedule || [];
        if (isWeekCompleted(schedule, weekNumber)) return 'completed';
        if (isWeekUnlocked(schedule, weekNumber)) return 'active';
        return 'locked';
      },
    }),
    {
      name: "liftos-storage-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

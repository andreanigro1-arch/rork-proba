import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react-native";
import { useState, useEffect, useCallback } from "react";
import { useWorkoutStore } from "@/lib/store";
import { getRIRColor, getRIRLabel, getLiveTargetReps, calculateProgressionSuggestions } from "@/lib/progression";
import Colors from "@/constants/colors";
import type { WorkoutSet } from "@/types/fitness";

const C = Colors.light;
const RIR_OPTIONS = [0, 1, 2, 3, 4, 5];

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const {
    activeWorkout,
    endWorkout,
    cancelWorkout,
    addSet,
    updateSet,
    completeSet,
    removeSet,
    removeExerciseFromWorkout,
    exerciseHistory,
    weightUnit,
  } = useWorkoutStore();

  const [expandedExercise, setExpandedExercise] = useState<number | null>(0);
  const [showRIRPicker, setShowRIRPicker] = useState<{
    exerciseIdx: number;
    setIdx: number;
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout?.startTime]);

  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  if (!activeWorkout) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active workout</Text>
          <TouchableOpacity
            style={styles.goStartBtn}
            onPress={() => router.push("/workout/start")}
          >
            <Text style={styles.goStartBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleEndWorkout = () => {
    const completedSets = activeWorkout.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
      0
    );
    if (completedSets === 0) {
      Alert.alert("No Sets Completed", "Discard this workout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => { cancelWorkout(); router.replace("/"); } },
      ]);
      return;
    }
    Alert.alert("Finish Workout", "Save and finish this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: () => { endWorkout(); router.replace("/"); },
      },
    ]);
  };

  const handleAddSet = (exerciseIdx: number) => {
    const exercise = activeWorkout.exercises[exerciseIdx];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const history = exerciseHistory[exercise.exerciseId];
    const lastEntry = history?.entries[history.entries.length - 1];

    let suggestedWeight = lastSet?.weight || 0;
    let suggestedReps = lastSet?.reps || 8;

    if (!lastSet && lastEntry) {
      const lastSetData = lastEntry.sets[lastEntry.sets.length - 1];
      suggestedWeight = lastSetData?.weight || 0;
      suggestedReps = lastSetData?.reps || 8;
    }

    addSet(exerciseIdx, {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reps: suggestedReps,
      weight: suggestedWeight,
      rir: 3,
      completed: false,
    });
  };

  const handleCompleteSet = (exerciseIdx: number, setIdx: number, rir: number) => {
    completeSet(exerciseIdx, setIdx, rir);
    setShowRIRPicker(null);
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const totalVolume = activeWorkout.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.filter((s) => s.completed).reduce((sSum, s) => sSum + s.weight * s.reps, 0),
    0
  );
  const totalSetsCompleted = activeWorkout.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <X size={22} color={C.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.workoutTitle} numberOfLines={1}>
            {activeWorkout.routineName}
          </Text>
          <Text style={styles.timerText}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </Text>
        </View>
        <TouchableOpacity style={styles.finishBtn} onPress={handleEndWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryItem}>{totalSetsCompleted} sets</Text>
        <Text style={styles.summaryDot}>·</Text>
        <Text style={styles.summaryItem}>
          {totalVolume >= 1000
            ? `${(totalVolume / 1000).toFixed(1)}k`
            : totalVolume}{" "}
          {unitLabel}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.map((exercise, exerciseIdx) => {
          const history = exerciseHistory[exercise.exerciseId];
          const lastEntry = history?.entries[history.entries.length - 1];
          const lastSet = lastEntry?.sets[lastEntry.sets.length - 1];

          return (
            <View key={exerciseIdx} style={styles.exerciseCard}>
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() =>
                  setExpandedExercise(expandedExercise === exerciseIdx ? null : exerciseIdx)
                }
              >
                <View style={styles.exerciseHeaderLeft}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  {lastSet && (
                    <Text style={styles.previousBest}>
                      Previous: {lastSet.weight}{unitLabel} × {lastSet.reps}
                    </Text>
                  )}
                </View>
                <View style={styles.exerciseRight}>
                  <Text style={styles.setCount}>
                    {exercise.sets.filter((s) => s.completed).length}/{exercise.sets.length}
                  </Text>
                  {expandedExercise === exerciseIdx ? (
                    <ChevronUp size={18} color={C.textMuted} />
                  ) : (
                    <ChevronDown size={18} color={C.textMuted} />
                  )}
                </View>
              </TouchableOpacity>

              {expandedExercise === exerciseIdx && (
                <View style={styles.exerciseBody}>
                  <View style={styles.setHeader}>
                    <Text style={[styles.setHeaderText, { flex: 0.5 }]}>SET</Text>
                    <Text style={styles.setHeaderText}>{unitLabel.toUpperCase()}</Text>
                    <Text style={styles.setHeaderText}>REPS</Text>
                    <Text style={[styles.setHeaderText, { flex: 0.7 }]}>TARGET</Text>
                    <View style={{ width: 36 }} />
                  </View>

                  {exercise.sets.map((set, setIdx) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      setIdx={setIdx}
                      previousSet={lastSet}
                      unitLabel={unitLabel}
                      onUpdate={(updates) => updateSet(exerciseIdx, setIdx, updates)}
                      onComplete={() =>
                        setShowRIRPicker({ exerciseIdx, setIdx })
                      }
                      onDelete={() => removeSet(exerciseIdx, setIdx)}
                    />
                  ))}

                  <View style={styles.exerciseActions}>
                    <TouchableOpacity
                      style={styles.addSetBtn}
                      onPress={() => handleAddSet(exerciseIdx)}
                    >
                      <Plus size={14} color={C.tint} />
                      <Text style={styles.addSetText}>Add Set</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeExBtn}
                      onPress={() => {
                        Alert.alert("Remove", `Remove ${exercise.exerciseName}?`, [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Remove",
                            style: "destructive",
                            onPress: () => removeExerciseFromWorkout(exerciseIdx),
                          },
                        ]);
                      }}
                    >
                      <Trash2 size={14} color={C.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => router.push("/workout/add-exercise")}
        >
          <Plus size={18} color={C.tint} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {showRIRPicker && (
        <View style={styles.rirOverlay}>
          <TouchableOpacity
            style={styles.rirBackdrop}
            activeOpacity={1}
            onPress={() => setShowRIRPicker(null)}
          />
          <View style={styles.rirSheet}>
            <Text style={styles.rirTitle}>Reps in Reserve</Text>
            <Text style={styles.rirSubtitle}>How many more reps could you have done?</Text>
            <View style={styles.rirGrid}>
              {RIR_OPTIONS.map((rir) => (
                <TouchableOpacity
                  key={rir}
                  style={[styles.rirOption, { borderColor: getRIRColor(rir) }]}
                  onPress={() =>
                    handleCompleteSet(showRIRPicker.exerciseIdx, showRIRPicker.setIdx, rir)
                  }
                >
                  <Text style={[styles.rirOptionVal, { color: getRIRColor(rir) }]}>{rir}</Text>
                  <Text style={styles.rirOptionLabel}>{getRIRLabel(rir)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.rirCancel} onPress={() => setShowRIRPicker(null)}>
              <Text style={styles.rirCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

interface SetRowProps {
  set: WorkoutSet;
  setIdx: number;
  previousSet?: { weight: number; reps: number };
  unitLabel: string;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onComplete: () => void;
  onDelete: () => void;
}

function SetRow({ set, setIdx, previousSet, unitLabel, onUpdate, onComplete, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(set.weight > 0 ? set.weight.toString() : "");
  const [reps, setReps] = useState(set.reps > 0 ? set.reps.toString() : "");

  const targetReps = previousSet && weight
    ? getLiveTargetReps(parseFloat(weight) || 0, previousSet.weight, previousSet.reps)
    : 0;

  const handleWeightChange = (text: string) => {
    setWeight(text);
    const num = parseFloat(text);
    if (!isNaN(num)) onUpdate({ weight: num });
  };

  const handleRepsChange = (text: string) => {
    setReps(text);
    const num = parseInt(text);
    if (!isNaN(num)) onUpdate({ reps: num });
  };

  return (
    <View style={[styles.setRow, set.completed && styles.setRowCompleted]}>
      <Text style={[styles.setNum, { flex: 0.5 }]}>{setIdx + 1}</Text>
      <TextInput
        style={styles.bigInput}
        value={weight}
        onChangeText={handleWeightChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={C.textMuted}
        editable={!set.completed}
      />
      <TextInput
        style={styles.bigInput}
        value={reps}
        onChangeText={handleRepsChange}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={C.textMuted}
        editable={!set.completed}
      />
      <View style={[styles.targetCol, { flex: 0.7 }]}>
        {targetReps > 0 && !set.completed ? (
          <Text style={styles.targetRepsText}>{targetReps}</Text>
        ) : set.completed ? (
          <View style={[styles.rirBadge, { backgroundColor: getRIRColor(set.rir) }]}>
            <Text style={styles.rirBadgeText}>{set.rir}</Text>
          </View>
        ) : (
          <Text style={styles.targetDash}>—</Text>
        )}
      </View>
      <View style={styles.setAction}>
        {set.completed ? (
          <TouchableOpacity onPress={onDelete}>
            <Trash2 size={16} color={C.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.checkBtn} onPress={onComplete}>
            <Check size={16} color={C.tint} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: C.textSecondary, marginBottom: 16 },
  goStartBtn: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  goStartBtnText: { fontSize: 15, fontWeight: "700" as const, color: C.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBtn: { width: 40, alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  workoutTitle: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  timerText: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  finishBtn: {
    backgroundColor: C.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishText: { fontSize: 14, fontWeight: "700" as const, color: C.white },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: C.backgroundSecondary,
    gap: 8,
  },
  summaryItem: { fontSize: 13, fontWeight: "600" as const, color: C.textSecondary },
  summaryDot: { fontSize: 13, color: C.textMuted },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  exerciseCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  exerciseHeaderLeft: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: "700" as const, color: C.tint },
  previousBest: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  exerciseRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  setCount: { fontSize: 13, color: C.textSecondary },
  exerciseBody: { paddingHorizontal: 14, paddingBottom: 14 },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    textAlign: "center" as const,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  setRowCompleted: { backgroundColor: C.backgroundSecondary },
  setNum: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textAlign: "center" as const,
  },
  bigInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700" as const,
    color: C.text,
    textAlign: "center" as const,
    paddingVertical: 6,
  },
  targetCol: { alignItems: "center", justifyContent: "center" },
  targetRepsText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.tint,
  },
  targetDash: { fontSize: 14, color: C.textMuted },
  rirBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rirBadgeText: { fontSize: 12, fontWeight: "800" as const, color: C.white },
  setAction: { width: 36, alignItems: "center" },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  addSetBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "dashed" as const,
    borderRadius: 8,
  },
  addSetText: { fontSize: 14, fontWeight: "600" as const, color: C.tint },
  removeExBtn: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
  },
  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.tintLight,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addExerciseText: { fontSize: 15, fontWeight: "700" as const, color: C.tint },
  rirOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 100,
  },
  rirBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.overlay,
  },
  rirSheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  rirTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: C.text,
    textAlign: "center" as const,
    marginBottom: 4,
  },
  rirSubtitle: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  rirGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginBottom: 20,
  },
  rirOption: {
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 3,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  rirOptionVal: { fontSize: 26, fontWeight: "800" as const },
  rirOptionLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: C.textSecondary,
    marginTop: 2,
  },
  rirCancel: {
    backgroundColor: C.surfaceElevated,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rirCancelText: { fontSize: 16, fontWeight: "600" as const, color: C.text },
});

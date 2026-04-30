import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  TrendingUp,
  Hash,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";
import { useMemo, useState, useCallback } from "react";
import { WorkoutLog, ExerciseLog, WorkoutSet } from "@/types/fitness";

const C = Colors.light;

function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getExerciseVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

function getTotalVolume(exercises: ExerciseLog[]): number {
  return exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((sSum, s) => sSum + s.weight * s.reps, 0),
    0
  );
}

function getTotalReps(exercises: ExerciseLog[]): number {
  return exercises.reduce(
    (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + s.reps, 0),
    0
  );
}

function getTotalSets(exercises: ExerciseLog[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { workoutHistory, weightUnit } = useWorkoutStore();

  const workout = useMemo<WorkoutLog | undefined>(
    () => workoutHistory.find((w) => w.id === id),
    [workoutHistory, id]
  );

  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const durationMs = workout.endTime
    ? workout.endTime - workout.startTime
    : 0;
  const totalVolume = getTotalVolume(workout.exercises);
  const totalReps = getTotalReps(workout.exercises);
  const totalSets = getTotalSets(workout.exercises);
  const dateStr = new Date(workout.startTime).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = new Date(workout.startTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {workout.routineName}
            </Text>
            <Text style={styles.headerSubtitle}>{dateStr}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconWrap}>
                  <Clock size={16} color={C.tint} />
                </View>
                <Text style={styles.summaryValue}>
                  {durationMs > 0 ? formatDuration(durationMs) : "—"}
                </Text>
                <Text style={styles.summaryLabel}>Duration</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconWrap}>
                  <TrendingUp size={16} color={C.tint} />
                </View>
                <Text style={styles.summaryValue}>
                  {totalVolume >= 1000
                    ? `${(totalVolume / 1000).toFixed(1)}k`
                    : Math.round(totalVolume)}
                </Text>
                <Text style={styles.summaryLabel}>Volume ({unitLabel})</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconWrap}>
                  <Hash size={16} color={C.tint} />
                </View>
                <Text style={styles.summaryValue}>{totalReps}</Text>
                <Text style={styles.summaryLabel}>Reps</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <View style={styles.summaryIconWrap}>
                  <Dumbbell size={16} color={C.tint} />
                </View>
                <Text style={styles.summaryValue}>{totalSets}</Text>
                <Text style={styles.summaryLabel}>Sets</Text>
              </View>
            </View>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeText}>Started at {timeStr}</Text>
            {workout.endTime && (
              <Text style={styles.timeText}>
                Ended at{" "}
                {new Date(workout.endTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </View>

          <View style={styles.exercisesList}>
            {workout.exercises.map((exercise, exIdx) => (
              <ExerciseCard
                key={`${workout.id}_ex_${exIdx}`}
                exercise={exercise}
                unitLabel={unitLabel}
                index={exIdx}
              />
            ))}
          </View>

          {workout.exercises.length === 0 && (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyExercisesText}>
                No exercises recorded in this session.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function ExerciseCard({
  exercise,
  unitLabel,
  index,
}: {
  exercise: ExerciseLog;
  unitLabel: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const volume = getExerciseVolume(exercise.sets);
  const completedSets = exercise.sets.filter((s) => s.completed).length;

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.exerciseCard}>
      <TouchableOpacity
        style={styles.exerciseHeader}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseIndex}>
          <Text style={styles.exerciseIndexText}>{index + 1}</Text>
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
          <Text style={styles.exerciseMeta}>
            {completedSets}/{exercise.sets.length} sets · {Math.round(volume)}{" "}
            {unitLabel}
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={18} color={C.textMuted} />
        ) : (
          <ChevronDown size={18} color={C.textMuted} />
        )}
      </TouchableOpacity>

      {expanded && exercise.sets.length > 0 && (
        <View style={styles.setsContainer}>
          <View style={styles.setsHeaderRow}>
            <Text style={[styles.setsHeaderCell, styles.setNumCol]}>SET</Text>
            <Text style={[styles.setsHeaderCell, styles.weightCol]}>
              WEIGHT
            </Text>
            <Text style={[styles.setsHeaderCell, styles.repsCol]}>REPS</Text>
            <Text style={[styles.setsHeaderCell, styles.rirCol]}>RIR</Text>
            <Text style={[styles.setsHeaderCell, styles.statusCol]}>
              STATUS
            </Text>
          </View>
          {exercise.sets.map((set, setIdx) => (
            <View
              key={`set_${setIdx}`}
              style={[
                styles.setRow,
                setIdx % 2 === 0 && styles.setRowAlt,
              ]}
            >
              <Text style={[styles.setCell, styles.setNumCol, styles.setCellNum]}>
                {setIdx + 1}
              </Text>
              <Text style={[styles.setCell, styles.weightCol]}>
                {set.weight > 0 ? `${set.weight} ${unitLabel}` : "—"}
              </Text>
              <Text style={[styles.setCell, styles.repsCol]}>{set.reps}</Text>
              <Text style={[styles.setCell, styles.rirCol]}>{set.rir}</Text>
              <View style={[styles.statusCol, styles.statusCellWrap]}>
                <View
                  style={[
                    styles.statusBadge,
                    set.completed
                      ? styles.statusCompleted
                      : styles.statusSkipped,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      set.completed
                        ? styles.statusTextCompleted
                        : styles.statusTextSkipped,
                    ]}
                  >
                    {set.completed ? "Done" : "Skip"}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: C.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: C.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: C.border,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: C.textMuted,
  },
  exercisesList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.tint,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.text,
  },
  exerciseMeta: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  setsHeaderRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: C.backgroundSecondary,
  },
  setsHeaderCell: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: C.textMuted,
    letterSpacing: 0.5,
  },
  setNumCol: {
    width: 36,
  },
  weightCol: {
    flex: 1,
  },
  repsCol: {
    width: 48,
    textAlign: "center" as const,
  },
  rirCol: {
    width: 40,
    textAlign: "center" as const,
  },
  statusCol: {
    width: 50,
    alignItems: "flex-end" as const,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  setRowAlt: {
    backgroundColor: C.backgroundSecondary,
  },
  setCell: {
    fontSize: 14,
    color: C.text,
    fontWeight: "500" as const,
  },
  setCellNum: {
    color: C.textMuted,
    fontWeight: "600" as const,
  },
  statusCellWrap: {
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: "#E8F9EE",
  },
  statusSkipped: {
    backgroundColor: C.surfaceElevated,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  statusTextCompleted: {
    color: C.success,
  },
  statusTextSkipped: {
    color: C.textMuted,
  },
  emptyExercises: {
    padding: 40,
    alignItems: "center",
  },
  emptyExercisesText: {
    fontSize: 14,
    color: C.textMuted,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: C.textSecondary,
  },
  backButton: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.white,
  },
});

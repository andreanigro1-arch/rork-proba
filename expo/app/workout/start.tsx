import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Play, Dumbbell, ChevronRight } from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function StartWorkoutScreen() {
  const router = useRouter();
  const { routineId, routineName } = useLocalSearchParams<{
    routineId?: string;
    routineName?: string;
  }>();
  const { routines, startWorkout, activeWorkout } = useWorkoutStore();

  const selectedRoutine = routineId
    ? routines.find((r) => r.id === routineId)
    : routines.find((r) => r.isActive);

  const handleStartWorkout = () => {
    if (activeWorkout) {
      Alert.alert(
        "Workout in Progress",
        "You already have an active workout. Resume or start new?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Resume", onPress: () => router.push("/workout/active") },
          {
            text: "Start New",
            style: "destructive",
            onPress: () => {
              startWorkout(selectedRoutine?.id, selectedRoutine?.name || "Quick Workout");
              router.push("/workout/active");
            },
          },
        ]
      );
    } else {
      startWorkout(selectedRoutine?.id, selectedRoutine?.name || "Quick Workout");
      router.push("/workout/active");
    }
  };

  const totalSets = selectedRoutine?.exercises.reduce((s, e) => s + e.targetSets, 0) || 0;
  const estDuration = selectedRoutine
    ? Math.round(
        selectedRoutine.exercises.reduce(
          (sum, e) => sum + e.targetSets * (30 + e.restSeconds),
          0
        ) / 60
      )
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start Workout</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedRoutine ? (
          <>
            <View style={styles.routineCard}>
              <Text style={styles.routineName}>{selectedRoutine.name}</Text>
              <View style={styles.routineMetaRow}>
                <Text style={styles.routineMetaItem}>
                  {selectedRoutine.exercises.length} exercises
                </Text>
                <Text style={styles.routineMetaDot}>·</Text>
                <Text style={styles.routineMetaItem}>{totalSets} sets</Text>
                <Text style={styles.routineMetaDot}>·</Text>
                <Text style={styles.routineMetaItem}>~{estDuration} min</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Exercises</Text>
            {selectedRoutine.exercises.map((exercise, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <View style={styles.exerciseNum}>
                  <Text style={styles.exerciseNumText}>{idx + 1}</Text>
                </View>
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                  <Text style={styles.exerciseSets}>
                    {exercise.targetSets} × {exercise.targetRepsMin}-{exercise.targetRepsMax}
                  </Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            <Text style={styles.sectionLabel}>Quick Start</Text>
            <TouchableOpacity style={styles.optionCard} onPress={handleStartWorkout}>
              <View style={styles.optionIcon}>
                <Dumbbell size={22} color={C.tint} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Empty Workout</Text>
                <Text style={styles.optionDesc}>Log exercises as you go</Text>
              </View>
              <ChevronRight size={18} color={C.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStartWorkout}
          activeOpacity={0.85}
        >
          <Play size={20} color={C.white} fill={C.white} />
          <Text style={styles.startBtnText}>
            {selectedRoutine ? "Start Routine" : "Start Empty Workout"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" as const, color: C.text },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  routineCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  routineName: { fontSize: 20, fontWeight: "700" as const, color: C.text },
  routineMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  routineMetaItem: { fontSize: 13, color: C.textSecondary },
  routineMetaDot: { fontSize: 13, color: C.textMuted, marginHorizontal: 6 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  exerciseNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseNumText: { fontSize: 13, fontWeight: "700" as const, color: C.tint },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  exerciseSets: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 14,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "600" as const, color: C.text },
  optionDesc: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  footer: {
    padding: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.tint,
    paddingVertical: 16,
    borderRadius: 10,
  },
  startBtnText: { fontSize: 17, fontWeight: "700" as const, color: C.white },
});

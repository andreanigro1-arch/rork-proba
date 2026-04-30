import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Play, Plus, MoreHorizontal, ChevronRight, Dumbbell } from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function WorkoutTab() {
  const router = useRouter();
  const { routines, setActiveRoutine, deleteRoutine, activeWorkout } = useWorkoutStore();

  const handleStartRoutine = (routineId: string, routineName: string) => {
    router.push({
      pathname: "/workout/start",
      params: { routineId, routineName },
    });
  };

  const handleRoutineOptions = (routineId: string, routineName: string) => {
    Alert.alert(routineName, "Choose an action", [
      { text: "Cancel", style: "cancel" },
      { text: "Set as Active", onPress: () => setActiveRoutine(routineId) },
      { text: "Delete", style: "destructive", onPress: () => deleteRoutine(routineId) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Workout</Text>
          <TouchableOpacity onPress={() => router.push("/routine-builder")}>
            <Text style={styles.createBtnText}>New Routine</Text>
          </TouchableOpacity>
        </View>

        {activeWorkout && (
          <TouchableOpacity
            style={styles.resumeBanner}
            onPress={() => router.push("/workout/active")}
            activeOpacity={0.85}
          >
            <View style={styles.resumeDot} />
            <View style={styles.resumeInfo}>
              <Text style={styles.resumeTitle}>{activeWorkout.routineName}</Text>
              <Text style={styles.resumeSub}>Workout in progress</Text>
            </View>
            <ChevronRight size={18} color={C.white} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.quickStart}
          onPress={() => router.push("/workout/start")}
          activeOpacity={0.85}
        >
          <Play size={18} color={C.white} fill={C.white} />
          <Text style={styles.quickStartText}>Start Empty Workout</Text>
        </TouchableOpacity>

        {routines.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>My Routines</Text>
            {routines.map((routine) => {
              const totalSets = routine.exercises.reduce((s, e) => s + e.targetSets, 0);
              return (
                <View key={routine.id} style={styles.routineCard}>
                  <View style={styles.routineCardHeader}>
                    <View style={styles.routineCardLeft}>
                      <Text style={styles.routineTitle}>{routine.name}</Text>
                      <Text style={styles.routineMeta}>
                        {routine.exercises.length} exercises · {totalSets} sets
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRoutineOptions(routine.id, routine.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MoreHorizontal size={20} color={C.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.routineExercises} numberOfLines={2}>
                    {routine.exercises.map(e => e.exerciseName).join(" · ")}
                  </Text>
                  <TouchableOpacity
                    style={styles.startRoutineBtn}
                    onPress={() => handleStartRoutine(routine.id, routine.name)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.startRoutineBtnText}>Start Routine</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {routines.length === 0 && (
          <View style={styles.emptyState}>
            <Dumbbell size={44} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No routines yet</Text>
            <Text style={styles.emptyText}>
              Create a routine to organize your training
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/routine-builder")}
            >
              <Plus size={16} color={C.tint} />
              <Text style={styles.emptyBtnText}>Create Routine</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700" as const, color: C.text },
  createBtnText: { fontSize: 15, fontWeight: "600" as const, color: C.tint },
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  resumeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34D399",
  },
  resumeInfo: { flex: 1 },
  resumeTitle: { fontSize: 15, fontWeight: "700" as const, color: "#FFFFFF" },
  resumeSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 },
  quickStart: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.tint,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  quickStartText: { fontSize: 16, fontWeight: "700" as const, color: C.white },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routineCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  routineCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  routineCardLeft: { flex: 1, marginRight: 12 },
  routineTitle: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  routineMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  routineExercises: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 19,
    marginBottom: 14,
  },
  startRoutineBtn: {
    backgroundColor: C.tint,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  startRoutineBtnText: { fontSize: 15, fontWeight: "700" as const, color: C.white },
  emptyState: { alignItems: "center", paddingVertical: 50, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "600" as const, color: C.text, marginTop: 14 },
  emptyText: { fontSize: 14, color: C.textSecondary, marginTop: 4, textAlign: "center" as const },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.tintLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyBtnText: { fontSize: 15, fontWeight: "700" as const, color: C.tint },
});

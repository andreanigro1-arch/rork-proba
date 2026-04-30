import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Settings, Clock, Dumbbell, TrendingUp, Calendar } from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";
import { useMemo } from "react";

const C = Colors.light;
const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { userStats, workoutHistory, weightUnit } = useWorkoutStore();
  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  const totalDurationHrs = useMemo(
    () => (userStats.totalDurationMs / 3600000).toFixed(1),
    [userStats.totalDurationMs]
  );

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const workoutDates = new Set(
      workoutHistory.map((w) => {
        const d = new Date(w.startTime);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
    );

    const cells: { day: number; hasWorkout: boolean; empty: boolean }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, hasWorkout: false, empty: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      cells.push({ day: d, hasWorkout: workoutDates.has(key), empty: false });
    }
    return cells;
  }, [workoutHistory]);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const barData = useMemo(() => {
    return workoutHistory
      .slice(0, 12)
      .reverse()
      .map((w) => ({
        durationMin: w.endTime ? Math.round((w.endTime - w.startTime) / 60000) : 0,
      }));
  }, [workoutHistory]);

  const maxBarVal = Math.max(...barData.map((b) => b.durationMin), 1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/settings")}>
          <Settings size={20} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Dumbbell size={18} color={C.tint} />
            <Text style={styles.statValue}>{userStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statBox}>
            <Clock size={18} color="#8B5CF6" />
            <Text style={styles.statValue}>{totalDurationHrs}h</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statBox}>
            <TrendingUp size={18} color="#22c55e" />
            <Text style={styles.statValue}>
              {userStats.totalVolume >= 1000000
                ? `${(userStats.totalVolume / 1000000).toFixed(1)}M`
                : userStats.totalVolume >= 1000
                ? `${(userStats.totalVolume / 1000).toFixed(0)}k`
                : userStats.totalVolume}
            </Text>
            <Text style={styles.statLabel}>Volume ({unitLabel})</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statEmoji}>💪</Text>
            <Text style={styles.statValue}>{userStats.totalReps.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Reps</Text>
          </View>
        </View>

        <View style={styles.streakCard}>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{userStats.currentStreak}</Text>
              <Text style={styles.streakLabel}>Current Streak</Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakValue}>{userStats.longestStreak}</Text>
              <Text style={styles.streakLabel}>Longest Streak</Text>
            </View>
          </View>
        </View>

        {barData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Duration Trend</Text>
            <View style={styles.chartBars}>
              {barData.map((b, idx) => {
                const h = Math.max(4, (b.durationMin / maxBarVal) * 70);
                return (
                  <View key={idx} style={styles.barCol}>
                    <View style={[styles.bar, { height: h }]} />
                  </View>
                );
              })}
              {barData.length === 0 && (
                <View style={styles.chartEmpty}>
                  <Text style={styles.chartEmptyText}>No data yet</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.calendarCard}>
          <Text style={styles.cardTitle}>{monthName}</Text>
          <View style={styles.dayHeaders}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((cell, idx) => (
              <View key={idx} style={styles.calendarCell}>
                {!cell.empty && (
                  <View style={[styles.calendarDay, cell.hasWorkout && styles.calendarDayActive]}>
                    <Text
                      style={[
                        styles.calendarDayText,
                        cell.hasWorkout && styles.calendarDayTextActive,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {workoutHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.cardTitle}>Workout History</Text>
            {workoutHistory.slice(0, 10).map((workout) => {
              const totalVolume = workout.exercises.reduce(
                (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + s.weight * s.reps, 0),
                0
              );
              const totalReps = workout.exercises.reduce(
                (sum, ex) => sum + ex.sets.reduce((sSum, s) => sSum + s.reps, 0),
                0
              );
              const durationMin = workout.endTime
                ? Math.floor((workout.endTime - workout.startTime) / 60000)
                : 0;
              return (
                <View key={workout.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyName}>{workout.routineName}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(workout.startTime).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyMetaText}>
                      {durationMin}min · {Math.round(totalVolume).toLocaleString()} {unitLabel} · {totalReps} reps
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
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
  scrollContent: { padding: 20, paddingBottom: 100 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    width: (width - 50) / 2,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statEmoji: { fontSize: 18 },
  statValue: { fontSize: 22, fontWeight: "800" as const, color: C.text },
  statLabel: { fontSize: 12, color: C.textSecondary },
  streakCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  streakRow: { flexDirection: "row", alignItems: "center" },
  streakItem: { flex: 1, alignItems: "center" },
  streakValue: { fontSize: 28, fontWeight: "800" as const, color: C.text },
  streakLabel: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  streakDivider: { width: 1, height: 36, backgroundColor: C.border },
  chartCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: "700" as const, color: C.text, marginBottom: 12 },
  chartBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: 14, backgroundColor: C.tint, borderRadius: 3, minHeight: 4 },
  chartEmpty: { flex: 1, alignItems: "center", justifyContent: "center", height: 70 },
  chartEmptyText: { fontSize: 13, color: C.textMuted },
  calendarCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  dayHeaders: { flexDirection: "row", marginBottom: 8 },
  dayHeader: {
    flex: 1,
    textAlign: "center" as const,
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  calendarDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarDayActive: { backgroundColor: C.tint },
  calendarDayText: { fontSize: 13, color: C.text },
  calendarDayTextActive: { color: C.white, fontWeight: "700" as const },
  section: { marginBottom: 20 },
  historyCard: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyName: { fontSize: 15, fontWeight: "700" as const, color: C.text },
  historyDate: { fontSize: 12, color: C.textSecondary },
  historyMeta: {},
  historyMetaText: { fontSize: 13, color: C.textSecondary },
});

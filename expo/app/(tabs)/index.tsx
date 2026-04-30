import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Play,
  User,
  Settings,
  Flame,
  Calendar,
  Layers,
  Dumbbell,
  ChevronRight,
  CheckCircle,
  Circle,
  Zap,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";
import { useMemo, useState, useCallback } from "react";
import { MesocycleDay } from "@/types/fitness";
import { isWeekUnlocked } from "@/lib/progression";

const C = Colors.light;
const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const {
    routines,
    userStats,
    activeMesocycleId,
    mesocycles,
    workoutHistory,
    weightUnit,
    activeWorkout,
    startWorkoutFromSchedule,
  } = useWorkoutStore();

  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const activeMesocycle = mesocycles.find((m) => m.id === activeMesocycleId);
  const currentWeek = activeMesocycle?.weeks[activeMesocycle.currentWeek];

  const weekStats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recent = workoutHistory.filter((w) => w.startTime > weekAgo);
    const volume = recent.reduce(
      (sum, w) =>
        sum +
        w.exercises.reduce(
          (eSum, e) =>
            eSum + e.sets.reduce((sSum, s) => sSum + s.weight * s.reps, 0),
          0
        ),
      0
    );
    const reps = recent.reduce(
      (sum, w) =>
        sum +
        w.exercises.reduce(
          (eSum, e) => eSum + e.sets.reduce((sSum, s) => sSum + s.reps, 0),
          0
        ),
      0
    );
    const durationMs = recent.reduce(
      (sum, w) => sum + (w.endTime ? w.endTime - w.startTime : 0),
      0
    );
    return {
      count: recent.length,
      volume,
      reps,
      durationMin: Math.round(durationMs / 60000),
    };
  }, [workoutHistory]);

  const weekDays = useMemo(() => {
    const days: boolean[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      days.push(
        workoutHistory.some(
          (w) => new Date(w.startTime).toDateString() === dayStr
        )
      );
    }
    return days;
  }, [workoutHistory]);

  const dayLabels = useMemo(() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      labels.push(
        d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)
      );
    }
    return labels;
  }, []);

  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  const currentWeekSchedule = useMemo(() => {
    if (!activeMesocycle) return [];
    const schedule = activeMesocycle.schedule || [];
    const weekNum = activeMesocycle.currentWeek + 1;
    return schedule.filter((d) => d.weekNumber === weekNum);
  }, [activeMesocycle]);

  const nextWorkout = useMemo(() => {
    return currentWeekSchedule.find((d) => !d.completed);
  }, [currentWeekSchedule]);

  const mesoProgress = useMemo(() => {
    if (!activeMesocycle) return { completed: 0, total: 0, percent: 0 };
    const schedule = activeMesocycle.schedule || [];
    const completed = schedule.filter((d) => d.completed).length;
    const total = schedule.length;
    return {
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [activeMesocycle]);

  const handleStartDay = useCallback(
    (day: MesocycleDay) => {
      if (!activeMesocycle) return;

      if (!isWeekUnlocked(activeMesocycle.schedule || [], day.weekNumber)) {
        Alert.alert(
          "Week Locked",
          `Complete all workouts in Week ${day.weekNumber - 1} first to unlock this week.`
        );
        return;
      }

      if (activeWorkout) {
        Alert.alert(
          "Workout in Progress",
          "You already have an active workout. Resume or start this one?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resume Current",
              onPress: () => router.push("/workout/active"),
            },
            {
              text: "Start New",
              style: "destructive",
              onPress: () => {
                startWorkoutFromSchedule(activeMesocycle.id, day.id);
                router.push("/workout/active");
              },
            },
          ]
        );
      } else {
        startWorkoutFromSchedule(activeMesocycle.id, day.id);
        router.push("/workout/active");
      }
    },
    [activeMesocycle, activeWorkout, router, startWorkoutFromSchedule]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Home</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/(tabs)/profile")}
            >
              <User size={20} color={C.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push("/settings")}
            >
              <Settings size={20} color={C.text} />
            </TouchableOpacity>
          </View>
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
              <Text style={styles.resumeSub}>Workout in progress — tap to resume</Text>
            </View>
            <ChevronRight size={18} color={C.white} />
          </TouchableOpacity>
        )}

        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
            <Text style={styles.weekTitle}>This Week</Text>
            <View style={styles.streakBadge}>
              <Flame size={14} color="#F97316" />
              <Text style={styles.streakText}>{userStats.currentStreak}</Text>
            </View>
          </View>
          <View style={styles.weekDots}>
            {weekDays.map((active, idx) => (
              <View key={idx} style={styles.weekDayCol}>
                <View
                  style={[styles.weekDot, active && styles.weekDotActive]}
                />
                <Text style={styles.weekDayLabel}>{dayLabels[idx]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.weekStatsRow}>
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{weekStats.count}</Text>
              <Text style={styles.weekStatLabel}>Workouts</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>
                {weekStats.volume >= 1000
                  ? `${(weekStats.volume / 1000).toFixed(1)}k`
                  : weekStats.volume}
              </Text>
              <Text style={styles.weekStatLabel}>Volume ({unitLabel})</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStatItem}>
              <Text style={styles.weekStatValue}>{weekStats.durationMin}</Text>
              <Text style={styles.weekStatLabel}>Minutes</Text>
            </View>
          </View>
        </View>

        {activeMesocycle && currentWeek && (
          <View style={styles.mesoHubCard}>
            <View style={styles.mesoHubHeader}>
              <View style={styles.mesoHubLeft}>
                <View style={styles.mesoHubBadge}>
                  <Zap size={10} color={C.white} />
                  <Text style={styles.mesoHubBadgeText}>ACTIVE PLAN</Text>
                </View>
                <Text style={styles.mesoHubName}>
                  {activeMesocycle.name}
                </Text>
                <Text style={styles.mesoHubWeek}>
                  Week {activeMesocycle.currentWeek + 1} of{" "}
                  {activeMesocycle.weeks.length}
                  {currentWeek.isDeload ? " · Deload" : ""}
                </Text>
              </View>
              <View style={styles.mesoHubRight}>
                <View style={styles.mesoHubPercent}>
                  <Text style={styles.mesoHubPercentValue}>
                    {mesoProgress.percent}%
                  </Text>
                </View>
                <View style={styles.rirChip}>
                  <Text style={styles.rirChipText}>
                    RIR {currentWeek.targetRIR}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.mesoHubProgress}>
              <View style={styles.mesoHubProgressTrack}>
                <View
                  style={[
                    styles.mesoHubProgressFill,
                    {
                      width:
                        mesoProgress.total > 0
                          ? `${mesoProgress.percent}%`
                          : "0%",
                    },
                  ]}
                />
              </View>
              <Text style={styles.mesoHubProgressLabel}>
                {mesoProgress.completed}/{mesoProgress.total} sessions
              </Text>
            </View>

            {nextWorkout && (
              <TouchableOpacity
                style={styles.nextWorkoutBtn}
                onPress={() => handleStartDay(nextWorkout)}
                activeOpacity={0.85}
              >
                <View style={styles.nextWorkoutInfo}>
                  <Text style={styles.nextWorkoutLabel}>NEXT UP</Text>
                  <Text style={styles.nextWorkoutName}>
                    {nextWorkout.routineName}
                  </Text>
                  <Text style={styles.nextWorkoutDay}>
                    Week {nextWorkout.weekNumber} · Day {nextWorkout.dayIndex}
                  </Text>
                </View>
                <View style={styles.nextWorkoutPlay}>
                  <Play size={16} color={C.white} fill={C.white} />
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.scheduleToggle}
              onPress={() => setShowFullSchedule(!showFullSchedule)}
              activeOpacity={0.7}
            >
              <Calendar size={15} color={C.tint} />
              <Text style={styles.scheduleToggleText}>
                {showFullSchedule
                  ? "Hide Week Schedule"
                  : "View Week Schedule"}
              </Text>
              {showFullSchedule ? (
                <ChevronUp size={15} color={C.tint} />
              ) : (
                <ChevronDown size={15} color={C.tint} />
              )}
            </TouchableOpacity>

            {showFullSchedule && currentWeekSchedule.length > 0 && (
              <View style={styles.scheduleList}>
                {currentWeekSchedule.map((day) => {
                  const locked = activeMesocycle ? !isWeekUnlocked(activeMesocycle.schedule || [], day.weekNumber) : false;
                  return (
                    <TouchableOpacity
                      key={day.id}
                      style={[
                        styles.scheduleDayRow,
                        day.completed && styles.scheduleDayDone,
                        locked && styles.scheduleDayLocked,
                      ]}
                      onPress={() => handleStartDay(day)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.scheduleDayLeft}>
                        {locked ? (
                          <Lock size={18} color={C.textMuted} />
                        ) : day.completed ? (
                          <CheckCircle size={18} color={C.success} />
                        ) : (
                          <Circle size={18} color={C.textMuted} />
                        )}
                        <View style={styles.scheduleDayInfo}>
                          <Text
                            style={[
                              styles.scheduleDayName,
                              day.completed && styles.scheduleDayNameDone,
                              locked && styles.scheduleDayNameLocked,
                            ]}
                          >
                            {day.routineName}
                          </Text>
                          <Text style={styles.scheduleDayLabel}>
                            Day {day.dayIndex}
                          </Text>
                        </View>
                      </View>
                      {locked ? (
                        <Lock size={14} color={C.textMuted} />
                      ) : !day.completed ? (
                        <View style={styles.scheduleDayPlay}>
                          <Play size={12} color={C.white} fill={C.white} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <TouchableOpacity
              style={styles.fullScheduleLink}
              onPress={() => router.push("/(tabs)/mesocycles")}
              activeOpacity={0.7}
            >
              <Text style={styles.fullScheduleLinkText}>
                View Full Mesocycle
              </Text>
              <ChevronRight size={16} color={C.tint} />
            </TouchableOpacity>
          </View>
        )}

        {!activeMesocycle && (
          <TouchableOpacity
            style={styles.noMesoCard}
            onPress={() => router.push("/(tabs)/mesocycles")}
            activeOpacity={0.7}
          >
            <View style={styles.noMesoIconWrap}>
              <Layers size={24} color={C.tint} />
            </View>
            <View style={styles.noMesoInfo}>
              <Text style={styles.noMesoTitle}>Choose a Mesocycle</Text>
              <Text style={styles.noMesoDesc}>
                Select a training program to begin your plan
              </Text>
            </View>
            <ChevronRight size={18} color={C.textMuted} />
          </TouchableOpacity>
        )}

        {workoutHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Workouts</Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/profile")}
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {workoutHistory.slice(0, 3).map((workout) => {
              const totalVolume = workout.exercises.reduce(
                (sum, ex) =>
                  sum +
                  ex.sets.reduce((sSum, s) => sSum + s.weight * s.reps, 0),
                0
              );
              const totalSets = workout.exercises.reduce(
                (sum, ex) => sum + ex.sets.length,
                0
              );
              const durationMin = workout.endTime
                ? Math.floor(
                    (workout.endTime - workout.startTime) / 60000
                  )
                : 0;
              return (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => router.push(`/workout-detail/${workout.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.workoutCardHeader}>
                    <Text style={styles.workoutName}>
                      {workout.routineName}
                    </Text>
                    <Text style={styles.workoutDate}>
                      {new Date(workout.startTime).toLocaleDateString(
                        "en-US",
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </Text>
                  </View>
                  <View style={styles.workoutMeta}>
                    <Text style={styles.workoutMetaItem}>
                      {durationMin > 0 ? `${durationMin}min` : "—"}
                    </Text>
                    <Text style={styles.workoutMetaDot}>·</Text>
                    <Text style={styles.workoutMetaItem}>
                      {Math.round(totalVolume).toLocaleString()} {unitLabel}
                    </Text>
                    <Text style={styles.workoutMetaDot}>·</Text>
                    <Text style={styles.workoutMetaItem}>
                      {totalSets} sets
                    </Text>
                  </View>
                  {workout.exercises.slice(0, 2).map((ex, idx) => (
                    <Text key={`${workout.id}_ex_${idx}`} style={styles.workoutExercise}>
                      {ex.sets.length}× {ex.exerciseName}
                    </Text>
                  ))}
                  {workout.exercises.length > 2 && (
                    <Text style={styles.workoutMore}>
                      +{workout.exercises.length - 2} more
                    </Text>
                  )}
                  <View style={styles.workoutTap}>
                    <Text style={styles.workoutTapText}>Tap to view details</Text>
                    <ChevronRight size={14} color={C.tint} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {workoutHistory.length === 0 && !activeMesocycle && (
          <View style={styles.emptyState}>
            <Layers size={48} color={C.textMuted} />
            <Text style={styles.emptyTitle}>Welcome to LiftOS</Text>
            <Text style={styles.emptyText}>
              Head to the Mesocycles tab to pick a training program and start your journey
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(tabs)/mesocycles")}
              activeOpacity={0.85}
            >
              <Layers size={16} color={C.white} />
              <Text style={styles.emptyBtnText}>Browse Mesocycles</Text>
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
  greeting: { fontSize: 28, fontWeight: "700" as const, color: C.text },
  headerActions: { flexDirection: "row", gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    marginHorizontal: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  weekCard: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  weekTitle: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: { fontSize: 13, fontWeight: "700" as const, color: "#F97316" },
  weekDots: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  weekDayCol: { alignItems: "center", gap: 6 },
  weekDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceElevated,
  },
  weekDotActive: { backgroundColor: C.tint },
  weekDayLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: "500" as const,
  },
  weekStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
  },
  weekStatItem: { flex: 1, alignItems: "center" },
  weekStatValue: { fontSize: 18, fontWeight: "700" as const, color: C.text },
  weekStatLabel: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  weekStatDivider: { width: 1, height: 28, backgroundColor: C.border },
  mesoHubCard: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  mesoHubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  mesoHubLeft: { flex: 1 },
  mesoHubBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.tint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  mesoHubBadgeText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: C.white,
    letterSpacing: 0.5,
  },
  mesoHubName: { fontSize: 17, fontWeight: "700" as const, color: C.text },
  mesoHubWeek: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  mesoHubRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  mesoHubPercent: {
    alignItems: "center",
  },
  mesoHubPercentValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: C.tint,
  },
  rirChip: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rirChipText: { fontSize: 12, fontWeight: "700" as const, color: C.tint },
  mesoHubProgress: {
    marginBottom: 14,
  },
  mesoHubProgressTrack: {
    height: 6,
    backgroundColor: C.surfaceElevated,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  mesoHubProgressFill: {
    height: 6,
    backgroundColor: C.tint,
    borderRadius: 3,
  },
  mesoHubProgressLabel: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: "500" as const,
  },
  nextWorkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.tintLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  nextWorkoutInfo: { flex: 1 },
  nextWorkoutLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: C.tint,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  nextWorkoutName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: C.text,
  },
  nextWorkoutDay: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  nextWorkoutPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
    marginBottom: 8,
  },
  scheduleToggleText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.tint,
  },
  scheduleList: {
    gap: 6,
    marginBottom: 10,
  },
  scheduleDayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.backgroundSecondary,
    borderRadius: 8,
  },
  scheduleDayDone: {
    opacity: 0.6,
  },
  scheduleDayLocked: {
    opacity: 0.45,
    backgroundColor: C.surfaceElevated,
  },
  scheduleDayNameLocked: {
    color: C.textMuted,
  },
  scheduleDayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  scheduleDayInfo: { flex: 1 },
  scheduleDayName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.text,
  },
  scheduleDayNameDone: {
    textDecorationLine: "line-through" as const,
    color: C.textSecondary,
  },
  scheduleDayLabel: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  scheduleDayPlay: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScheduleLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 4,
  },
  fullScheduleLinkText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.tint,
  },
  noMesoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    backgroundColor: C.tintLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.tint,
    borderStyle: "dashed" as const,
    padding: 18,
    gap: 14,
    marginBottom: 20,
  },
  noMesoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noMesoInfo: { flex: 1 },
  noMesoTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.text,
  },
  noMesoDesc: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" as const, color: C.text },
  seeAll: { fontSize: 14, fontWeight: "600" as const, color: C.tint },
  workoutCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  workoutName: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  workoutDate: { fontSize: 12, color: C.textSecondary },
  workoutMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  workoutMetaItem: { fontSize: 13, color: C.textSecondary },
  workoutMetaDot: {
    fontSize: 13,
    color: C.textMuted,
    marginHorizontal: 6,
  },
  workoutExercise: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 2,
  },
  workoutMore: { fontSize: 13, color: C.tint, marginTop: 6 },
  workoutTap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  workoutTapText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: C.tint,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: C.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center" as const,
    marginTop: 8,
    lineHeight: 22,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: C.white,
  },
});

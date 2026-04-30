import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Plus,
  ChevronRight,
  Trash2,
  CheckCircle,
  Play,
  Calendar,
  ChevronDown,
  ChevronUp,
  Circle,
  Zap,
  Lock,
  Trophy,
} from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import { mesocycleTemplates } from "@/mocks/templates";
import Colors from "@/constants/colors";
import { useMemo, useState, useRef, useCallback } from "react";
import { MesocycleDay, Mesocycle } from "@/types/fitness";
import { isWeekCompleted, isWeekUnlocked, getWeekVolume } from "@/lib/progression";

const C = Colors.light;

export default function MesocyclesTab() {
  const router = useRouter();
  const {
    mesocycles,
    routines,
    activeMesocycleId,
    createMesocycle,
    createRoutine,
    setActiveMesocycle,
    advanceMesocycleWeek,
    deleteMesocycle,
    startWorkoutFromSchedule,
    activeWorkout,
    startWorkout,
    completeMesocycleDay,
  } = useWorkoutStore();

  const [expandedMesoId, setExpandedMesoId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const activeMesocycle = mesocycles.find((m) => m.id === activeMesocycleId);

  const handleUseTemplate = useCallback((templateId: string) => {
    const template = mesocycleTemplates.find((t) => t.id === templateId);
    if (!template) return;

    const routineIds: string[] = [];
    for (const routineTemplate of template.routines) {
      createRoutine({
        name: routineTemplate.name,
        exercises: routineTemplate.exercises,
        isActive: false,
      });
      const latestRoutine = useWorkoutStore.getState().routines;
      const created = latestRoutine[latestRoutine.length - 1];
      if (created) routineIds.push(created.id);
    }

    createMesocycle(template.name, routineIds, template.defaultWeeks, template.id);
    Alert.alert(
      "Created",
      `${template.name} mesocycle is now active. Tap it to view the full schedule.`
    );
  }, [createMesocycle, createRoutine]);

  const handleDeleteMesocycle = useCallback((id: string, name: string) => {
    Alert.alert("Delete", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMesocycle(id) },
    ]);
  }, [deleteMesocycle]);

  const toggleWeek = useCallback((key: string) => {
    setExpandedWeeks((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const { workoutHistory } = useWorkoutStore();

  const handleStartDay = useCallback(
    (mesoId: string, day: MesocycleDay) => {
      const meso = mesocycles.find(m => m.id === mesoId);
      if (meso && !isWeekUnlocked(meso.schedule || [], day.weekNumber)) {
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
            { text: "Resume Current", onPress: () => router.push("/workout/active") },
            {
              text: "Start New",
              style: "destructive",
              onPress: () => {
                startWorkoutFromSchedule(mesoId, day.id);
                router.push("/workout/active");
              },
            },
          ]
        );
      } else {
        startWorkoutFromSchedule(mesoId, day.id);
        router.push("/workout/active");
      }
    },
    [activeWorkout, router, startWorkoutFromSchedule, mesocycles]
  );

  const getScheduleByWeek = useCallback(
    (schedule: MesocycleDay[]) => {
      const grouped: Record<number, MesocycleDay[]> = {};
      for (const day of schedule) {
        if (!grouped[day.weekNumber]) {
          grouped[day.weekNumber] = [];
        }
        grouped[day.weekNumber].push(day);
      }
      return grouped;
    },
    []
  );

  const renderSchedule = useCallback(
    (meso: Mesocycle) => {
      const schedule = meso.schedule || [];
      if (schedule.length === 0) {
        return (
          <View style={styles.emptySchedule}>
            <Text style={styles.emptyScheduleText}>
              No schedule available. This mesocycle was created before schedule tracking was added.
            </Text>
          </View>
        );
      }

      const byWeek = getScheduleByWeek(schedule);
      const weekNumbers = Object.keys(byWeek)
        .map(Number)
        .sort((a, b) => a - b);
      const mesoWeekData = meso.weeks || [];

      return (
        <View style={styles.scheduleContainer}>
          {weekNumbers.map((weekNum) => {
            const days = byWeek[weekNum];
            const weekKey = `${meso.id}_w${weekNum}`;
            const weekMeta = mesoWeekData.find((w) => w.weekNumber === weekNum);
            const completedCount = days.filter((d) => d.completed).length;
            const allDone = completedCount === days.length;
            const isCurrent = weekNum === meso.currentWeek + 1;
            const locked = !isWeekUnlocked(schedule, weekNum);
            const isExpanded = locked ? false : expandedWeeks[weekKey] !== false;

            const weekSummary = allDone
              ? getWeekVolume(schedule, weekNum, workoutHistory)
              : null;

            return (
              <View key={weekKey} style={[styles.weekSection, locked && styles.weekSectionLocked]}>
                <TouchableOpacity
                  style={[
                    styles.weekHeaderRow,
                    isCurrent && !locked && styles.weekHeaderCurrent,
                    allDone && styles.weekHeaderCompleted,
                    locked && styles.weekHeaderLocked,
                  ]}
                  onPress={() => {
                    if (locked) {
                      Alert.alert(
                        "Week Locked",
                        `Complete all workouts in Week ${weekNum - 1} to unlock Week ${weekNum}. Progression targets will be generated based on your Week ${weekNum - 1} performance.`
                      );
                      return;
                    }
                    toggleWeek(weekKey);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.weekHeaderLeft}>
                    {locked ? (
                      <Lock size={16} color={C.textMuted} />
                    ) : allDone ? (
                      <Trophy size={16} color="#F59E0B" />
                    ) : isCurrent ? (
                      <Zap size={16} color={C.tint} />
                    ) : (
                      <Circle size={16} color={C.textMuted} />
                    )}
                    <Text
                      style={[
                        styles.weekLabel,
                        isCurrent && !locked && styles.weekLabelCurrent,
                        locked && styles.weekLabelLocked,
                      ]}
                    >
                      Week {weekNum}
                      {weekMeta?.isDeload ? " (Deload)" : ""}
                    </Text>
                    {weekMeta && !locked && (
                      <View
                        style={[
                          styles.rirMiniChip,
                          weekMeta.isDeload && styles.rirMiniChipDeload,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rirMiniText,
                            weekMeta.isDeload && styles.rirMiniTextDeload,
                          ]}
                        >
                          RIR {weekMeta.targetRIR}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.weekHeaderRight}>
                    {locked ? (
                      <View style={styles.lockedChip}>
                        <Lock size={10} color={C.textMuted} />
                        <Text style={styles.lockedChipText}>Locked</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.weekProgress}>
                          {completedCount}/{days.length}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={16} color={C.textMuted} />
                        ) : (
                          <ChevronDown size={16} color={C.textMuted} />
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {allDone && weekSummary && !isExpanded && (
                  <View style={styles.weekSummaryRow}>
                    <View style={styles.weekSummaryItem}>
                      <Text style={styles.weekSummaryValue}>
                        {weekSummary.volume >= 1000
                          ? `${(weekSummary.volume / 1000).toFixed(1)}k`
                          : Math.round(weekSummary.volume)}
                      </Text>
                      <Text style={styles.weekSummaryLabel}>Volume</Text>
                    </View>
                    <View style={styles.weekSummaryDivider} />
                    <View style={styles.weekSummaryItem}>
                      <Text style={styles.weekSummaryValue}>
                        {weekSummary.reps.toLocaleString()}
                      </Text>
                      <Text style={styles.weekSummaryLabel}>Reps</Text>
                    </View>
                    <View style={styles.weekSummaryDivider} />
                    <View style={styles.weekSummaryItem}>
                      <CheckCircle size={14} color={C.success} />
                      <Text style={styles.weekSummaryLabel}>Complete</Text>
                    </View>
                  </View>
                )}

                {isExpanded && !locked && (
                  <View style={styles.daysList}>
                    {days.map((day) => (
                      <TouchableOpacity
                        key={day.id}
                        style={[
                          styles.dayCard,
                          day.completed && styles.dayCardCompleted,
                        ]}
                        onPress={() => handleStartDay(meso.id, day)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dayLeft}>
                          <View
                            style={[
                              styles.dayIndicator,
                              day.completed && styles.dayIndicatorDone,
                            ]}
                          >
                            {day.completed ? (
                              <CheckCircle size={18} color={C.white} />
                            ) : (
                              <Text style={styles.dayNumber}>{day.dayIndex}</Text>
                            )}
                          </View>
                          <View style={styles.dayInfo}>
                            <Text
                              style={[
                                styles.dayName,
                                day.completed && styles.dayNameDone,
                              ]}
                            >
                              {day.routineName}
                            </Text>
                            <Text style={styles.dayLabel}>Day {day.dayIndex}</Text>
                          </View>
                        </View>
                        {!day.completed ? (
                          <View style={styles.startDayBtn}>
                            <Play size={14} color={C.white} fill={C.white} />
                          </View>
                        ) : (
                          <Text style={styles.completedLabel}>Done</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      );
    },
    [expandedWeeks, handleStartDay, getScheduleByWeek, toggleWeek, workoutHistory]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mesocycles</Text>
        </View>

        {activeMesocycle && (
          <View style={styles.activeCard}>
            <View style={styles.activeHeader}>
              <View style={styles.activeInfo}>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
                <Text style={styles.activeName}>{activeMesocycle.name}</Text>
                <Text style={styles.activeWeek}>
                  Week {activeMesocycle.currentWeek + 1} of{" "}
                  {activeMesocycle.weeks.length}
                </Text>
              </View>
              <View style={styles.rirCircle}>
                <Text style={styles.rirValue}>
                  {activeMesocycle.weeks[activeMesocycle.currentWeek]?.targetRIR ?? 0}
                </Text>
                <Text style={styles.rirLabel}>RIR</Text>
              </View>
            </View>

            <View style={styles.weekGrid}>
              {activeMesocycle.weeks.map((week, idx) => (
                <View
                  key={`wg_${idx}`}
                  style={[
                    styles.weekBlock,
                    idx < activeMesocycle.currentWeek && styles.weekDone,
                    idx === activeMesocycle.currentWeek && styles.weekCurrent,
                    week.isDeload && styles.weekDeload,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekBlockText,
                      (idx <= activeMesocycle.currentWeek || week.isDeload) &&
                        styles.weekBlockTextActive,
                    ]}
                  >
                    {week.isDeload ? "D" : week.weekNumber}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.viewScheduleBtn}
              onPress={() =>
                setExpandedMesoId(
                  expandedMesoId === activeMesocycle.id ? null : activeMesocycle.id
                )
              }
              activeOpacity={0.7}
            >
              <Calendar size={16} color={C.tint} />
              <Text style={styles.viewScheduleText}>
                {expandedMesoId === activeMesocycle.id
                  ? "Hide Schedule"
                  : "View Full Schedule"}
              </Text>
              {expandedMesoId === activeMesocycle.id ? (
                <ChevronUp size={16} color={C.tint} />
              ) : (
                <ChevronDown size={16} color={C.tint} />
              )}
            </TouchableOpacity>

            {expandedMesoId === activeMesocycle.id &&
              renderSchedule(activeMesocycle)}

            <View style={styles.activeActions}>
              {(() => {
                const currentWeekNum = activeMesocycle.currentWeek + 1;
                const currentWeekDays = (activeMesocycle.schedule || []).filter(d => d.weekNumber === currentWeekNum);
                const allCurrentDone = currentWeekDays.length > 0 && currentWeekDays.every(d => d.completed);
                const isLastWeek = activeMesocycle.currentWeek >= activeMesocycle.weeks.length - 1;

                if (isLastWeek && allCurrentDone) {
                  return (
                    <TouchableOpacity
                      style={[styles.advanceBtn, styles.advanceBtnComplete]}
                      onPress={() => Alert.alert("Congratulations!", "You've completed this entire mesocycle! Your gains are locked in.")}
                    >
                      <Trophy size={16} color={C.white} />
                      <Text style={styles.advanceBtnText}>Mesocycle Complete</Text>
                    </TouchableOpacity>
                  );
                }

                if (!allCurrentDone) {
                  const remaining = currentWeekDays.filter(d => !d.completed).length;
                  return (
                    <View style={styles.advanceBtnDisabled}>
                      <Lock size={14} color={C.textMuted} />
                      <Text style={styles.advanceBtnDisabledText}>
                        {remaining} workout{remaining !== 1 ? 's' : ''} left in Week {currentWeekNum}
                      </Text>
                    </View>
                  );
                }

                return (
                  <View style={styles.advanceBtnAutoNote}>
                    <CheckCircle size={14} color={C.success} />
                    <Text style={styles.advanceBtnAutoNoteText}>
                      Week {currentWeekNum} complete — Week {currentWeekNum + 1} is now unlocked
                    </Text>
                  </View>
                );
              })()}
            </View>
          </View>
        )}

        {mesocycles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>My Mesocycles</Text>
            {mesocycles.map((meso) => {
              const schedule = meso.schedule || [];
              const completedDays = schedule.filter((d) => d.completed).length;
              const totalDays = schedule.length;
              const isExpanded = expandedMesoId === meso.id;

              return (
                <View
                  key={meso.id}
                  style={[
                    styles.mesoCard,
                    meso.id === activeMesocycleId && styles.mesoCardActive,
                  ]}
                >
                  <View style={styles.mesoCardTop}>
                    <TouchableOpacity
                      style={styles.mesoCardContent}
                      onPress={() =>
                        setExpandedMesoId(isExpanded ? null : meso.id)
                      }
                    >
                      <View style={styles.mesoCardInfo}>
                        <Text style={styles.mesoName}>{meso.name}</Text>
                        <Text style={styles.mesoDetails}>
                          {meso.weeks.length} weeks · Week{" "}
                          {meso.currentWeek + 1}
                          {totalDays > 0
                            ? ` · ${completedDays}/${totalDays} sessions`
                            : ""}
                        </Text>
                      </View>
                      <View style={styles.mesoCardActions}>
                        {meso.id !== activeMesocycleId && (
                          <TouchableOpacity
                            style={styles.activateBtn}
                            onPress={() => setActiveMesocycle(meso.id)}
                          >
                            <Text style={styles.activateBtnText}>Activate</Text>
                          </TouchableOpacity>
                        )}
                        {isExpanded ? (
                          <ChevronUp size={18} color={C.textMuted} />
                        ) : (
                          <ChevronDown size={18} color={C.textMuted} />
                        )}
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() =>
                        handleDeleteMesocycle(meso.id, meso.name)
                      }
                    >
                      <Trash2 size={14} color={C.error} />
                    </TouchableOpacity>
                  </View>

                  {totalDays > 0 && (
                    <View style={styles.mesoProgressBar}>
                      <View
                        style={[
                          styles.mesoProgressFill,
                          {
                            width:
                              totalDays > 0
                                ? `${(completedDays / totalDays) * 100}%`
                                : "0%",
                          },
                        ]}
                      />
                    </View>
                  )}

                  {isExpanded && meso.id !== activeMesocycleId && renderSchedule(meso)}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Templates</Text>
          <Text style={styles.sectionSub}>
            Pre-built training programs. Pick one to auto-create routines and a
            mesocycle with a full schedule.
          </Text>
          {mesocycleTemplates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleUseTemplate(template.id)}
              activeOpacity={0.7}
            >
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDesc}>
                  {template.description}
                </Text>
                <View style={styles.templateMeta}>
                  <View style={styles.templateChip}>
                    <Text style={styles.templateChipText}>
                      {template.daysPerWeek} days/week
                    </Text>
                  </View>
                  <View style={styles.templateChip}>
                    <Text style={styles.templateChipText}>
                      {template.defaultWeeks} weeks
                    </Text>
                  </View>
                  <View style={styles.templateChip}>
                    <Text style={styles.templateChipText}>
                      {template.routines.length} routines
                    </Text>
                  </View>
                </View>
              </View>
              <Plus size={20} color={C.tint} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: "700" as const, color: C.text },
  activeCard: {
    marginHorizontal: 20,
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.tint,
    padding: 18,
    marginBottom: 24,
  },
  activeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  activeInfo: { flex: 1 },
  activeBadge: {
    backgroundColor: C.tint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: C.white,
    letterSpacing: 0.5,
  },
  activeName: { fontSize: 18, fontWeight: "700" as const, color: C.text },
  activeWeek: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
  rirCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  rirValue: { fontSize: 22, fontWeight: "800" as const, color: C.tint },
  rirLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: C.tint,
    marginTop: -2,
  },
  weekGrid: { flexDirection: "row", gap: 5, marginBottom: 16 },
  weekBlock: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 44,
  },
  weekDone: { backgroundColor: C.tint },
  weekCurrent: { backgroundColor: C.tint, opacity: 0.6 },
  weekDeload: { backgroundColor: C.warning },
  weekBlockText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: C.textSecondary,
  },
  weekBlockTextActive: { color: C.white },
  viewScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: C.tintLight,
    marginBottom: 12,
  },
  viewScheduleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.tint,
  },
  activeActions: { flexDirection: "row", gap: 10 },
  advanceBtn: {
    flex: 1,
    backgroundColor: C.tint,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  advanceBtnText: { fontSize: 15, fontWeight: "700" as const, color: C.white },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 13,
    color: C.textMuted,
    marginBottom: 14,
    lineHeight: 19,
  },
  mesoCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
    overflow: "hidden",
  },
  mesoCardActive: { borderColor: C.tint, borderWidth: 2 },
  mesoCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  mesoCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  mesoCardInfo: { flex: 1 },
  mesoCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activateBtn: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  activateBtnText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.tint,
  },
  mesoName: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  mesoDetails: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
  },
  mesoProgressBar: {
    height: 3,
    backgroundColor: C.surfaceElevated,
    marginHorizontal: 14,
    borderRadius: 2,
    marginBottom: 4,
  },
  mesoProgressFill: {
    height: 3,
    backgroundColor: C.tint,
    borderRadius: 2,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  templateDesc: {
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  templateMeta: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  templateChip: {
    backgroundColor: C.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateChipText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textSecondary,
  },
  scheduleContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  weekSection: {
    marginBottom: 4,
  },
  weekHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.surfaceElevated,
    borderRadius: 8,
    marginBottom: 2,
  },
  weekHeaderCurrent: {
    backgroundColor: C.tintLight,
  },
  weekHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  weekHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.text,
  },
  weekLabelCurrent: {
    color: C.tint,
  },
  rirMiniChip: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rirMiniChipDeload: {
    backgroundColor: "#FFF7ED",
  },
  rirMiniText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: C.tint,
  },
  rirMiniTextDeload: {
    color: C.warning,
  },
  weekProgress: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.textSecondary,
  },
  daysList: {
    paddingLeft: 8,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 4,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  dayCardCompleted: {
    backgroundColor: C.backgroundSecondary,
    borderColor: C.borderLight,
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  dayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  dayIndicatorDone: {
    backgroundColor: C.success,
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.textSecondary,
  },
  dayInfo: { flex: 1 },
  dayName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.text,
  },
  dayNameDone: {
    color: C.textSecondary,
  },
  dayLabel: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 1,
  },
  startDayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  completedLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.success,
  },
  weekSectionLocked: {
    opacity: 0.55,
  },
  weekHeaderLocked: {
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderStyle: "dashed" as const,
  },
  weekHeaderCompleted: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  weekLabelLocked: {
    color: C.textMuted,
  },
  lockedChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: C.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lockedChipText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
  },
  weekSummaryRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FFFBEB",
    borderRadius: 8,
    marginTop: 2,
    marginBottom: 4,
    gap: 4,
  },
  weekSummaryItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 2,
  },
  weekSummaryValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: C.text,
  },
  weekSummaryLabel: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: C.textSecondary,
  },
  weekSummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#FDE68A",
  },
  advanceBtnComplete: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "#F59E0B",
  },
  advanceBtnDisabled: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.border,
  },
  advanceBtnDisabledText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: C.textMuted,
  },
  advanceBtnAutoNote: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  advanceBtnAutoNoteText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#059669",
  },
  emptySchedule: {
    padding: 16,
    alignItems: "center" as const,
  },
  emptyScheduleText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center" as const,
  },
});

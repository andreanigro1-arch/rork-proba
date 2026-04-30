import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Share2, MoreHorizontal, ChevronDown, Crown, Lightbulb } from "lucide-react-native";
import { useState, useMemo, useCallback } from "react";
import { useWorkoutStore } from "@/lib/store";
import { getExerciseById } from "@/lib/exercises";
import { estimate1RM, calculateProgressionSuggestions } from "@/lib/progression";
import Colors from "@/constants/colors";

const C = Colors.light;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = "summary" | "history" | "howto";
type ChartMetric = "heaviestWeight" | "oneRepMax" | "bestSetVolume" | "sessionVolume" | "totalReps";

interface ChartDataPoint {
  date: number;
  label: string;
  value: number;
}

const CHART_METRICS: { key: ChartMetric; label: string }[] = [
  { key: "heaviestWeight", label: "Heaviest Weight" },
  { key: "oneRepMax", label: "One Rep Max" },
  { key: "bestSetVolume", label: "Best Set Volume" },
  { key: "sessionVolume", label: "Session Volume" },
  { key: "totalReps", label: "Total Reps" },
];

type TimeFilter = "year" | "month" | "week";

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { exerciseHistory, weightUnit, startWorkout, addExerciseToWorkout } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("heaviestWeight");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("year");
  const [setRecordsExpanded, setSetRecordsExpanded] = useState(true);

  const exercise = getExerciseById(id);
  const history = exerciseHistory[id];
  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  const handleQuickWorkout = useCallback(() => {
    startWorkout(undefined, "Quick Workout");
    if (exercise) {
      addExerciseToWorkout(exercise.id, exercise.name, 90);
    }
    router.push("/workout/active");
  }, [exercise, startWorkout, addExerciseToWorkout, router]);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Exercise not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const entries = history?.entries || [];

  const filteredEntries = useMemo(() => {
    if (entries.length === 0) return [];
    const now = Date.now();
    let cutoff = 0;
    if (timeFilter === "week") cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeFilter === "month") cutoff = now - 30 * 24 * 60 * 60 * 1000;
    else cutoff = now - 365 * 24 * 60 * 60 * 1000;
    return entries.filter((e) => e.date >= cutoff);
  }, [entries, timeFilter]);

  const stats = useMemo(() => {
    if (entries.length === 0)
      return { bestWeight: 0, best1RM: 0, bestSetVolume: 0, bestSetVolumeLabel: "", bestSessionVolume: 0, totalReps: 0, sessions: 0 };
    let bestWeight = 0;
    let best1RM = 0;
    let bestSetVolume = 0;
    let bestSetVolumeWeight = 0;
    let bestSetVolumeReps = 0;
    let bestSessionVolume = 0;
    let totalReps = 0;
    entries.forEach((entry) => {
      bestSessionVolume = Math.max(bestSessionVolume, entry.volume);
      best1RM = Math.max(best1RM, entry.estimated1RM);
      entry.sets.forEach((s) => {
        bestWeight = Math.max(bestWeight, s.weight);
        totalReps += s.reps;
        const setVol = s.weight * s.reps;
        if (setVol > bestSetVolume) {
          bestSetVolume = setVol;
          bestSetVolumeWeight = s.weight;
          bestSetVolumeReps = s.reps;
        }
      });
    });
    return {
      bestWeight,
      best1RM: Math.round(best1RM * 100) / 100,
      bestSetVolume,
      bestSetVolumeLabel: bestSetVolume > 0 ? `${bestSetVolumeWeight}${unitLabel} x ${bestSetVolumeReps}` : "",
      bestSessionVolume,
      totalReps,
      sessions: entries.length,
    };
  }, [entries, unitLabel]);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (filteredEntries.length === 0) return [];
    return filteredEntries.map((entry) => {
      let value = 0;
      switch (activeMetric) {
        case "heaviestWeight":
          value = Math.max(...entry.sets.map((s) => s.weight), 0);
          break;
        case "oneRepMax":
          value = entry.estimated1RM;
          break;
        case "bestSetVolume":
          value = Math.max(...entry.sets.map((s) => s.weight * s.reps), 0);
          break;
        case "sessionVolume":
          value = entry.volume;
          break;
        case "totalReps":
          value = entry.sets.reduce((sum, s) => sum + s.reps, 0);
          break;
      }
      return {
        date: entry.date,
        label: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value,
      };
    });
  }, [filteredEntries, activeMetric]);

  const latestChartValue = chartData.length > 0 ? chartData[chartData.length - 1] : null;

  const setRecords = useMemo(() => {
    const map: Record<number, number> = {};
    entries.forEach((e) =>
      e.sets.forEach((s) => {
        if (s.weight > 0 && (!map[s.reps] || s.weight > map[s.reps])) map[s.reps] = s.weight;
      })
    );
    return Object.entries(map)
      .map(([reps, weight]) => ({ reps: Number(reps), weight }))
      .sort((a, b) => a.reps - b.reps);
  }, [entries]);

  const primaryMuscle = exercise.muscleGroups[0]
    ? exercise.muscleGroups[0].charAt(0).toUpperCase() + exercise.muscleGroups[0].slice(1)
    : "";
  const secondaryMuscles = exercise.muscleGroups
    .slice(1)
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(", ");

  const renderChart = () => {
    if (chartData.length < 2) {
      return (
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            {chartData.length === 0 ? "No data for this period" : "Need at least 2 sessions to chart"}
          </Text>
        </View>
      );
    }

    const values = chartData.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;
    const chartW = SCREEN_WIDTH - 80;
    const chartH = 120;
    const stepX = chartW / (chartData.length - 1);

    const points = chartData.map((d, i) => ({
      x: i * stepX,
      y: chartH - ((d.value - minVal) / range) * (chartH - 20),
    }));

    return (
      <View style={styles.chartArea}>
        <View style={styles.chartYAxis}>
          <Text style={styles.chartAxisLabel}>{formatChartValue(maxVal)}</Text>
          <Text style={styles.chartAxisLabel}>{formatChartValue(Math.round((maxVal + minVal) / 2))}</Text>
          <Text style={styles.chartAxisLabel}>{formatChartValue(minVal)}</Text>
        </View>
        <View style={{ width: chartW, height: chartH }}>
          <View style={StyleSheet.absoluteFill}>
            {points.map((p, i) => {
              if (i === 0) return null;
              const prev = points[i - 1];
              const dx = p.x - prev.x;
              const dy = p.y - prev.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View
                  key={`line-${i}`}
                  style={{
                    position: "absolute" as const,
                    left: prev.x,
                    top: prev.y,
                    width: len,
                    height: 2,
                    backgroundColor: C.tint,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: "left center",
                  }}
                />
              );
            })}
            {points.map((p, i) => (
              <View
                key={`dot-${i}`}
                style={{
                  position: "absolute" as const,
                  left: p.x - 4,
                  top: p.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.tint,
                }}
              />
            ))}
          </View>
        </View>
        <View style={[styles.chartXAxis, { width: chartW, marginLeft: 40 }]}>
          {chartData.length <= 8
            ? chartData.map((d, i) => (
                <Text key={i} style={[styles.chartXLabel, { width: stepX, textAlign: "center" as const }]}>
                  {d.label.split(" ")[0]}
                </Text>
              ))
            : [0, Math.floor(chartData.length / 2), chartData.length - 1].map((idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.chartXLabel,
                    { position: "absolute" as const, left: idx * stepX - 20, width: 40, textAlign: "center" as const },
                  ]}
                >
                  {chartData[idx].label}
                </Text>
              ))}
        </View>
      </View>
    );
  };

  const formatChartValue = (val: number): string => {
    if (activeMetric === "totalReps") return String(Math.round(val));
    if (val >= 10000) return `${(val / 1000).toFixed(0)}k`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return String(Math.round(val * 100) / 100);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exercise.name}
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleQuickWorkout}>
            <Share2 size={20} color={C.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <MoreHorizontal size={20} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        {(["summary", "history", "howto"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "howto" ? "How to" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "summary" && (
          <>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.musclePrimary}>Primary: {primaryMuscle}</Text>
              {secondaryMuscles.length > 0 && (
                <Text style={styles.muscleSecondary}>Secondary: {secondaryMuscles}</Text>
              )}
              {exercise.isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Custom</Text>
                </View>
              )}
            </View>

            <View style={styles.tipRow}>
              <Lightbulb size={16} color={C.tint} />
              <Text style={styles.tipText}>
                How to log {exercise.equipment.replace("_", " ")} exercises
              </Text>
            </View>

            {entries.length > 0 && (
              <>
                <View style={styles.chartHeader}>
                  <View>
                    <Text style={styles.chartMainValue}>
                      {latestChartValue
                        ? activeMetric === "totalReps"
                          ? `${latestChartValue.value}`
                          : `${latestChartValue.value} ${unitLabel}`
                        : "—"}
                    </Text>
                    {latestChartValue && (
                      <Text style={styles.chartDateLabel}>
                        {new Date(latestChartValue.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.timeFilterBtn}
                    onPress={() => {
                      const filters: TimeFilter[] = ["year", "month", "week"];
                      const idx = filters.indexOf(timeFilter);
                      setTimeFilter(filters[(idx + 1) % filters.length]);
                    }}
                  >
                    <Text style={styles.timeFilterText}>
                      {timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                    </Text>
                    <ChevronDown size={14} color={C.tint} />
                  </TouchableOpacity>
                </View>

                {renderChart()}

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.metricBtns}
                  style={styles.metricBtnsScroll}
                >
                  {CHART_METRICS.map((metric) => (
                    <TouchableOpacity
                      key={metric.key}
                      style={[styles.metricBtn, activeMetric === metric.key && styles.metricBtnActive]}
                      onPress={() => setActiveMetric(metric.key)}
                    >
                      <Text
                        style={[
                          styles.metricBtnText,
                          activeMetric === metric.key && styles.metricBtnTextActive,
                        ]}
                      >
                        {metric.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.prSection}>
              <View style={styles.prHeader}>
                <Crown size={18} color="#EAB308" />
                <Text style={styles.prTitle}>Personal Records</Text>
              </View>

              <View style={styles.prRow}>
                <Text style={styles.prLabel}>Heaviest Weight</Text>
                <Text style={styles.prValue}>
                  {stats.bestWeight > 0 ? `${stats.bestWeight}${unitLabel}` : "—"}
                </Text>
              </View>
              <View style={styles.prDivider} />

              <View style={styles.prRow}>
                <Text style={styles.prLabel}>Best 1RM</Text>
                <Text style={styles.prValue}>
                  {stats.best1RM > 0 ? `${stats.best1RM}${unitLabel}` : "—"}
                </Text>
              </View>
              <View style={styles.prDivider} />

              <View style={styles.prRow}>
                <Text style={styles.prLabel}>Best Set Volume</Text>
                <Text style={styles.prValue}>
                  {stats.bestSetVolumeLabel || "—"}
                </Text>
              </View>
              <View style={styles.prDivider} />

              <View style={styles.prRow}>
                <Text style={styles.prLabel}>Best Session Volume</Text>
                <Text style={styles.prValue}>
                  {stats.bestSessionVolume > 0 ? `${stats.bestSessionVolume}${unitLabel}` : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.setRecordsSection}>
              <TouchableOpacity
                style={styles.setRecordsHeader}
                onPress={() => setSetRecordsExpanded(!setRecordsExpanded)}
                activeOpacity={0.7}
              >
                <Text style={styles.setRecordsTitle}>Set Records</Text>
                <ChevronDown
                  size={18}
                  color={C.textSecondary}
                  style={setRecordsExpanded ? styles.chevronUp : undefined}
                />
              </TouchableOpacity>

              {setRecordsExpanded && (
                <>
                  {setRecords.length > 0 ? (
                    <>
                      <View style={styles.setRecordsTableHeader}>
                        <Text style={styles.setRecordsColLabel}>Reps</Text>
                        <Text style={styles.setRecordsColLabel}>Personal Best</Text>
                      </View>
                      {setRecords.map((rec) => (
                        <View key={`rep-${rec.reps}`} style={styles.setRecordRow}>
                          <Text style={styles.setRecordReps}>{rec.reps}</Text>
                          <Text style={styles.setRecordWeight}>
                            {rec.weight}
                            {unitLabel}
                          </Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.noDataText}>No records yet</Text>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {activeTab === "history" && (
          <>
            {entries.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>
                  No history yet. Complete a workout with this exercise.
                </Text>
              </View>
            ) : (
              entries
                .slice()
                .reverse()
                .map((entry, idx) => (
                  <View key={`hist-${idx}-${entry.date}`} style={styles.historyCard}>
                    <Text style={styles.historyDate}>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                    <View style={styles.historyMeta}>
                      <Text style={styles.historyMetaText}>
                        Volume: {entry.volume.toLocaleString()} {unitLabel}
                      </Text>
                      <Text style={styles.historyMetaText}>
                        Est 1RM: {Math.round(entry.estimated1RM * 100) / 100} {unitLabel}
                      </Text>
                    </View>
                    {entry.sets.map((s, sIdx) => (
                      <View key={`set-${sIdx}`} style={styles.historySetRow}>
                        <Text style={styles.historySetNum}>{sIdx + 1}</Text>
                        <Text style={styles.historySetData}>
                          {s.weight} {unitLabel} × {s.reps}
                        </Text>
                        <Text style={styles.historySetRir}>RIR {s.rir}</Text>
                      </View>
                    ))}
                  </View>
                ))
            )}
          </>
        )}

        {activeTab === "howto" && (
          <View style={styles.howtoCard}>
            <Text style={styles.howtoTitle}>{exercise.name}</Text>
            <Text style={styles.howtoMuscles}>
              Targets: {exercise.muscleGroups.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
            </Text>
            <Text style={styles.howtoEquipment}>
              Equipment: {exercise.equipment.charAt(0).toUpperCase() + exercise.equipment.slice(1).replace("_", " ")}
            </Text>
            {exercise.instructions && exercise.instructions.length > 0 ? (
              exercise.instructions.map((step, idx) => (
                <View key={`step-${idx}`} style={styles.howtoStep}>
                  <View style={styles.howtoStepNum}>
                    <Text style={styles.howtoStepNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.howtoStepText}>{step}</Text>
                </View>
              ))
            ) : (
              <View style={styles.howtoGeneric}>
                <Text style={styles.howtoGenericTitle}>General Guidelines</Text>
                {getGenericInstructions(exercise.equipment).map((step, idx) => (
                  <View key={`generic-${idx}`} style={styles.howtoStep}>
                    <View style={styles.howtoStepNum}>
                      <Text style={styles.howtoStepNumText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.howtoStepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
            {exercise.tips && exercise.tips.length > 0 && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsTitle}>Tips</Text>
                {exercise.tips.map((tip, idx) => (
                  <Text key={`tip-${idx}`} style={styles.tipItem}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getGenericInstructions(equipment: string): string[] {
  switch (equipment) {
    case "barbell":
      return [
        "Set up the barbell at the appropriate height and load the desired weight.",
        "Grip the bar with proper hand placement for the exercise.",
        "Brace your core, maintain a neutral spine, and perform the movement through the full range of motion.",
        "Control the eccentric (lowering) phase for 2-3 seconds.",
        "Drive through the concentric (lifting) phase with controlled power.",
        "Re-rack the bar safely after completing your set.",
      ];
    case "dumbbell":
      return [
        "Select the appropriate dumbbell weight.",
        "Position yourself with stable footing and proper posture.",
        "Perform the movement through the full range of motion with controlled tempo.",
        "Focus on muscle contraction at the peak of the movement.",
        "Lower the weight slowly on the eccentric phase.",
      ];
    case "machine":
      return [
        "Adjust the seat height and pad positions for your body.",
        "Select the appropriate weight on the stack.",
        "Perform the movement through the machine's guided range of motion.",
        "Focus on squeezing the target muscle at peak contraction.",
        "Control the weight on both the lifting and lowering phases.",
      ];
    case "cable":
      return [
        "Set the cable pulley to the appropriate height.",
        "Select the weight and attach the correct handle.",
        "Maintain stable posture and brace your core.",
        "Pull through the full range of motion with controlled speed.",
        "Slowly return to the starting position.",
      ];
    default:
      return [
        "Position yourself with proper form and stable base.",
        "Perform the movement through the full range of motion.",
        "Focus on the mind-muscle connection with the target muscles.",
        "Control the tempo throughout each rep.",
        "Maintain proper breathing — exhale on exertion, inhale on the eccentric.",
      ];
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontSize: 16, color: C.textSecondary },
  backLink: { fontSize: 15, fontWeight: "600" as const, color: C.tint, marginTop: 10 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: C.text,
    flex: 1,
    textAlign: "center" as const,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: C.tint },
  tabText: { fontSize: 14, fontWeight: "500" as const, color: C.textSecondary },
  tabTextActive: { color: C.tint, fontWeight: "600" as const },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  exerciseInfo: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: C.text,
    marginBottom: 4,
  },
  musclePrimary: {
    fontSize: 14,
    color: C.textSecondary,
  },
  muscleSecondary: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  customBadge: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  customBadgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.tint,
  },

  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tipText: {
    fontSize: 13,
    color: C.textSecondary,
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  chartMainValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: C.text,
  },
  chartDateLabel: {
    fontSize: 13,
    color: C.tint,
    marginTop: 2,
  },
  timeFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: C.tint,
  },

  chartArea: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 4,
    marginLeft: 0,
  },
  chartYAxis: {
    position: "absolute" as const,
    left: 8,
    top: 12,
    bottom: 24,
    justifyContent: "space-between",
    width: 36,
  },
  chartAxisLabel: {
    fontSize: 10,
    color: C.textMuted,
    textAlign: "right" as const,
  },
  chartXAxis: {
    flexDirection: "row",
    marginTop: 8,
    height: 16,
  },
  chartXLabel: {
    fontSize: 10,
    color: C.textMuted,
  },
  chartPlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },
  chartPlaceholderText: {
    fontSize: 13,
    color: C.textMuted,
  },

  metricBtnsScroll: {
    marginTop: 12,
  },
  metricBtns: {
    paddingHorizontal: 16,
    gap: 8,
  },
  metricBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  metricBtnActive: {
    backgroundColor: C.tint,
    borderColor: C.tint,
  },
  metricBtnText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: C.textSecondary,
  },
  metricBtnTextActive: {
    color: C.white,
    fontWeight: "600" as const,
  },

  prSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  prHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  prTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: C.textSecondary,
  },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  prLabel: {
    fontSize: 15,
    color: C.text,
  },
  prValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: C.tint,
  },
  prDivider: {
    height: 1,
    backgroundColor: C.borderLight,
  },

  setRecordsSection: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  setRecordsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  setRecordsTitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: C.textSecondary,
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
  setRecordsTableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
  },
  setRecordsColLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700" as const,
    color: C.text,
  },
  setRecordRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  setRecordReps: {
    flex: 1,
    fontSize: 15,
    color: C.text,
  },
  setRecordWeight: {
    flex: 1,
    fontSize: 15,
    color: C.text,
  },
  noDataText: {
    fontSize: 13,
    color: C.textMuted,
    paddingVertical: 16,
  },

  emptyTab: { paddingVertical: 40, alignItems: "center" },
  emptyTabText: { fontSize: 14, color: C.textSecondary, textAlign: "center" as const, paddingHorizontal: 40 },

  historyCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
  },
  historyDate: { fontSize: 14, fontWeight: "700" as const, color: C.text, marginBottom: 6 },
  historyMeta: { flexDirection: "row", gap: 16, marginBottom: 10 },
  historyMetaText: { fontSize: 12, color: C.textSecondary },
  historySetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  historySetNum: {
    width: 28,
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textMuted,
  },
  historySetData: { flex: 1, fontSize: 14, fontWeight: "600" as const, color: C.text },
  historySetRir: { fontSize: 13, color: C.textSecondary },

  howtoCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
  },
  howtoTitle: { fontSize: 20, fontWeight: "700" as const, color: C.text, marginBottom: 4 },
  howtoMuscles: { fontSize: 14, color: C.textSecondary, marginBottom: 2 },
  howtoEquipment: { fontSize: 14, color: C.textMuted, marginBottom: 16 },
  howtoGeneric: { marginTop: 4 },
  howtoGenericTitle: { fontSize: 15, fontWeight: "600" as const, color: C.text, marginBottom: 12 },
  howtoStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  howtoStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  howtoStepNumText: { fontSize: 12, fontWeight: "700" as const, color: C.tint },
  howtoStepText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 21 },
  tipsSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.border },
  tipsTitle: { fontSize: 15, fontWeight: "600" as const, color: C.text, marginBottom: 8 },
  tipItem: { fontSize: 14, color: C.textSecondary, marginBottom: 6, lineHeight: 20 },
});

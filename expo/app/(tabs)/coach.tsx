import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, Zap, Target, AlertTriangle } from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import { estimate1RM, calculateProgressionSuggestions } from "@/lib/progression";
import { getExerciseById } from "@/lib/exercises";
import Colors from "@/constants/colors";
import { useMemo } from "react";

const C = Colors.light;

interface CoachInsight {
  type: "progress" | "suggestion" | "warning";
  title: string;
  body: string;
  exerciseId?: string;
}

export default function CoachTab() {
  const router = useRouter();
  const { exerciseHistory, workoutHistory, activeMesocycleId, mesocycles, routines, weightUnit } =
    useWorkoutStore();

  const activeMesocycle = mesocycles.find((m) => m.id === activeMesocycleId);
  const currentWeek = activeMesocycle?.weeks[activeMesocycle.currentWeek];
  const unitLabel = weightUnit === "kg" ? "kg" : "lbs";

  const insights = useMemo<CoachInsight[]>(() => {
    const result: CoachInsight[] = [];

    const exerciseIds = Object.keys(exerciseHistory);
    for (const eid of exerciseIds) {
      const hist = exerciseHistory[eid];
      if (!hist || hist.entries.length < 2) continue;
      const exercise = getExerciseById(eid);
      if (!exercise) continue;

      const recent = hist.entries.slice(-2);
      const prev1RM = recent[0].estimated1RM;
      const curr1RM = recent[1].estimated1RM;
      const diff = curr1RM - prev1RM;
      const pct = prev1RM > 0 ? Math.round((diff / prev1RM) * 100) : 0;

      if (diff > 0) {
        result.push({
          type: "progress",
          title: `${exercise.name} — Up ${pct}%`,
          body: `Estimated 1RM increased from ${prev1RM} to ${curr1RM} ${unitLabel}`,
          exerciseId: eid,
        });
      } else if (diff < -5) {
        result.push({
          type: "warning",
          title: `${exercise.name} — Performance Drop`,
          body: `1RM dropped from ${prev1RM} to ${curr1RM} ${unitLabel}. Consider a deload or reducing volume.`,
          exerciseId: eid,
        });
      }

      if (hist.entries.length >= 2) {
        const lastEntry = hist.entries[hist.entries.length - 1];
        const lastSet = lastEntry.sets[lastEntry.sets.length - 1];
        if (lastSet && lastSet.weight > 0) {
          const suggestions = calculateProgressionSuggestions(lastSet.weight, lastSet.reps);
          result.push({
            type: "suggestion",
            title: `Next ${exercise.name}`,
            body: `Try ${suggestions.sameWeight.weight}${unitLabel} × ${suggestions.sameWeight.reps} or ${suggestions.heavier.weight}${unitLabel} × ${suggestions.heavier.reps}`,
            exerciseId: eid,
          });
        }
      }
    }

    if (currentWeek?.isDeload) {
      result.unshift({
        type: "warning",
        title: "Deload Week",
        body: "Reduce weight to ~85% and volume to ~60%. Focus on form and recovery.",
      });
    }

    if (currentWeek && !currentWeek.isDeload) {
      result.unshift({
        type: "suggestion",
        title: `Target RIR: ${currentWeek.targetRIR}`,
        body: `This week, aim to finish each set with ${currentWeek.targetRIR} reps in reserve.`,
      });
    }

    if (result.length === 0) {
      result.push({
        type: "suggestion",
        title: "Get Started",
        body: "Complete at least 2 workouts to unlock personalized coaching insights.",
      });
    }

    return result;
  }, [exerciseHistory, currentWeek, unitLabel]);

  const progressInsights = insights.filter((i) => i.type === "progress");
  const suggestions = insights.filter((i) => i.type === "suggestion");
  const warnings = insights.filter((i) => i.type === "warning");

  const getIcon = (type: string) => {
    switch (type) {
      case "progress":
        return <TrendingUp size={18} color="#22c55e" />;
      case "warning":
        return <AlertTriangle size={18} color="#f97316" />;
      default:
        return <Zap size={18} color={C.tint} />;
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case "progress":
        return "#ECFDF5";
      case "warning":
        return "#FFF7ED";
      default:
        return C.tintLight;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Coach</Text>
        </View>

        {activeMesocycle && (
          <View style={styles.mesoSummary}>
            <Target size={16} color={C.tint} />
            <Text style={styles.mesoSummaryText}>
              {activeMesocycle.name} — Week {activeMesocycle.currentWeek + 1}
              {currentWeek?.isDeload ? " (Deload)" : ""}
            </Text>
          </View>
        )}

        {warnings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Attention</Text>
            {warnings.map((insight, idx) => (
              <TouchableOpacity
                key={`w-${idx}`}
                style={[styles.insightCard, { backgroundColor: getAccentColor(insight.type) }]}
                onPress={
                  insight.exerciseId
                    ? () =>
                        router.push({
                          pathname: "/exercise/[id]",
                          params: { id: insight.exerciseId! },
                        })
                    : undefined
                }
                activeOpacity={0.7}
              >
                <View style={styles.insightIcon}>{getIcon(insight.type)}</View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightBody}>{insight.body}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Suggestions</Text>
            {suggestions.map((insight, idx) => (
              <TouchableOpacity
                key={`s-${idx}`}
                style={[styles.insightCard, { backgroundColor: getAccentColor(insight.type) }]}
                onPress={
                  insight.exerciseId
                    ? () =>
                        router.push({
                          pathname: "/exercise/[id]",
                          params: { id: insight.exerciseId! },
                        })
                    : undefined
                }
                activeOpacity={0.7}
              >
                <View style={styles.insightIcon}>{getIcon(insight.type)}</View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightBody}>{insight.body}</Text>
                </View>
                {insight.exerciseId && (
                  <ArrowUpRight size={16} color={C.textMuted} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {progressInsights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Progress</Text>
            {progressInsights.map((insight, idx) => (
              <TouchableOpacity
                key={`p-${idx}`}
                style={[styles.insightCard, { backgroundColor: getAccentColor(insight.type) }]}
                onPress={
                  insight.exerciseId
                    ? () =>
                        router.push({
                          pathname: "/exercise/[id]",
                          params: { id: insight.exerciseId! },
                        })
                    : undefined
                }
                activeOpacity={0.7}
              >
                <View style={styles.insightIcon}>{getIcon(insight.type)}</View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightBody}>{insight.body}</Text>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "700" as const, color: C.text },
  mesoSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    backgroundColor: C.tintLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  mesoSummaryText: { fontSize: 14, fontWeight: "600" as const, color: C.tint },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  insightIcon: { marginTop: 2 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: "700" as const, color: C.text },
  insightBody: { fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 19 },
});

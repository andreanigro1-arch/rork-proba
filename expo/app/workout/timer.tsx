import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Minus, Play, Pause, SkipForward } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

const C = Colors.light;

export default function RestTimerScreen() {
  const router = useRouter();
  const {
    restTimerEnd,
    restTimerDuration,
    stopRestTimer,
    clearRestTimer,
    startRestTimer,
  } = useWorkoutStore();

  const [remaining, setRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!restTimerEnd) {
      router.back();
      return;
    }
    const interval = setInterval(() => {
      if (isPaused) return;
      const left = Math.max(0, Math.ceil((restTimerEnd - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearInterval(interval);
      } else if (left <= 5) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [restTimerEnd, isPaused]);

  useEffect(() => {
    if (remaining <= 5 && remaining > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [remaining]);

  const handleAddTime = (seconds: number) => {
    const currentEnd = restTimerEnd || Date.now();
    startRestTimer(Math.ceil((currentEnd - Date.now()) / 1000) + seconds);
  };

  const handleSkip = () => {
    clearRestTimer();
    router.back();
  };

  const handleDismiss = () => {
    stopRestTimer();
    router.back();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = restTimerDuration > 0 ? (restTimerDuration - remaining) / restTimerDuration : 0;
  const isComplete = remaining === 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleDismiss}>
          <X size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rest Timer</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.timerSection}>
          <Animated.View
            style={[
              styles.timerCircle,
              isComplete && styles.timerCircleComplete,
              remaining <= 5 && remaining > 0 && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Text style={[styles.timerText, isComplete && styles.timerTextComplete]}>
              {formatTime(remaining)}
            </Text>
            <Text style={styles.timerLabel}>
              {isComplete ? "Time's up!" : "remaining"}
            </Text>
          </Animated.View>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.controls}>
          {!isComplete && (
            <>
              <View style={styles.timeAdjust}>
                <TouchableOpacity style={styles.timeBtn} onPress={() => handleAddTime(-30)}>
                  <Minus size={18} color={C.text} />
                  <Text style={styles.timeBtnText}>-30s</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timeBtn} onPress={() => handleAddTime(30)}>
                  <Plus size={18} color={C.text} />
                  <Text style={styles.timeBtnText}>+30s</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.mainControls}>
                <TouchableOpacity
                  style={styles.pauseBtn}
                  onPress={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? (
                    <Play size={28} color={C.tint} fill={C.tint} />
                  ) : (
                    <Pause size={28} color={C.tint} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                  <SkipForward size={22} color={C.textSecondary} />
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {isComplete && (
            <TouchableOpacity style={styles.doneBtn} onPress={handleSkip}>
              <Text style={styles.doneBtnText}>Resume Workout</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.presets}>
          <Text style={styles.presetsLabel}>Quick Set</Text>
          <View style={styles.presetRow}>
            {[30, 60, 90, 120, 180, 300].map((s) => (
              <TouchableOpacity key={s} style={styles.presetBtn} onPress={() => startRestTimer(s)}>
                <Text style={styles.presetBtnText}>
                  {s < 60 ? `${s}s` : `${s / 60}m`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "600" as const, color: C.text },
  content: { flex: 1, padding: 24 },
  timerSection: { alignItems: "center", marginTop: 32 },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: C.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: C.tint,
  },
  timerCircleComplete: { borderColor: C.success, backgroundColor: "#E8F8EE" },
  timerText: {
    fontSize: 64,
    fontWeight: "800" as const,
    color: C.text,
    fontVariant: ["tabular-nums"],
  },
  timerTextComplete: { color: C.success },
  timerLabel: { fontSize: 14, color: C.textSecondary, marginTop: 4 },
  progressBarBg: {
    width: 180,
    height: 5,
    backgroundColor: C.border,
    borderRadius: 3,
    marginTop: 20,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: C.tint, borderRadius: 3 },
  controls: { marginTop: 40 },
  timeAdjust: { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 28 },
  timeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.surfaceElevated,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  timeBtnText: { fontSize: 14, fontWeight: "600" as const, color: C.text },
  mainControls: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 28 },
  pauseBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.tintLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: C.tint,
  },
  skipBtn: { alignItems: "center", gap: 4 },
  skipText: { fontSize: 13, fontWeight: "500" as const, color: C.textSecondary },
  doneBtn: {
    backgroundColor: C.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: { fontSize: 17, fontWeight: "700" as const, color: C.white },
  presets: { marginTop: "auto", paddingTop: 24 },
  presetsLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: C.textMuted,
    textAlign: "center" as const,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  presetRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 8 },
  presetBtn: {
    backgroundColor: C.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 52,
    alignItems: "center",
  },
  presetBtnText: { fontSize: 14, fontWeight: "600" as const, color: C.tint },
});

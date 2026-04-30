import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check } from "lucide-react-native";
import { useWorkoutStore } from "@/lib/store";
import Colors from "@/constants/colors";
import type { WeightUnit } from "@/types/fitness";

const C = Colors.light;

export default function SettingsScreen() {
  const router = useRouter();
  const { weightUnit, setWeightUnit } = useWorkoutStore();

  const units: { value: WeightUnit; label: string }[] = [
    { value: "lbs", label: "Pounds (lbs)" },
    { value: "kg", label: "Kilograms (kg)" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Weight Unit</Text>
        {units.map((unit) => (
          <TouchableOpacity
            key={unit.value}
            style={styles.optionRow}
            onPress={() => setWeightUnit(unit.value)}
          >
            <Text style={styles.optionText}>{unit.label}</Text>
            {weightUnit === unit.value && <Check size={20} color={C.tint} />}
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About LiftOS</Text>
          <Text style={styles.infoText}>
            LiftOS combines the clean UI of Hevy with the advanced auto-progression logic of RP Hypertrophy. 
            Track your workouts, follow mesocycle programs, and let the app suggest your next weights and reps using the Epley formula.
          </Text>
        </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 8,
  },
  optionText: { fontSize: 16, fontWeight: "500" as const, color: C.text },
  infoCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
  },
  infoTitle: { fontSize: 15, fontWeight: "700" as const, color: C.text, marginBottom: 8 },
  infoText: { fontSize: 14, color: C.textSecondary, lineHeight: 21 },
});

import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Calculator } from "lucide-react-native";
import { useState, useMemo } from "react";
import { calculatePlateLoading } from "@/lib/progression";
import Colors from "@/constants/colors";

const C = Colors.light;
const BAR_WEIGHTS = [45, 35, 20, 15];
const PLATE_COLORS: Record<number, string> = {
  45: "#ef4444",
  35: "#f97316",
  25: "#22c55e",
  10: "#3b82f6",
  5: "#eab308",
  2.5: "#a855f7",
};

export default function PlateCalculatorScreen() {
  const router = useRouter();
  const { weight: initialWeight } = useLocalSearchParams<{ weight?: string }>();
  const [totalWeight, setTotalWeight] = useState(initialWeight || "");
  const [barWeight, setBarWeight] = useState(45);

  const plates = useMemo(() => {
    const w = parseFloat(totalWeight);
    if (isNaN(w) || w <= barWeight) return [];
    return calculatePlateLoading(w, barWeight);
  }, [totalWeight, barWeight]);

  const plateWeight = useMemo(() => {
    return plates.reduce((sum, p) => sum + p.plate * p.count * 2, 0);
  }, [plates]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plate Calculator</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Target Weight</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              value={totalWeight}
              onChangeText={setTotalWeight}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={C.textMuted}
              maxLength={6}
            />
            <Text style={styles.weightUnit}>lbs</Text>
          </View>
          <Text style={styles.barLabel}>Bar Weight</Text>
          <View style={styles.barRow}>
            {BAR_WEIGHTS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[styles.barOption, barWeight === w && styles.barOptionActive]}
                onPress={() => setBarWeight(w)}
              >
                <Text style={[styles.barOptionText, barWeight === w && styles.barOptionTextActive]}>
                  {w} lb
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {plates.length > 0 && (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Bar</Text>
                <Text style={styles.summaryValue}>{barWeight} lbs</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Plates (both sides)</Text>
                <Text style={styles.summaryValue}>{plateWeight} lbs</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{barWeight + plateWeight} lbs</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Per Side</Text>
            {plates.map((plate, idx) => (
              <View key={idx} style={styles.plateRow}>
                <View style={styles.plateLeft}>
                  <View
                    style={[
                      styles.plateColor,
                      { backgroundColor: PLATE_COLORS[plate.plate] || C.textSecondary },
                    ]}
                  />
                  <Text style={styles.plateText}>{plate.plate} lb plate</Text>
                </View>
                <View style={styles.plateCountBadge}>
                  <Text style={styles.plateCountText}>{plate.count}×</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {plates.length === 0 && totalWeight !== "" && (
          <View style={styles.emptyState}>
            <Calculator size={40} color={C.textMuted} />
            <Text style={styles.emptyText}>
              {parseFloat(totalWeight) <= barWeight
                ? "Weight must be greater than bar weight"
                : "Enter a weight to calculate plates"}
            </Text>
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
  inputSection: { alignItems: "center", marginBottom: 28 },
  inputLabel: { fontSize: 13, fontWeight: "600" as const, color: C.textSecondary, marginBottom: 8 },
  weightRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  weightInput: {
    fontSize: 56,
    fontWeight: "800" as const,
    color: C.text,
    textAlign: "center",
    minWidth: 160,
  },
  weightUnit: { fontSize: 22, fontWeight: "600" as const, color: C.textSecondary, marginBottom: 10 },
  barLabel: { fontSize: 13, fontWeight: "600" as const, color: C.textSecondary, marginTop: 20, marginBottom: 10 },
  barRow: { flexDirection: "row", gap: 8 },
  barOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
  },
  barOptionActive: { backgroundColor: C.tint },
  barOptionText: { fontSize: 14, fontWeight: "600" as const, color: C.text },
  barOptionTextActive: { color: C.white },
  summaryCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 15, color: C.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700" as const, color: C.text },
  totalValue: { fontSize: 18, fontWeight: "800" as const, color: C.tint },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 8,
  },
  plateLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  plateColor: { width: 14, height: 14, borderRadius: 7 },
  plateText: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  plateCountBadge: {
    backgroundColor: C.tintLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plateCountText: { fontSize: 14, fontWeight: "700" as const, color: C.tint },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyText: { fontSize: 14, color: C.textSecondary, textAlign: "center", marginTop: 12 },
});

import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react-native";
import { useState } from "react";
import { useWorkoutStore } from "@/lib/store";
import { defaultExercises } from "@/lib/exercises";
import Colors from "@/constants/colors";
import type { RoutineExercise } from "@/types/fitness";

const C = Colors.light;

export default function RoutineBuilderScreen() {
  const router = useRouter();
  const { createRoutine } = useWorkoutStore();
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<RoutineExercise>) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, ...updates } : ex))
    );
  };

  const handleAddFromPicker = (exerciseId: string, exerciseName: string) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId,
        exerciseName,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        restSeconds: 120,
        order: prev.length,
      },
    ]);
    setShowPicker(false);
    setSearchQuery("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a routine name");
      return;
    }
    if (exercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return;
    }
    createRoutine({
      name: name.trim(),
      exercises: exercises.map((ex, idx) => ({ ...ex, order: idx })),
      isActive: false,
    });
    router.back();
  };

  const filtered = defaultExercises.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showPicker) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowPicker(false)}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Exercise</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.searchBar}>
          <Search size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises..."
            placeholderTextColor={C.textMuted}
            autoFocus
          />
        </View>
        <ScrollView contentContainerStyle={styles.pickerList}>
          {filtered.map((ex) => (
            <TouchableOpacity
              key={ex.id}
              style={styles.pickerItem}
              onPress={() => handleAddFromPicker(ex.id, ex.name)}
            >
              <View style={styles.pickerInfo}>
                <Text style={styles.pickerName}>{ex.name}</Text>
                <Text style={styles.pickerMeta}>
                  {ex.muscleGroups
                    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                    .join(", ")}
                </Text>
              </View>
              <View style={styles.pickerAddBtn}>
                <Plus size={16} color={C.white} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Routine</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim()}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Routine Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Push Day A"
          placeholderTextColor={C.textMuted}
          maxLength={50}
        />

        <Text style={styles.label}>Exercises ({exercises.length})</Text>

        {exercises.map((exercise, index) => (
          <View key={index} style={styles.exerciseCard}>
            <View style={styles.exerciseCardHeader}>
              <Text style={styles.exerciseCardName}>{exercise.exerciseName}</Text>
              <TouchableOpacity onPress={() => handleRemoveExercise(index)}>
                <Trash2 size={16} color={C.error} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sets</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.targetSets.toString()}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    handleUpdateExercise(index, {
                      targetSets: Math.min(10, Math.max(1, val)),
                    });
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Min</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.targetRepsMin.toString()}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    handleUpdateExercise(index, {
                      targetRepsMin: Math.min(30, Math.max(1, val)),
                    });
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Max</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.targetRepsMax.toString()}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    handleUpdateExercise(index, {
                      targetRepsMax: Math.min(30, Math.max(1, val)),
                    });
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rest (s)</Text>
                <TextInput
                  style={styles.smallInput}
                  value={exercise.restSeconds.toString()}
                  onChangeText={(text) => {
                    const val = parseInt(text) || 0;
                    handleUpdateExercise(index, {
                      restSeconds: Math.min(600, Math.max(0, val)),
                    });
                  }}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowPicker(true)}>
          <Plus size={18} color={C.tint} />
          <Text style={styles.addBtnText}>Add Exercise</Text>
        </TouchableOpacity>
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
  saveBtn: {
    backgroundColor: C.tint,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 14, fontWeight: "700" as const, color: C.white },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  label: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: C.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  nameInput: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    fontSize: 16,
    fontWeight: "600" as const,
    color: C.text,
  },
  exerciseCard: {
    backgroundColor: C.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 10,
  },
  exerciseCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  exerciseCardName: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  inputRow: { flexDirection: "row", gap: 10 },
  inputGroup: { flex: 1 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: C.textMuted,
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    fontWeight: "700" as const,
    color: C.text,
    textAlign: "center" as const,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.tintLight,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  addBtnText: { fontSize: 15, fontWeight: "700" as const, color: C.tint },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.surfaceElevated,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  pickerList: { paddingHorizontal: 16, paddingBottom: 100 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pickerInfo: { flex: 1 },
  pickerName: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  pickerMeta: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  pickerAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
});

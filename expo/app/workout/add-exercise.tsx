import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Search, Plus } from "lucide-react-native";
import { useState, useMemo } from "react";
import { useWorkoutStore } from "@/lib/store";
import { defaultExercises, muscleGroups } from "@/lib/exercises";
import Colors from "@/constants/colors";
import type { Exercise, MuscleGroup } from "@/types/fitness";

const C = Colors.light;

export default function AddExerciseScreen() {
  const router = useRouter();
  const { addExerciseToWorkout } = useWorkoutStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const filteredExercises = useMemo(() => {
    let exercises = defaultExercises;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      exercises = exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscleGroups.some((m) => m.toLowerCase().includes(q))
      );
    }
    if (selectedMuscle) {
      exercises = exercises.filter((e) => e.muscleGroups.includes(selectedMuscle));
    }
    return exercises;
  }, [searchQuery, selectedMuscle]);

  const handleAddExercise = (exercise: Exercise) => {
    addExerciseToWorkout(exercise.id, exercise.name, 120);
    router.back();
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.exerciseRow} onPress={() => handleAddExercise(item)}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {item.muscleGroups.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")}
        </Text>
      </View>
      <View style={styles.addBtn}>
        <Plus size={18} color={C.white} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Exercise</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={C.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search exercises..."
          placeholderTextColor={C.textMuted}
          autoFocus
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipScroll}
      >
        <TouchableOpacity
          style={[styles.chip, selectedMuscle === null && styles.chipActive]}
          onPress={() => setSelectedMuscle(null)}
        >
          <Text style={[styles.chipText, selectedMuscle === null && styles.chipTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        {muscleGroups.map((mg) => (
          <TouchableOpacity
            key={mg.id}
            style={[styles.chip, selectedMuscle === mg.id && styles.chipActive]}
            onPress={() => setSelectedMuscle(mg.id === selectedMuscle ? null : mg.id)}
          >
            <Text style={[styles.chipText, selectedMuscle === mg.id && styles.chipTextActive]}>
              {mg.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExercise}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exercises found</Text>
          </View>
        }
      />
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surfaceElevated,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  chipScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: C.surfaceElevated,
  },
  chipActive: { backgroundColor: C.tint },
  chipText: { fontSize: 13, fontWeight: "500" as const, color: C.text },
  chipTextActive: { color: C.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: "600" as const, color: C.text },
  exerciseMeta: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 1, backgroundColor: C.border },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 15, color: C.textSecondary },
});

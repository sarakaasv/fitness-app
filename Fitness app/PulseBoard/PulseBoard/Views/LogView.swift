import SwiftUI

struct LogView: View {
    @EnvironmentObject private var store: TrainingStore

    @State private var mode: LogMode = .routine

    @State private var quickDate = Date()
    @State private var quickKind: SessionKind = .strength
    @State private var quickTitle = ""
    @State private var quickDuration = 60
    @State private var quickIntensity = 3
    @State private var quickNotes = ""
    @State private var quickAreas: Set<BodyArea> = []

    @State private var selectedRoutineID: UUID?
    @State private var routineDate = Date()
    @State private var routineDuration = 60
    @State private var routineIntensity = 3
    @State private var routineNotes = ""
    @State private var routineAreas: Set<BodyArea> = []
    @State private var exerciseDrafts: [ExerciseEntryDraft] = []

    @State private var showingConfirmation = false
    @State private var confirmationMessage = "Saved"

    var body: some View {
        Form {
            Section {
                Picker("Log mode", selection: $mode) {
                    ForEach(LogMode.allCases) { item in
                        Text(item.title).tag(item)
                    }
                }
                .pickerStyle(.segmented)
            }

            if mode == .routine {
                routineLogForm
            } else {
                quickLogForm
            }
        }
        .navigationTitle("Log")
        .onAppear {
            if selectedRoutineID == nil {
                selectedRoutineID = store.routines.first?.id
                configureRoutineDrafts()
            }
        }
        .onChange(of: selectedRoutineID, initial: false) { _, _ in
            configureRoutineDrafts()
        }
        .alert(confirmationMessage, isPresented: $showingConfirmation) {
            Button("OK", role: .cancel) {}
        }
    }

    private var quickLogForm: some View {
        Group {
            Section("Session") {
                DatePicker("Date", selection: $quickDate, displayedComponents: .date)

                Picker("Type", selection: $quickKind) {
                    ForEach(SessionKind.allCases) { kind in
                        Text(kind.title).tag(kind)
                    }
                }

                TextField("Title", text: $quickTitle, prompt: Text("Optional"))

                Stepper("Duration: \(quickDuration) min", value: $quickDuration, in: 0...360, step: 5)
                Stepper("Intensity: \(quickIntensity)/5", value: $quickIntensity, in: 1...5)
            }

            Section("Body load") {
                BodyAreaSelector(title: "What did this session hit?", selectedAreas: $quickAreas)
            }

            Section("Notes") {
                TextField("Anything worth remembering?", text: $quickNotes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save quick session") {
                    saveQuickSession()
                }
                .buttonStyle(.borderedProminent)
            } footer: {
                Text("Use this for run, bike, swim, surf, hikes, or any day where you want a fast log.")
            }
        }
    }

    private var routineLogForm: some View {
        Group {
            Section("Routine") {
                if store.routines.isEmpty {
                    Text("Create a routine first in the Routines tab.")
                        .foregroundStyle(.secondary)
                } else {
                    Picker("Routine", selection: $selectedRoutineID) {
                        ForEach(store.routines) { routine in
                            Text(routine.name).tag(Optional(routine.id))
                        }
                    }

                    DatePicker("Date", selection: $routineDate, displayedComponents: .date)
                    Stepper("Planned duration: \(routineDuration) min", value: $routineDuration, in: 0...240, step: 5)
                    Stepper("Intensity: \(routineIntensity)/5", value: $routineIntensity, in: 1...5)

                    if let selectedRoutine {
                        Text(selectedRoutine.notes)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if let selectedRoutine, !selectedRoutine.exercises.isEmpty {
                Section {
                    Text("Log only the main working sets that matter for progress. The app can learn your usual weights from this.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                ForEach($exerciseDrafts) { $draft in
                    Section(draft.name) {
                        TextField("Weight (kg)", text: $draft.weight)
                        TextField("Reps", text: $draft.reps)
                        Stepper("Effort: \(draft.effort)/10", value: $draft.effort, in: 1...10)

                        if !draft.hint.isEmpty {
                            Text(draft.hint)
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            Section("Body load") {
                BodyAreaSelector(title: "What felt most loaded?", selectedAreas: $routineAreas)
            }

            Section("Notes") {
                TextField("How did this routine feel?", text: $routineNotes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save routine session") {
                    saveRoutineSession()
                }
                .buttonStyle(.borderedProminent)
                .disabled(selectedRoutine == nil)
            }
        }
    }

    private var selectedRoutine: TrainingRoutine? {
        store.routine(for: selectedRoutineID)
    }

    private func configureRoutineDrafts() {
        guard let routine = selectedRoutine else {
            exerciseDrafts = []
            return
        }

        routineDuration = routine.estimatedMinutes
        routineAreas = defaultAreas(for: routine.sessionKind)

        exerciseDrafts = routine.exercises.map { exercise in
            let previousWeight = store.lastWeight(for: exercise.name)
            return ExerciseEntryDraft(
                id: exercise.id,
                name: exercise.name,
                weight: previousWeight.map { formatWeightInput($0) } ?? "",
                reps: "",
                effort: 8,
                hint: previousWeight.map { "Last key set: \($0.weightString)" } ?? "No previous benchmark yet"
            )
        }
    }

    private func saveQuickSession() {
        let workout = WorkoutLog(
            id: UUID(),
            date: quickDate,
            title: quickTitle.isEmpty ? quickKind.title : quickTitle,
            kind: quickKind,
            durationMinutes: quickDuration,
            intensity: quickIntensity,
            notes: quickNotes,
            routineID: nil,
            loadedAreas: Array(quickAreas),
            exerciseLogs: []
        )

        store.addWorkout(workout)
        quickTitle = ""
        quickDuration = 60
        quickIntensity = 3
        quickNotes = ""
        quickAreas = []
        confirmationMessage = "Quick session saved"
        showingConfirmation = true
    }

    private func saveRoutineSession() {
        guard let routine = selectedRoutine else { return }

        let exerciseLogs: [ExerciseLog] = exerciseDrafts.compactMap { draft -> ExerciseLog? in
            let weight = Double(draft.weight.replacingOccurrences(of: ",", with: "."))
            let reps = Int(draft.reps)

            if weight == nil && reps == nil {
                return nil
            }

            return ExerciseLog(
                id: UUID(),
                name: draft.name,
                keyWeight: weight,
                reps: reps,
                effort: draft.effort
            )
        }

        let workout = WorkoutLog(
            id: UUID(),
            date: routineDate,
            title: routine.name,
            kind: routine.sessionKind,
            durationMinutes: routineDuration,
            intensity: routineIntensity,
            notes: routineNotes,
            routineID: routine.id,
            loadedAreas: Array(routineAreas),
            exerciseLogs: exerciseLogs
        )

        store.addWorkout(workout)
        routineIntensity = 3
        routineNotes = ""
        configureRoutineDrafts()
        confirmationMessage = "Routine session saved"
        showingConfirmation = true
    }

    private func defaultAreas(for kind: SessionKind) -> Set<BodyArea> {
        switch kind {
        case .strength, .explosive:
            return [.legs, .core]
        case .bike, .run, .hike:
            return [.legs]
        case .swim, .surf:
            return [.shoulders, .back, .core]
        case .functional:
            return [.legs, .shoulders, .core]
        case .mobility, .recovery:
            return []
        }
    }

    private func formatWeightInput(_ value: Double) -> String {
        if value.rounded() == value {
            return "\(Int(value))"
        }
        return value.formatted(.number.precision(.fractionLength(1)))
    }
}

private enum LogMode: String, CaseIterable, Identifiable {
    case routine
    case quick

    var id: String { rawValue }

    var title: String {
        switch self {
        case .routine: return "Routine"
        case .quick: return "Quick"
        }
    }
}

private struct ExerciseEntryDraft: Identifiable {
    var id: UUID
    var name: String
    var weight: String
    var reps: String
    var effort: Int
    var hint: String
}

import SwiftUI

struct RoutinesView: View {
    @EnvironmentObject private var store: TrainingStore

    @State private var showingRoutineSheet = false
    @State private var showingBlockSheet = false

    var body: some View {
        List {
            Section("Blocks") {
                if store.blocks.isEmpty {
                    Text("Create your first weekly loop here.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.blocks) { block in
                        BlockCard(
                            block: block,
                            isActive: store.activeBlockID == block.id,
                            onSetActive: { store.setActiveBlock(block) },
                            onAdvance: {
                                if store.activeBlockID != block.id {
                                    store.setActiveBlock(block)
                                }
                                store.advanceActiveBlockWeek()
                            }
                        )
                        .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                    }
                }
            }

            Section("Saved routines") {
                if store.routines.isEmpty {
                    Text("Start by creating a few key sessions you want to repeat.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.routines) { routine in
                        RoutineCard(routine: routine)
                            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                    }
                }
            }
        }
        .navigationTitle("Routines")
        .toolbar {
            ToolbarItemGroup {
                Button("Block") {
                    showingBlockSheet = true
                }

                Button("Routine") {
                    showingRoutineSheet = true
                }
            }
        }
        .sheet(isPresented: $showingRoutineSheet) {
            RoutineEditorView { routine in
                store.addRoutine(routine)
            }
        }
        .sheet(isPresented: $showingBlockSheet) {
            BlockEditorView(routines: store.routines) { block in
                store.addBlock(block)
            }
        }
    }
}

private struct RoutineCard: View {
    let routine: TrainingRoutine

    var body: some View {
        SectionCard(routine.name, subtitle: "\(routine.kind.title) • \(routine.estimatedMinutes) min") {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Label(routine.sessionKind.title, systemImage: routine.sessionKind.icon)
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    EmphasisBadge(emphasis: routine.sessionKind.emphasis)
                }

                if !routine.notes.isEmpty {
                    Text(routine.notes)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                if routine.exercises.isEmpty {
                    Text("This routine is mainly time and effort based.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(routine.exercises) { exercise in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(exercise.name)
                                .font(.subheadline.weight(.medium))
                            Text("\(exercise.targetSets) sets • \(exercise.targetReps)")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }
}

private struct BlockCard: View {
    let block: TrainingBlock
    let isActive: Bool
    let onSetActive: () -> Void
    let onAdvance: () -> Void

    var body: some View {
        SectionCard(block.name, subtitle: block.focus) {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(block.weekLabel)
                        .font(.subheadline.weight(.semibold))
                    Spacer()

                    if isActive {
                        Text("Active")
                            .font(.caption.bold())
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.orange.opacity(0.18))
                            .foregroundStyle(.orange)
                            .clipShape(Capsule())
                    }
                }

                if let currentWeek = block.currentWeek {
                    Text(currentWeek.note)
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    ForEach(currentWeek.plannedSessions) { session in
                        HStack {
                            Text("\(session.dayLabel) • \(session.sessionTitle)")
                            Spacer()
                            Image(systemName: session.kind.icon)
                                .foregroundStyle(.orange)
                        }
                        .font(.subheadline)
                    }
                }

                HStack {
                    Button(isActive ? "Selected" : "Use this block") {
                        onSetActive()
                    }
                    .buttonStyle(.bordered)
                    .disabled(isActive)

                    Button("Advance week") {
                        onAdvance()
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
    }
}

private struct RoutineEditorView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var kind: RoutineKind = .strength
    @State private var sessionKind: SessionKind = .strength
    @State private var estimatedMinutes = 60
    @State private var notes = ""
    @State private var exercises: [RoutineExerciseDraft] = [RoutineExerciseDraft()]

    let onSave: (TrainingRoutine) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Details") {
                    TextField("Routine name", text: $name)

                    Picker("Routine type", selection: $kind) {
                        ForEach(RoutineKind.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }

                    Picker("Primary session type", selection: $sessionKind) {
                        ForEach(SessionKind.allCases) { option in
                            Text(option.title).tag(option)
                        }
                    }

                    Stepper("Estimated duration: \(estimatedMinutes) min", value: $estimatedMinutes, in: 0...240, step: 5)
                    TextField("Notes", text: $notes, axis: .vertical)
                        .lineLimit(2...5)
                }

                Section("Exercises") {
                    Text("Keep this to the important progress-driving lifts. That makes logging faster later.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)

                    ForEach($exercises) { $exercise in
                        VStack(alignment: .leading, spacing: 10) {
                            TextField("Exercise name", text: $exercise.name)
                            Stepper("Sets: \(exercise.targetSets)", value: $exercise.targetSets, in: 1...10)
                            TextField("Rep target", text: $exercise.targetReps, prompt: Text("Example: 4-6"))
                            TextField("Notes", text: $exercise.notes, prompt: Text("Optional"))
                        }
                        .padding(.vertical, 6)
                    }

                    Button("Add exercise") {
                        exercises.append(RoutineExerciseDraft())
                    }
                }
            }
            .navigationTitle("New Routine")
            .toolbar {
                ToolbarItem {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem {
                    Button("Save") {
                        let routine = TrainingRoutine(
                            id: UUID(),
                            name: name,
                            kind: kind,
                            sessionKind: sessionKind,
                            notes: notes,
                            estimatedMinutes: estimatedMinutes,
                            exercises: exercises
                                .filter { !$0.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
                                .map {
                                    RoutineExercise(
                                        id: UUID(),
                                        name: $0.name,
                                        targetSets: $0.targetSets,
                                        targetReps: $0.targetReps.isEmpty ? "-" : $0.targetReps,
                                        notes: $0.notes
                                    )
                                }
                        )

                        onSave(routine)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}

private struct BlockEditorView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var focus = ""
    @State private var weekCount = 4
    @State private var isLooping = true
    @State private var weeks: [BlockWeekDraft] = []

    let routines: [TrainingRoutine]
    let onSave: (TrainingBlock) -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section("Block") {
                    TextField("Block name", text: $name)
                    TextField("Focus", text: $focus, prompt: Text("What is this block trying to do?"))
                    Stepper("Weeks: \(weekCount)", value: $weekCount, in: 1...8)
                    Toggle("Loop back to week 1", isOn: $isLooping)
                }

                ForEach($weeks) { $week in
                    Section(week.title.isEmpty ? "Week" : week.title) {
                        TextField("Week title", text: $week.title)
                        TextField("Week note", text: $week.note, prompt: Text("What matters this week?"))

                        ForEach($week.sessions) { $session in
                            VStack(alignment: .leading, spacing: 10) {
                                TextField("Day label", text: $session.dayLabel, prompt: Text("Mon / Tue / Long run"))

                                Picker("Routine", selection: $session.routineID) {
                                    Text("Custom session").tag(UUID?.none)
                                    ForEach(routines) { routine in
                                        Text(routine.name).tag(Optional(routine.id))
                                    }
                                }

                                TextField("Session title", text: $session.sessionTitle)

                                Picker("Type", selection: $session.kind) {
                                    ForEach(SessionKind.allCases) { kind in
                                        Text(kind.title).tag(kind)
                                    }
                                }
                            }
                            .padding(.vertical, 6)
                            .onChange(of: session.routineID, initial: false) { _, newValue in
                                guard let newValue, let selectedRoutine = routines.first(where: { $0.id == newValue }) else { return }
                                session.sessionTitle = selectedRoutine.name
                                session.kind = selectedRoutine.sessionKind
                            }
                        }

                        Button("Add planned session") {
                            week.sessions.append(PlannedSessionDraft())
                        }
                    }
                }
            }
            .navigationTitle("New Block")
            .onAppear {
                syncWeeks()
            }
            .onChange(of: weekCount, initial: false) { _, _ in
                syncWeeks()
            }
            .toolbar {
                ToolbarItem {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem {
                    Button("Save") {
                        let block = TrainingBlock(
                            id: UUID(),
                            name: name,
                            focus: focus,
                            weeks: weeks.map { draft in
                                BlockWeek(
                                    id: UUID(),
                                    title: draft.title.isEmpty ? "Week" : draft.title,
                                    note: draft.note,
                                    plannedSessions: draft.sessions.map {
                                        PlannedSession(
                                            id: UUID(),
                                            dayLabel: $0.dayLabel.isEmpty ? "Day" : $0.dayLabel,
                                            routineID: $0.routineID,
                                            sessionTitle: $0.sessionTitle.isEmpty ? "Planned session" : $0.sessionTitle,
                                            kind: $0.kind
                                        )
                                    }
                                )
                            },
                            currentWeekIndex: 0,
                            isLooping: isLooping
                        )

                        onSave(block)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func syncWeeks() {
        if weeks.count < weekCount {
            let missing = weekCount - weeks.count
            for index in 0..<missing {
                let label = "Week \(weeks.count + index + 1)"
                weeks.append(BlockWeekDraft(title: label))
            }
        } else if weeks.count > weekCount {
            weeks = Array(weeks.prefix(weekCount))
        }
    }
}

private struct RoutineExerciseDraft: Identifiable {
    var id = UUID()
    var name = ""
    var targetSets = 3
    var targetReps = ""
    var notes = ""
}

private struct BlockWeekDraft: Identifiable {
    var id = UUID()
    var title: String
    var note = ""
    var sessions: [PlannedSessionDraft] = [PlannedSessionDraft()]
}

private struct PlannedSessionDraft: Identifiable {
    var id = UUID()
    var dayLabel = ""
    var routineID: UUID?
    var sessionTitle = ""
    var kind: SessionKind = .strength
}

import Combine
import Foundation

final class TrainingStore: ObservableObject {
    @Published private(set) var routines: [TrainingRoutine] = []
    @Published private(set) var blocks: [TrainingBlock] = []
    @Published private(set) var workouts: [WorkoutLog] = []
    @Published private(set) var bodyCheckIns: [BodyCheckIn] = []
    @Published private(set) var activeBlockID: UUID?

    private let calendar = Calendar.current

    init() {
        load()
    }

    var activeBlock: TrainingBlock? {
        blocks.first(where: { $0.id == activeBlockID })
    }

    var latestBodyCheckIn: BodyCheckIn? {
        bodyCheckIns.sorted(by: { $0.date > $1.date }).first
    }

    var recentWorkouts: [WorkoutLog] {
        workouts.sorted(by: { $0.date > $1.date })
    }

    var weeklyMetrics: [WeeklyMetric] {
        let lastSeven = workoutsInLast(days: 7)
        let totalMinutes = lastSeven.reduce(0) { $0 + $1.durationMinutes }
        let strengthCount = lastSeven.filter { $0.kind.emphasis == .strength || $0.kind.emphasis == .power }.count
        let enduranceMinutes = lastSeven
            .filter { $0.kind.emphasis == .endurance || $0.kind == .surf }
            .reduce(0) { $0 + $1.durationMinutes }
        let sleepValue = latestBodyCheckIn.map { String(format: "%.1f h", $0.sleepHours) } ?? "No check-in"

        return [
            WeeklyMetric(label: "7-day load", value: "\(totalMinutes) min", detail: "\(lastSeven.count) sessions"),
            WeeklyMetric(label: "Strength + power", value: "\(strengthCount)", detail: "Key sessions this week"),
            WeeklyMetric(label: "Endurance", value: "\(enduranceMinutes) min", detail: "Run, bike, swim, hike, surf"),
            WeeklyMetric(label: "Sleep", value: sleepValue, detail: latestBodyCheckIn == nil ? "Add a body check-in" : "Latest logged night")
        ]
    }

    var weeklyBreakdown: [SessionBreakdown] {
        let lastSeven = workoutsInLast(days: 7)
        let grouped = Dictionary(grouping: lastSeven, by: \.kind)

        return grouped.map { key, value in
            SessionBreakdown(kind: key, minutes: value.reduce(0) { $0 + $1.durationMinutes })
        }
        .sorted { $0.minutes > $1.minutes }
    }

    var guidanceCards: [GuidanceCard] {
        buildGuidance()
    }

    func routine(for id: UUID?) -> TrainingRoutine? {
        guard let id else { return nil }
        return routines.first(where: { $0.id == id })
    }

    func setActiveBlock(_ block: TrainingBlock) {
        activeBlockID = block.id
        persist()
    }

    func advanceActiveBlockWeek() {
        guard let activeBlockID, let index = blocks.firstIndex(where: { $0.id == activeBlockID }) else { return }
        guard !blocks[index].weeks.isEmpty else { return }

        let nextIndex = blocks[index].currentWeekIndex + 1
        if nextIndex < blocks[index].weeks.count {
            blocks[index].currentWeekIndex = nextIndex
        } else if blocks[index].isLooping {
            blocks[index].currentWeekIndex = 0
        }

        persist()
    }

    func addRoutine(_ routine: TrainingRoutine) {
        routines.insert(routine, at: 0)
        persist()
    }

    func addBlock(_ block: TrainingBlock) {
        blocks.insert(block, at: 0)
        if activeBlockID == nil {
            activeBlockID = block.id
        }
        persist()
    }

    func addWorkout(_ workout: WorkoutLog) {
        workouts.append(workout)
        workouts.sort(by: { $0.date > $1.date })
        persist()
    }

    func addBodyCheckIn(_ checkIn: BodyCheckIn) {
        if let existingIndex = bodyCheckIns.firstIndex(where: { calendar.isDate($0.date, inSameDayAs: checkIn.date) }) {
            bodyCheckIns[existingIndex] = checkIn
        } else {
            bodyCheckIns.append(checkIn)
        }

        bodyCheckIns.sort(by: { $0.date > $1.date })
        persist()
    }

    func lastWeight(for exerciseName: String) -> Double? {
        recentWorkouts
            .flatMap(\.exerciseLogs)
            .first(where: { $0.name.caseInsensitiveCompare(exerciseName) == .orderedSame && $0.keyWeight != nil })?
            .keyWeight
    }

    func exerciseTrends(limit: Int = 8) -> [ExerciseTrend] {
        let logsByExercise = Dictionary(grouping: recentWorkouts.flatMap(\.exerciseLogs)) { $0.name }

        return logsByExercise.compactMap { name, entries in
            let weighted = entries.filter { $0.keyWeight != nil }
            guard let latest = weighted.first, let latestWeight = latest.keyWeight else { return nil }

            let previousWeight = weighted.dropFirst().compactMap(\.keyWeight).first
            let comparison: String
            if let previousWeight {
                let delta = latestWeight - previousWeight
                if abs(delta) < 0.05 {
                    comparison = "Holding steady"
                } else if delta > 0 {
                    comparison = "+\(delta.weightString)"
                } else {
                    comparison = "\(delta.weightString)"
                }
            } else {
                comparison = "First logged benchmark"
            }

            return ExerciseTrend(name: name, latest: latestWeight.weightString, comparison: comparison)
        }
        .sorted { $0.name < $1.name }
        .prefix(limit)
        .map { $0 }
    }

    func workoutsInLast(days: Int) -> [WorkoutLog] {
        guard let cutoff = calendar.date(byAdding: .day, value: -(days - 1), to: Date()) else { return recentWorkouts }
        return recentWorkouts.filter { $0.date >= cutoff }
    }

    private func load() {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601

        guard
            let data = try? Data(contentsOf: storageURL),
            let snapshot = try? decoder.decode(TrainingSnapshot.self, from: data)
        else {
            seedSampleData()
            return
        }

        routines = snapshot.routines
        blocks = snapshot.blocks
        workouts = snapshot.workouts.sorted(by: { $0.date > $1.date })
        bodyCheckIns = snapshot.bodyCheckIns.sorted(by: { $0.date > $1.date })
        activeBlockID = snapshot.activeBlockID
    }

    private func persist() {
        let snapshot = TrainingSnapshot(
            routines: routines,
            blocks: blocks,
            workouts: workouts,
            bodyCheckIns: bodyCheckIns,
            activeBlockID: activeBlockID
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601

        do {
            let data = try encoder.encode(snapshot)
            try data.write(to: storageURL, options: .atomic)
        } catch {
            assertionFailure("Failed to save training data: \(error)")
        }
    }

    private var storageURL: URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
            ?? FileManager.default.temporaryDirectory
        return base.appendingPathComponent("pulseboard-data.json")
    }

    private func buildGuidance() -> [GuidanceCard] {
        let latestCheckIn = latestBodyCheckIn
        let lastSeven = workoutsInLast(days: 7)
        let fatiguedAreas = Set(latestCheckIn?.fatiguedAreas ?? [])
        let sleep = latestCheckIn?.sleepHours ?? 7
        let energy = latestCheckIn?.energy ?? 3
        let soreness = latestCheckIn?.soreness ?? 2

        let strengthCount = lastSeven.filter { $0.kind.emphasis == .strength }.count
        let powerCount = lastSeven.filter { $0.kind.emphasis == .power }.count
        let enduranceMinutes = lastSeven
            .filter { $0.kind.emphasis == .endurance || $0.kind == .surf }
            .reduce(0) { $0 + $1.durationMinutes }

        var cards: [GuidanceCard] = []

        if sleep < 6.5 || energy <= 2 || soreness >= 4 {
            cards.append(
                GuidanceCard(
                    title: "Keep the streak, lower the cost",
                    summary: "You still train best when you choose a session your body can absorb. Today should feel productive, not punishing.",
                    nextBestOption: tiredDaySuggestion(for: fatiguedAreas),
                    emphasis: .recovery
                )
            )
        } else if strengthCount < 2 {
            cards.append(
                GuidanceCard(
                    title: "Bring strength back into the week",
                    summary: "Your balance is drifting away from resistance work. Logging one focused lift session will protect the strong-and-athletic goal.",
                    nextBestOption: fatiguedAreas.contains(.legs)
                        ? "Use an upper-body strength routine and finish with 15 minutes of easy cardio."
                        : "Open a saved strength routine and log the main working sets instead of every warm-up detail.",
                    emphasis: .strength
                )
            )
        } else if enduranceMinutes < 120 {
            cards.append(
                GuidanceCard(
                    title: "Your engine needs attention",
                    summary: "Strength is present, but the aerobic side of the mix is a little light right now.",
                    nextBestOption: fatiguedAreas.contains(.legs)
                        ? "Use a swim or easy surf if available. If not, do short mobility plus an upper-body-focused session."
                        : "Pick a run, bike, hike, or steady swim for 40 to 75 minutes at a controlled effort.",
                    emphasis: .endurance
                )
            )
        } else if powerCount == 0 {
            cards.append(
                GuidanceCard(
                    title: "Keep your explosiveness alive",
                    summary: "A short neural session helps you stay athletic even during heavier endurance or general training weeks.",
                    nextBestOption: fatiguedAreas.contains(.legs)
                        ? "Use med-ball work, upper-body power, or short technique drills instead of hard sprints."
                        : "Use jumps, sprints, or Olympic-lift variations before fatigue piles up.",
                    emphasis: .power
                )
            )
        } else {
            cards.append(
                GuidanceCard(
                    title: "Balanced enough to build",
                    summary: "You have a decent recent mix. The best move is to keep momentum with the next logical session instead of inventing a random hard day.",
                    nextBestOption: activeBlockSuggestion() ?? "Repeat a saved routine, log the key sets, and stop before the session turns into filler volume.",
                    emphasis: .mixed
                )
            )
        }

        if let activeBlock {
            cards.append(
                GuidanceCard(
                    title: activeBlock.weekLabel,
                    summary: activeBlock.currentWeek?.note ?? "Use your block to reduce decision fatigue and keep the week in balance.",
                    nextBestOption: activeBlock.currentWeek?.plannedSessions.first.map {
                        "\($0.dayLabel): \($0.sessionTitle)"
                    } ?? "Your block is ready for a new planned session.",
                    emphasis: .mixed
                )
            )
        }

        if let latestCheckIn, !latestCheckIn.fatiguedAreas.isEmpty {
            cards.append(
                GuidanceCard(
                    title: "Body map is part of the plan",
                    summary: "You marked \(latestCheckIn.fatiguedAreas.titles.lowercased()). That should guide the session choice more than pure motivation today.",
                    nextBestOption: bodyAreaRedirect(for: fatiguedAreas),
                    emphasis: .recovery
                )
            )
        }

        return Array(cards.prefix(3))
    }

    private func tiredDaySuggestion(for fatiguedAreas: Set<BodyArea>) -> String {
        if fatiguedAreas.contains(.legs) && !fatiguedAreas.contains(.shoulders) && !fatiguedAreas.contains(.back) {
            return "Skip hard leg work. Use upper-body strength, easy swim, or mobility plus a short recovery circuit."
        }

        if fatiguedAreas.contains(.shoulders) || fatiguedAreas.contains(.back) {
            return "Avoid stacking surf-style pulling or heavy upper work. Choose zone 2 bike, hike, lower-body accessories, or mobility."
        }

        return "Use 30 to 45 minutes of zone 2, a hike, easy surf, or a short mobility session so you keep moving without digging deeper."
    }

    private func bodyAreaRedirect(for fatiguedAreas: Set<BodyArea>) -> String {
        if fatiguedAreas.contains(.legs) {
            return "Legs are loaded, so bias upper body, swim technique, mobility, or very easy aerobic work."
        }

        if fatiguedAreas.contains(.shoulders) || fatiguedAreas.contains(.back) {
            return "Back or shoulders are loaded, so avoid extra paddling and pulling volume. Lower body or bike fits better."
        }

        return "Use your soreness map to choose the lowest-overlap session instead of trying to force everything at once."
    }

    private func activeBlockSuggestion() -> String? {
        guard let session = activeBlock?.currentWeek?.plannedSessions.first else { return nil }
        return "Stay inside your block: \(session.dayLabel) is set for \(session.sessionTitle)."
    }

    private func seedSampleData() {
        let lowerBody = TrainingRoutine(
            id: UUID(),
            name: "Lower Body Power",
            kind: .strength,
            sessionKind: .strength,
            notes: "Key lower-body session. Log the main sets, not the warm-up clutter.",
            estimatedMinutes: 75,
            exercises: [
                RoutineExercise(id: UUID(), name: "Front Squat", targetSets: 4, targetReps: "4-6", notes: "Top sets"),
                RoutineExercise(id: UUID(), name: "Romanian Deadlift", targetSets: 3, targetReps: "6-8", notes: "Controlled"),
                RoutineExercise(id: UUID(), name: "Bulgarian Split Squat", targetSets: 3, targetReps: "6 each", notes: ""),
                RoutineExercise(id: UUID(), name: "Box Jump", targetSets: 4, targetReps: "3", notes: "Stay sharp")
            ]
        )

        let upperBody = TrainingRoutine(
            id: UUID(),
            name: "Upper Body Push + Pull",
            kind: .strength,
            sessionKind: .strength,
            notes: "Upper-body day that still leaves room for an easy endurance add-on.",
            estimatedMinutes: 65,
            exercises: [
                RoutineExercise(id: UUID(), name: "Bench Press", targetSets: 4, targetReps: "4-6", notes: "Main lift"),
                RoutineExercise(id: UUID(), name: "Weighted Pull-Up", targetSets: 4, targetReps: "4-6", notes: ""),
                RoutineExercise(id: UUID(), name: "Single-Arm Row", targetSets: 3, targetReps: "8", notes: ""),
                RoutineExercise(id: UUID(), name: "Landmine Press", targetSets: 3, targetReps: "8", notes: "")
            ]
        )

        let bikeRoutine = TrainingRoutine(
            id: UUID(),
            name: "Iron Build Bike",
            kind: .conditioning,
            sessionKind: .bike,
            notes: "Steady aerobic builder or controlled intervals, depending on the block.",
            estimatedMinutes: 75,
            exercises: []
        )

        let explosiveRoutine = TrainingRoutine(
            id: UUID(),
            name: "Sprint + Elasticity",
            kind: .mixed,
            sessionKind: .explosive,
            notes: "Short power session to keep your nervous system awake.",
            estimatedMinutes: 35,
            exercises: [
                RoutineExercise(id: UUID(), name: "Bounds", targetSets: 3, targetReps: "20m", notes: ""),
                RoutineExercise(id: UUID(), name: "Hill Sprint", targetSets: 6, targetReps: "10s", notes: "Full recovery"),
                RoutineExercise(id: UUID(), name: "Med Ball Slam", targetSets: 4, targetReps: "5", notes: "")
            ]
        )

        let recoveryRoutine = TrainingRoutine(
            id: UUID(),
            name: "Flush + Mobility",
            kind: .recovery,
            sessionKind: .mobility,
            notes: "For tired days where you still want to do something useful.",
            estimatedMinutes: 30,
            exercises: [
                RoutineExercise(id: UUID(), name: "Easy Spin / Walk", targetSets: 1, targetReps: "20 min", notes: ""),
                RoutineExercise(id: UUID(), name: "Hip Mobility Flow", targetSets: 2, targetReps: "5 min", notes: ""),
                RoutineExercise(id: UUID(), name: "Thoracic Opener", targetSets: 2, targetReps: "90s", notes: "")
            ]
        )

        routines = [lowerBody, upperBody, bikeRoutine, explosiveRoutine, recoveryRoutine]

        let block = TrainingBlock(
            id: UUID(),
            name: "Hybrid Base Loop",
            focus: "Balance strength and endurance while keeping speed alive.",
            weeks: [
                BlockWeek(
                    id: UUID(),
                    title: "Base load",
                    note: "Accumulate good work without chasing failure.",
                    plannedSessions: [
                        PlannedSession(id: UUID(), dayLabel: "Mon", routineID: lowerBody.id, sessionTitle: lowerBody.name, kind: .strength),
                        PlannedSession(id: UUID(), dayLabel: "Wed", routineID: bikeRoutine.id, sessionTitle: bikeRoutine.name, kind: .bike),
                        PlannedSession(id: UUID(), dayLabel: "Fri", routineID: upperBody.id, sessionTitle: upperBody.name, kind: .strength)
                    ]
                ),
                BlockWeek(
                    id: UUID(),
                    title: "Build",
                    note: "Same structure, slightly higher intent.",
                    plannedSessions: [
                        PlannedSession(id: UUID(), dayLabel: "Mon", routineID: lowerBody.id, sessionTitle: lowerBody.name, kind: .strength),
                        PlannedSession(id: UUID(), dayLabel: "Thu", routineID: explosiveRoutine.id, sessionTitle: explosiveRoutine.name, kind: .explosive),
                        PlannedSession(id: UUID(), dayLabel: "Sat", routineID: bikeRoutine.id, sessionTitle: "Long aerobic bike", kind: .bike)
                    ]
                ),
                BlockWeek(
                    id: UUID(),
                    title: "Power bias",
                    note: "Keep the engine work, but make room for faster output.",
                    plannedSessions: [
                        PlannedSession(id: UUID(), dayLabel: "Tue", routineID: explosiveRoutine.id, sessionTitle: explosiveRoutine.name, kind: .explosive),
                        PlannedSession(id: UUID(), dayLabel: "Thu", routineID: upperBody.id, sessionTitle: upperBody.name, kind: .strength),
                        PlannedSession(id: UUID(), dayLabel: "Sun", routineID: bikeRoutine.id, sessionTitle: bikeRoutine.name, kind: .bike)
                    ]
                ),
                BlockWeek(
                    id: UUID(),
                    title: "Deload / reset",
                    note: "Move often, reduce cost, and set up the next loop.",
                    plannedSessions: [
                        PlannedSession(id: UUID(), dayLabel: "Mon", routineID: recoveryRoutine.id, sessionTitle: recoveryRoutine.name, kind: .mobility),
                        PlannedSession(id: UUID(), dayLabel: "Thu", routineID: bikeRoutine.id, sessionTitle: "Easy aerobic ride", kind: .bike)
                    ]
                )
            ],
            currentWeekIndex: 0,
            isLooping: true
        )

        blocks = [block]
        activeBlockID = block.id

        workouts = [
            WorkoutLog(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -1, to: Date()) ?? Date(),
                title: "Upper Body Push + Pull",
                kind: .strength,
                durationMinutes: 68,
                intensity: 4,
                notes: "Strong bench. Pulling volume felt heavy after surf earlier in the week.",
                routineID: upperBody.id,
                loadedAreas: [.chest, .back, .arms, .shoulders],
                exerciseLogs: [
                    ExerciseLog(id: UUID(), name: "Bench Press", keyWeight: 62.5, reps: 5, effort: 8),
                    ExerciseLog(id: UUID(), name: "Weighted Pull-Up", keyWeight: 10, reps: 5, effort: 8)
                ]
            ),
            WorkoutLog(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -2, to: Date()) ?? Date(),
                title: "Iron Build Bike",
                kind: .bike,
                durationMinutes: 82,
                intensity: 3,
                notes: "Steady aerobic ride.",
                routineID: bikeRoutine.id,
                loadedAreas: [.legs],
                exerciseLogs: []
            ),
            WorkoutLog(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -3, to: Date()) ?? Date(),
                title: "Surf Session",
                kind: .surf,
                durationMinutes: 95,
                intensity: 3,
                notes: "Shoulders got a solid dose. Great day in the water.",
                routineID: nil,
                loadedAreas: [.shoulders, .back, .core],
                exerciseLogs: []
            ),
            WorkoutLog(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -4, to: Date()) ?? Date(),
                title: "Lower Body Power",
                kind: .strength,
                durationMinutes: 74,
                intensity: 4,
                notes: "Front squat moved well. Left leg a little heavy.",
                routineID: lowerBody.id,
                loadedAreas: [.legs, .glutes, .core],
                exerciseLogs: [
                    ExerciseLog(id: UUID(), name: "Front Squat", keyWeight: 72.5, reps: 5, effort: 8),
                    ExerciseLog(id: UUID(), name: "Romanian Deadlift", keyWeight: 80, reps: 6, effort: 7)
                ]
            ),
            WorkoutLog(
                id: UUID(),
                date: calendar.date(byAdding: .day, value: -6, to: Date()) ?? Date(),
                title: "Sprint + Elasticity",
                kind: .explosive,
                durationMinutes: 34,
                intensity: 4,
                notes: "Fast but short. Nice pop.",
                routineID: explosiveRoutine.id,
                loadedAreas: [.legs, .core],
                exerciseLogs: [
                    ExerciseLog(id: UUID(), name: "Hill Sprint", keyWeight: nil, reps: 6, effort: 9)
                ]
            )
        ]

        bodyCheckIns = [
            BodyCheckIn(
                id: UUID(),
                date: Date(),
                sleepHours: 7.2,
                energy: 3,
                soreness: 3,
                stress: 2,
                fatiguedAreas: [.shoulders, .back],
                notes: "Upper body is a bit cooked, legs are decent."
            )
        ]

        persist()
    }
}

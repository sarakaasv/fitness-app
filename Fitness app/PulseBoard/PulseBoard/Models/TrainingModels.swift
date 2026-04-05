import Foundation

enum TrainingEmphasis: String, CaseIterable, Codable {
    case strength
    case endurance
    case power
    case recovery
    case mixed

    var title: String {
        switch self {
        case .strength: return "Strength"
        case .endurance: return "Endurance"
        case .power: return "Power"
        case .recovery: return "Recovery"
        case .mixed: return "Mixed"
        }
    }
}

enum SessionKind: String, CaseIterable, Codable, Identifiable {
    case strength
    case explosive
    case run
    case bike
    case swim
    case surf
    case functional
    case mobility
    case hike
    case recovery

    var id: String { rawValue }

    var title: String {
        switch self {
        case .strength: return "Strength"
        case .explosive: return "Explosive"
        case .run: return "Run"
        case .bike: return "Bike"
        case .swim: return "Swim"
        case .surf: return "Surf"
        case .functional: return "Functional"
        case .mobility: return "Mobility"
        case .hike: return "Hike"
        case .recovery: return "Recovery"
        }
    }

    var icon: String {
        switch self {
        case .strength: return "dumbbell.fill"
        case .explosive: return "bolt.fill"
        case .run: return "figure.run"
        case .bike: return "bicycle"
        case .swim: return "figure.pool.swim"
        case .surf: return "water.waves"
        case .functional: return "figure.mixed.cardio"
        case .mobility: return "figure.cooldown"
        case .hike: return "figure.hiking"
        case .recovery: return "heart.text.square.fill"
        }
    }

    var emphasis: TrainingEmphasis {
        switch self {
        case .strength: return .strength
        case .explosive: return .power
        case .run, .bike, .swim, .hike: return .endurance
        case .recovery, .mobility: return .recovery
        case .surf, .functional: return .mixed
        }
    }

    var shortDescription: String {
        switch self.emphasis {
        case .strength: return "Heavy or controlled resistance work"
        case .endurance: return "Aerobic capacity and engine building"
        case .power: return "Fast neural work and explosiveness"
        case .recovery: return "Low-cost movement that helps you bounce back"
        case .mixed: return "Athletic sessions with several demands"
        }
    }
}

enum RoutineKind: String, CaseIterable, Codable, Identifiable {
    case strength
    case conditioning
    case mixed
    case recovery

    var id: String { rawValue }

    var title: String {
        switch self {
        case .strength: return "Strength"
        case .conditioning: return "Conditioning"
        case .mixed: return "Mixed"
        case .recovery: return "Recovery"
        }
    }
}

enum BodyArea: String, CaseIterable, Codable, Identifiable {
    case legs
    case glutes
    case back
    case shoulders
    case chest
    case arms
    case core

    var id: String { rawValue }

    var title: String {
        switch self {
        case .legs: return "Legs"
        case .glutes: return "Glutes"
        case .back: return "Back"
        case .shoulders: return "Shoulders"
        case .chest: return "Chest"
        case .arms: return "Arms"
        case .core: return "Core"
        }
    }
}

struct TrainingRoutine: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var kind: RoutineKind
    var sessionKind: SessionKind
    var notes: String
    var estimatedMinutes: Int
    var exercises: [RoutineExercise]
}

struct RoutineExercise: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var targetSets: Int
    var targetReps: String
    var notes: String
}

struct TrainingBlock: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var focus: String
    var weeks: [BlockWeek]
    var currentWeekIndex: Int
    var isLooping: Bool

    var currentWeek: BlockWeek? {
        guard weeks.indices.contains(currentWeekIndex) else { return weeks.first }
        return weeks[currentWeekIndex]
    }

    var weekLabel: String {
        guard let currentWeek else { return "No week selected" }
        return "Week \(currentWeekIndex + 1): \(currentWeek.title)"
    }
}

struct BlockWeek: Identifiable, Codable, Hashable {
    var id: UUID
    var title: String
    var note: String
    var plannedSessions: [PlannedSession]
}

struct PlannedSession: Identifiable, Codable, Hashable {
    var id: UUID
    var dayLabel: String
    var routineID: UUID?
    var sessionTitle: String
    var kind: SessionKind
}

struct WorkoutLog: Identifiable, Codable, Hashable {
    var id: UUID
    var date: Date
    var title: String
    var kind: SessionKind
    var durationMinutes: Int
    var intensity: Int
    var notes: String
    var routineID: UUID?
    var loadedAreas: [BodyArea]
    var exerciseLogs: [ExerciseLog]
}

struct ExerciseLog: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var keyWeight: Double?
    var reps: Int?
    var effort: Int?
}

struct BodyCheckIn: Identifiable, Codable, Hashable {
    var id: UUID
    var date: Date
    var sleepHours: Double
    var energy: Int
    var soreness: Int
    var stress: Int
    var fatiguedAreas: [BodyArea]
    var notes: String
}

struct TrainingSnapshot: Codable {
    var routines: [TrainingRoutine]
    var blocks: [TrainingBlock]
    var workouts: [WorkoutLog]
    var bodyCheckIns: [BodyCheckIn]
    var activeBlockID: UUID?
}

struct GuidanceCard: Identifiable, Hashable {
    var id = UUID()
    var title: String
    var summary: String
    var nextBestOption: String
    var emphasis: TrainingEmphasis
}

struct WeeklyMetric: Identifiable, Hashable {
    var id = UUID()
    var label: String
    var value: String
    var detail: String
}

struct SessionBreakdown: Identifiable, Hashable {
    var id = UUID()
    var kind: SessionKind
    var minutes: Int
}

struct ExerciseTrend: Identifiable, Hashable {
    var id = UUID()
    var name: String
    var latest: String
    var comparison: String
}

extension Array where Element == BodyArea {
    var titles: String {
        if isEmpty { return "Nothing marked" }
        return map(\.title).joined(separator: ", ")
    }
}

extension Double {
    var weightString: String {
        if rounded() == self {
            return "\(Int(self)) kg"
        }
        return "\(self.formatted(.number.precision(.fractionLength(1)))) kg"
    }
}

extension Date {
    var shortDay: String {
        DateFormatter.shortDay.string(from: self)
    }

    var monthDay: String {
        DateFormatter.monthDay.string(from: self)
    }
}

private extension DateFormatter {
    static let shortDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "E d MMM"
        return formatter
    }()

    static let monthDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        return formatter
    }()
}

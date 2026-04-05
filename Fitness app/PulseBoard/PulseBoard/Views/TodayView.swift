import SwiftUI

struct TodayView: View {
    @EnvironmentObject private var store: TrainingStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                heroCard
                metricsGrid
                guidanceSection
                blockSection
                weeklyBalanceSection
                recentSection
            }
            .padding()
        }
        .navigationTitle("Today")
    }

    private var heroCard: some View {
        SectionCard("Train with direction", subtitle: "This app is built to keep you moving intelligently, not just tell you to stop.") {
            if let latest = store.latestBodyCheckIn {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Latest body read")
                            .font(.subheadline.weight(.semibold))
                        Text("Sleep \(String(format: "%.1f", latest.sleepHours)) h • Energy \(latest.energy)/5 • Soreness \(latest.soreness)/5")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    Spacer()

                    EmphasisBadge(emphasis: latest.soreness >= 4 ? .recovery : .mixed)
                }

                if !latest.fatiguedAreas.isEmpty {
                    Text("Loaded areas: \(latest.fatiguedAreas.titles)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            } else {
                Text("Add a quick body check-in so the app can guide the day better.")
                    .foregroundStyle(.secondary)
            }
        }
    }

    private var metricsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(store.weeklyMetrics) { metric in
                MetricTile(label: metric.label, value: metric.value, detail: metric.detail)
            }
        }
    }

    private var guidanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Guidance")
                .font(.title2.bold())

            ForEach(store.guidanceCards) { card in
                SectionCard(card.title, subtitle: card.summary) {
                    VStack(alignment: .leading, spacing: 10) {
                        EmphasisBadge(emphasis: card.emphasis)
                        Text(card.nextBestOption)
                            .font(.subheadline)
                    }
                }
            }
        }
    }

    private var blockSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Active block")
                .font(.title2.bold())

            if let block = store.activeBlock {
                SectionCard(block.name, subtitle: block.focus) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(block.weekLabel)
                                .font(.subheadline.weight(.semibold))
                            Spacer()
                            Button("Advance week") {
                                store.advanceActiveBlockWeek()
                            }
                        }

                        if let currentWeek = block.currentWeek {
                            ForEach(currentWeek.plannedSessions) { session in
                                HStack {
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("\(session.dayLabel) • \(session.sessionTitle)")
                                            .font(.subheadline.weight(.medium))
                                        Text(session.kind.shortDescription)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }

                                    Spacer()

                                    Image(systemName: session.kind.icon)
                                        .foregroundStyle(.orange)
                                }
                                .padding(.vertical, 2)
                            }
                        }
                    }
                }
            } else {
                EmptyStateCard(title: "No active block yet", message: "You can create a loop of training weeks in the Routines tab.")
            }
        }
    }

    private var weeklyBalanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Weekly balance")
                .font(.title2.bold())

            if store.weeklyBreakdown.isEmpty {
                EmptyStateCard(title: "Nothing logged yet", message: "Once you log a few sessions, you will see how your week is actually leaning.")
            } else {
                let maxMinutes = max(store.weeklyBreakdown.map(\.minutes).max() ?? 1, 1)

                ForEach(store.weeklyBreakdown) { item in
                    SectionCard(item.kind.title, subtitle: item.kind.shortDescription) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Label(item.kind.title, systemImage: item.kind.icon)
                                Spacer()
                                Text("\(item.minutes) min")
                                    .font(.subheadline.weight(.semibold))
                            }

                            ProgressView(value: Double(item.minutes), total: Double(maxMinutes))
                                .tint(.orange)
                        }
                    }
                }
            }
        }
    }

    private var recentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent")
                .font(.title2.bold())

            if store.recentWorkouts.isEmpty {
                EmptyStateCard(title: "No sessions yet", message: "Open the Log tab and add your first workout.")
            } else {
                ForEach(store.recentWorkouts.prefix(5)) { workout in
                    SectionCard(workout.title, subtitle: "\(workout.date.shortDay) • \(workout.durationMinutes) min • Intensity \(workout.intensity)/5") {
                        VStack(alignment: .leading, spacing: 8) {
                            Label(workout.kind.title, systemImage: workout.kind.icon)
                                .font(.subheadline.weight(.semibold))

                            if !workout.loadedAreas.isEmpty {
                                Text("Loaded: \(workout.loadedAreas.titles)")
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }

                            if !workout.notes.isEmpty {
                                Text(workout.notes)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }
            }
        }
    }
}

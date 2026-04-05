import SwiftUI

struct ProgressScreen: View {
    @EnvironmentObject private var store: TrainingStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                summarySection
                balanceSection
                trendsSection
            }
            .padding()
        }
        .navigationTitle("Progress")
    }

    private var summarySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("This week")
                .font(.title2.bold())

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach(store.weeklyMetrics) { metric in
                    MetricTile(label: metric.label, value: metric.value, detail: metric.detail)
                }
            }
        }
    }

    private var balanceSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Training balance")
                .font(.title2.bold())

            if store.weeklyBreakdown.isEmpty {
                EmptyStateCard(title: "Not enough data yet", message: "Once you log a few sessions, the app can show what is dominating your week.")
            } else {
                let maxMinutes = max(store.weeklyBreakdown.map(\.minutes).max() ?? 1, 1)

                ForEach(store.weeklyBreakdown) { item in
                    SectionCard(item.kind.title, subtitle: item.kind.shortDescription) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(item.kind.emphasis.title)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(.secondary)
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

    private var trendsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Key exercise trends")
                .font(.title2.bold())

            let trends = store.exerciseTrends()

            if trends.isEmpty {
                EmptyStateCard(title: "No lift trends yet", message: "Log a few key sets from repeated routines and the app will start showing changes.")
            } else {
                ForEach(trends) { trend in
                    SectionCard(trend.name, subtitle: trend.comparison) {
                        Text("Latest logged key set: \(trend.latest)")
                            .font(.subheadline)
                    }
                }
            }
        }
    }
}

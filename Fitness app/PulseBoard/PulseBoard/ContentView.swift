import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            NavigationStack {
                TodayView()
            }
            .tabItem {
                Label("Today", systemImage: "sun.max.fill")
            }

            NavigationStack {
                LogView()
            }
            .tabItem {
                Label("Log", systemImage: "plus.circle.fill")
            }

            NavigationStack {
                RoutinesView()
            }
            .tabItem {
                Label("Routines", systemImage: "square.grid.2x2.fill")
            }

            NavigationStack {
                ProgressScreen()
            }
            .tabItem {
                Label("Progress", systemImage: "chart.bar.fill")
            }

            NavigationStack {
                BodyView()
            }
            .tabItem {
                Label("Body", systemImage: "figure.strengthtraining.traditional")
            }
        }
        .tint(.orange)
    }
}

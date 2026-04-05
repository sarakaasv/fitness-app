import SwiftUI

@main
struct PulseBoardApp: App {
    @StateObject private var store = TrainingStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}

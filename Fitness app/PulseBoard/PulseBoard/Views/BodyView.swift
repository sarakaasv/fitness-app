import SwiftUI

struct BodyView: View {
    @EnvironmentObject private var store: TrainingStore

    @State private var date = Date()
    @State private var sleepHours = 7.0
    @State private var energy = 3
    @State private var soreness = 2
    @State private var stress = 2
    @State private var notes = ""
    @State private var selectedAreas: Set<BodyArea> = []
    @State private var showingSaved = false

    var body: some View {
        Form {
            Section("Daily body check-in") {
                DatePicker("Date", selection: $date, displayedComponents: .date)

                Stepper("Sleep: \(String(format: "%.1f", sleepHours)) h", value: $sleepHours, in: 0...12, step: 0.25)
                Stepper("Energy: \(energy)/5", value: $energy, in: 1...5)
                Stepper("Soreness: \(soreness)/5", value: $soreness, in: 1...5)
                Stepper("Stress: \(stress)/5", value: $stress, in: 1...5)
            }

            Section("Fatigued areas") {
                BodyAreaSelector(title: "What feels loaded right now?", selectedAreas: $selectedAreas)
            }

            Section("Notes") {
                TextField("Anything the app should remember about today?", text: $notes, axis: .vertical)
                    .lineLimit(3...6)
            }

            Section {
                Button("Save body check-in") {
                    saveCheckIn()
                }
                .buttonStyle(.borderedProminent)
            } footer: {
                Text("This is how the app learns where to redirect training instead of just telling you to stop.")
            }

            Section("Recent check-ins") {
                if store.bodyCheckIns.isEmpty {
                    Text("No check-ins yet.")
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(store.bodyCheckIns.prefix(5)) { checkIn in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(checkIn.date.shortDay)
                                .font(.subheadline.weight(.semibold))
                            Text("Sleep \(String(format: "%.1f", checkIn.sleepHours)) h • Energy \(checkIn.energy)/5 • Soreness \(checkIn.soreness)/5 • Stress \(checkIn.stress)/5")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                            Text("Loaded: \(checkIn.fatiguedAreas.titles)")
                                .font(.footnote)
                                .foregroundStyle(.secondary)

                            if !checkIn.notes.isEmpty {
                                Text(checkIn.notes)
                                    .font(.footnote)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 6)
                    }
                }
            }
        }
        .navigationTitle("Body")
        .onAppear {
            if let latest = store.latestBodyCheckIn {
                sleepHours = latest.sleepHours
                energy = latest.energy
                soreness = latest.soreness
                stress = latest.stress
                notes = latest.notes
                selectedAreas = Set(latest.fatiguedAreas)
            }
        }
        .alert("Body check-in saved", isPresented: $showingSaved) {
            Button("OK", role: .cancel) {}
        }
    }

    private func saveCheckIn() {
        let checkIn = BodyCheckIn(
            id: UUID(),
            date: date,
            sleepHours: sleepHours,
            energy: energy,
            soreness: soreness,
            stress: stress,
            fatiguedAreas: Array(selectedAreas),
            notes: notes
        )

        store.addBodyCheckIn(checkIn)
        showingSaved = true
    }
}

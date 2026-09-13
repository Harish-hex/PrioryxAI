import SwiftUI

@main
struct PrioryxAIApp: App {
  @StateObject private var auth = AuthManager.shared
  
  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(auth)
        .preferredColorScheme(.none) // Respects iOS Dark/Light system appearance
    }
  }
}

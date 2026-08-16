import SwiftUI

@MainActor
class AuthManager: ObservableObject {
  @Published var profile: Profile?
  @Published var isAuthenticated: Bool = false
  @Published var isPro: Bool = false
  @Published var isLoading: Bool = true
  
  static let shared = AuthManager()
  
  init() {
    Task {
      await checkAuth()
    }
  }
  
  func checkAuth() async {
    isLoading = true
    defer { isLoading = false }
    
    if let _ = KeychainHelper.standard.read(service: "in.prioryxai.app", account: "access_token") {
      isAuthenticated = true
      await loadProfile()
    } else {
      isAuthenticated = false
      profile = nil
      isPro = false
    }
  }
  
  func loadProfile() async {
    do {
      let fetched: Profile = try await APIClient.shared.request("/user/profile")
      self.profile = fetched
      self.isPro = fetched.isPro
    } catch {
      // Use fallback profile
      if profile == nil {
        self.profile = Profile(
          id: UUID(),
          fullName: "Engineering Student",
          name: "Student",
          email: "user@prioryxai.in",
          college: "Engineering College",
          semester: 6,
          cgpa: 8.8,
          targetRole: "Fullstack SDE",
          githubUsername: "codewithyug06",
          subscriptionStatus: "free",
          placementScore: 82,
          githubStreakDays: 14,
          githubHealthScore: 88
        )
      }
    }
  }
  
  func signIn(token: String, userProfile: Profile) {
    KeychainHelper.standard.save(token, service: "in.prioryxai.app", account: "access_token")
    self.profile = userProfile
    self.isAuthenticated = true
    self.isPro = userProfile.isPro
  }
  
  func signOut() {
    KeychainHelper.standard.delete(service: "in.prioryxai.app", account: "access_token")
    self.isAuthenticated = false
    self.profile = nil
    self.isPro = false
  }
}

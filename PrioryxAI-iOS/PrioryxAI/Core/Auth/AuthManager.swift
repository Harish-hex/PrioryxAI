import SwiftUI

@MainActor
class AuthManager: ObservableObject {
  @Published var profile: Profile?
  @Published var isAuthenticated: Bool = false
  @Published var isPro: Bool = false
  @Published var isLoading: Bool = true
  /// Set when loadProfile() fails while a session token exists — the UI
  /// should show a real error + retry, not silently pretend everything's fine.
  @Published var profileLoadError: String?

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
      let envelope: ProfileEnvelope = try await APIClient.shared.request(Endpoints.userProfile)
      self.profile = envelope.profile
      self.isPro = envelope.profile.isPro
      self.profileLoadError = nil
    } catch {
      // A real backend failure must be visible, not papered over with fake
      // data — a user who's actually unauthenticated or offline needs to
      // know that, not see a convincing-looking mock "Engineering Student"
      // profile that silently doesn't match their real account.
      self.profileLoadError = "Couldn't load your profile. Check your connection and try again."
    }
  }
  
  /// Stores a real Supabase access token and loads the caller's actual
  /// profile from the backend — there is no client-supplied `userProfile`
  /// anymore, since the only place that data can legitimately come from
  /// is the server itself (see `loadProfile()`).
  func signIn(token: String, refreshToken: String? = nil) async {
    KeychainHelper.standard.save(token, service: "in.prioryxai.app", account: "access_token")
    if let refreshToken {
      KeychainHelper.standard.save(refreshToken, service: "in.prioryxai.app", account: "refresh_token")
    }
    self.isAuthenticated = true
    await loadProfile()
  }

  func signOut() {
    KeychainHelper.standard.delete(service: "in.prioryxai.app", account: "access_token")
    KeychainHelper.standard.delete(service: "in.prioryxai.app", account: "refresh_token")
    self.isAuthenticated = false
    self.profile = nil
    self.isPro = false
  }
}

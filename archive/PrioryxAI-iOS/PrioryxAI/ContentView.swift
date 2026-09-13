import SwiftUI

struct ContentView: View {
  @EnvironmentObject var auth: AuthManager
  
  var body: some View {
    Group {
      if auth.isLoading {
        VStack(spacing: 16) {
          ZStack {
            Circle()
              .fill(LinearGradient.brand)
              .frame(width: 80, height: 80)
            Text("⚡").font(.system(size: 40))
          }
          ProgressView()
            .tint(Color.brandViolet)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
      } else if !auth.isAuthenticated {
        OnboardingView()
      } else if let error = auth.profileLoadError, auth.profile == nil {
        // Signed in, but the real profile fetch failed — show a retry, not
        // the setup wizard (which would look like a fresh/empty account).
        VStack(spacing: 16) {
          Text("⚠️").font(.system(size: 40))
          Text(error)
            .font(.bodyMD)
            .foregroundColor(Color.labelSecondary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 32)
          PXButton(title: "Retry", variant: .gradient, size: .md) {
            Task { await auth.loadProfile() }
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.bgPrimary)
      } else if auth.profile?.college == nil || auth.profile?.college?.isEmpty == true {
        SetupProfileView()
      } else {
        MainTabView()
      }
    }
    .animation(.easeInOut(duration: 0.3), value: auth.isAuthenticated)
  }
}

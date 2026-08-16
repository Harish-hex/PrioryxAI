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
      } else if auth.profile?.college == nil || auth.profile?.college?.isEmpty == true {
        SetupProfileView()
      } else {
        MainTabView()
      }
    }
    .animation(.easeInOut(duration: 0.3), value: auth.isAuthenticated)
  }
}

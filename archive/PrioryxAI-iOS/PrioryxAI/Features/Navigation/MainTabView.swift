import SwiftUI

struct MainTabView: View {
  @State private var selectedTab = 0
  @State private var showMoreSheet = false
  @State private var showAssistant = false
  
  var body: some View {
    ZStack(alignment: .bottom) {
      TabView(selection: $selectedTab) {
        DashboardView()
          .tabItem {
            Label("Dashboard", systemImage: selectedTab == 0 ? "house.fill" : "house")
          }
          .tag(0)
        
        LearningFeedView()
          .tabItem {
            Label("Feed", systemImage: "play.circle.fill")
          }
          .tag(1)
        
        Color.clear
          .tabItem { Label("AI", systemImage: "sparkles") }
          .tag(2)
        
        ProfileView()
          .tabItem {
            Label("Profile", systemImage: selectedTab == 3 ? "person.fill" : "person")
          }
          .tag(3)
        
        Color.clear
          .tabItem { Label("Career", systemImage: "ellipsis.circle.fill") }
          .tag(4)
      }
      .onChange(of: selectedTab) { tab in
        if tab == 2 {
          showAssistant = true
          selectedTab = 0
        } else if tab == 4 {
          showMoreSheet = true
          selectedTab = 0
        }
      }
      
      // Floating AI Button in Tab Center
      AITabButton {
        showAssistant = true
      }
      .offset(y: -24)
    }
    .sheet(isPresented: $showAssistant) {
      AssistantView()
    }
    .sheet(isPresented: $showMoreSheet) {
      MoreSheetView()
        .presentationDetents([.medium, .large])
    }
  }
}

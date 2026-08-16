import SwiftUI

struct AITabButton: View {
  let action: () -> Void
  
  var body: some View {
    Button(action: {
      UIImpactFeedbackGenerator(style: .medium).impactOccurred()
      action()
    }) {
      ZStack {
        Circle()
          .fill(LinearGradient.brand)
          .frame(width: 54, height: 54)
          .shadow(color: Color.brandViolet.opacity(0.4), radius: 8, x: 0, y: 4)
        
        Text("✨")
          .font(.system(size: 22))
      }
    }
  }
}

struct MoreItem: Identifiable {
  let id = UUID()
  let title: String
  let desc: String
  let emoji: String
  let gradient: LinearGradient
  let destination: AnyView
}

struct MoreSheetView: View {
  @Environment(\.dismiss) var dismiss
  
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 16) {
          VStack(alignment: .leading, spacing: 4) {
            Text("WORKSPACE PORTALS")
              .font(.captionSM)
              .fontWeight(.bold)
              .foregroundColor(Color.brandViolet)
            
            Text("AI Career Guidance")
              .font(.titleMD)
          }
          .padding(.horizontal, 20)
          .padding(.top, 16)
          
          LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            NavigationLink(destination: ResumeView()) {
              MoreCardView(emoji: "📄", title: "Resume Intelligence", desc: "ATS score & SWOT", gradient: .brand)
            }
            NavigationLink(destination: FoundryView()) {
              MoreCardView(emoji: "🔨", title: "Project Foundry", desc: "Step-by-step builder", gradient: .warm)
            }
            NavigationLink(destination: UnifiedCodingView()) {
              MoreCardView(emoji: "💻", title: "Coding Profiles", desc: "LeetCode & HackerRank", gradient: .success)
            }
            NavigationLink(destination: GitHubIntelligenceView()) {
              MoreCardView(emoji: "🔑", title: "GitHub Intelligence", desc: "Repo health & streak", gradient: .brand)
            }
            NavigationLink(destination: JobMarketView()) {
              MoreCardView(emoji: "💼", title: "Job Market", desc: "AI-matched roles", gradient: .warm)
            }
            NavigationLink(destination: PeerCollabView()) {
              MoreCardView(emoji: "👥", title: "Peer Collab", desc: "Duels & study friends", gradient: .brand)
            }
          }
          .padding(.horizontal, 20)
          .padding(.bottom, 24)
        }
      }
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}

struct MoreCardView: View {
  let emoji: String
  let title: String
  let desc: String
  let gradient: LinearGradient
  
  var body: some View {
    HStack(spacing: 12) {
      ZStack {
        RoundedRectangle(cornerRadius: 12)
          .fill(gradient)
          .frame(width: 38, height: 38)
        Text(emoji).font(.system(size: 18))
      }
      
      VStack(alignment: .leading, spacing: 2) {
        Text(title)
          .font(.captionLG)
          .fontWeight(.semibold)
          .foregroundColor(Color.labelPrimary)
          .lineLimit(1)
        Text(desc)
          .font(.captionSM)
          .foregroundColor(Color.labelSecondary)
          .lineLimit(1)
      }
    }
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.surface2)
    .clipShape(RoundedRectangle(cornerRadius: 16))
  }
}

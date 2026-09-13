import SwiftUI

struct ContributionGraphView: View {
  var streakDays: Int = 14
  
  let rows = 7
  let cols = 20
  
  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack {
        VStack(alignment: .leading, spacing: 2) {
          Text("GITHUB COMMIT STREAK")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          Text("\(streakDays) Days Active")
            .font(.titleMD)
            .fontWeight(.bold)
        }
        
        Spacer()
        
        HStack(spacing: 3) {
          Text("Less").font(.captionSM).foregroundColor(Color.labelTertiary)
          ForEach([0.1, 0.3, 0.6, 0.9, 1.0], id: \.self) { opacity in
            RoundedRectangle(cornerRadius: 2)
              .fill(Color.brandViolet.opacity(opacity))
              .frame(width: 8, height: 8)
          }
          Text("More").font(.captionSM).foregroundColor(Color.labelTertiary)
        }
      }
      
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 4) {
          ForEach(0..<cols, id: \.self) { c in
            VStack(spacing: 4) {
              ForEach(0..<rows, id: \.self) { r in
                let isFilled = (c * rows + r) % 3 != 0
                RoundedRectangle(cornerRadius: 3)
                  .fill(isFilled ? Color.brandViolet.opacity(Double(((c + r) % 4) + 1) * 0.25) : Color.surface3)
                  .frame(width: 12, height: 12)
              }
            }
          }
        }
        .padding(.vertical, 4)
      }
    }
    .padding(16)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: 20))
    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
  }
}

struct ProfileView: View {
  @EnvironmentObject var auth: AuthManager
  @State private var showUpgrade = false
  
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(spacing: 16) {
          // User Card
          VStack(spacing: 14) {
            HStack(spacing: 16) {
              PXAvatar(initials: auth.profile?.initials ?? "PR", size: 64)
              
              VStack(alignment: .leading, spacing: 4) {
                HStack {
                  Text(auth.profile?.displayName ?? "Engineering Student")
                    .font(.titleMD)
                    .fontWeight(.bold)
                  
                  if auth.isPro {
                    PXBadge(text: "PRO ✦", style: .pro)
                  }
                }
                
                Text("\(auth.profile?.college ?? "Engineering College") • Sem \(auth.profile?.semester ?? 6)")
                  .font(.bodySM)
                  .foregroundColor(Color.labelSecondary)
                
                if let github = auth.profile?.githubUsername {
                  Text("@\(github)")
                    .font(.captionLG)
                    .foregroundColor(Color.brandViolet)
                }
              }
              
              Spacer()
            }
            
            if !auth.isPro {
              PXButton(title: "Upgrade to Pro (₹59/mo) ✦", variant: .gradient, size: .sm) {
                showUpgrade = true
              }
            }
          }
          .padding(18)
          .background(Color.surface1)
          .clipShape(RoundedRectangle(cornerRadius: 22))
          .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
          
          // Recruiter Readiness
          HStack(spacing: 20) {
            // TODO: wire to GET /api/readiness-score (not part of the /user/profile
            // payload) — out of scope for this pass, showing GitHub health as a
            // stand-in rather than a fabricated placement score.
            ScoreRingView(score: auth.profile?.githubHealthScore ?? 0, size: 84, label: "GitHub Health")
            
            VStack(alignment: .leading, spacing: 10) {
              VStack(alignment: .leading, spacing: 2) {
                Text("GitHub Health")
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
                Text("\(auth.profile?.githubHealthScore ?? 88)%")
                  .font(.titleSM)
                  .fontWeight(.bold)
              }
              
              VStack(alignment: .leading, spacing: 2) {
                Text("Weekly Solved")
                  .font(.captionSM)
                  .foregroundColor(Color.labelSecondary)
                Text("6 tasks")
                  .font(.titleSM)
                  .fontWeight(.bold)
              }
            }
            
            Spacer()
          }
          .padding(18)
          .background(Color.surface1)
          .clipShape(RoundedRectangle(cornerRadius: 22))
          .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
          
          ContributionGraphView(streakDays: auth.profile?.githubStreakDays ?? 14)
          
          // Portals
          VStack(spacing: 10) {
            NavigationLink(destination: ResumeView()) {
              ProfileLinkRow(emoji: "📄", title: "Resume Intelligence & SWOT", subtitle: "ATS score & missing placement skills")
            }
            NavigationLink(destination: UnifiedCodingView()) {
              ProfileLinkRow(emoji: "💻", title: "Connected Coding Profiles", subtitle: "LeetCode & HackerRank sync")
            }
            NavigationLink(destination: PeerCollabView()) {
              ProfileLinkRow(emoji: "👥", title: "Peer Collaboration & Duels", subtitle: "Study buddies & ranking")
            }
          }
          
          Button("Sign Out") {
            auth.signOut()
          }
          .font(.bodyMD)
          .fontWeight(.semibold)
          .foregroundColor(Color.brandRed)
          .padding(.top, 16)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .padding(.bottom, 100)
      }
      .navigationTitle("Profile 👤")
      .sheet(isPresented: $showUpgrade) {
        UpgradeView()
      }
    }
  }
}

struct ProfileLinkRow: View {
  let emoji: String
  let title: String
  let subtitle: String
  
  var body: some View {
    HStack(spacing: 14) {
      Text(emoji).font(.system(size: 24))
      
      VStack(alignment: .leading, spacing: 2) {
        Text(title)
          .font(.bodyMD)
          .fontWeight(.semibold)
          .foregroundColor(Color.labelPrimary)
        Text(subtitle)
          .font(.captionSM)
          .foregroundColor(Color.labelSecondary)
      }
      
      Spacer()
      
      Image(systemName: "chevron.right")
        .font(.captionLG)
        .foregroundColor(Color.labelTertiary)
    }
    .padding(14)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: 18))
    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
  }
}

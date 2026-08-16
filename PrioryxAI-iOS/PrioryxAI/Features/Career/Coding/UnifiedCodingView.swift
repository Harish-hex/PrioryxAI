import SwiftUI

struct UnifiedCodingView: View {
  let platforms: [CodingProfile] = [
    CodingProfile(platform: "LeetCode", username: "yug_dev", problemsSolved: 248, rating: 1742, isConnected: true),
    CodingProfile(platform: "HackerRank", username: "yugendhar", problemsSolved: 85, rating: 1420, isConnected: true),
    CodingProfile(platform: "CodeChef", username: nil, problemsSolved: 0, rating: 0, isConnected: false),
    CodingProfile(platform: "Codeforces", username: nil, problemsSolved: 0, rating: 0, isConnected: false)
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        // Aggregate Hero
        HStack(spacing: 20) {
          ScoreRingView(score: 72, size: 88, label: "Index")
          
          VStack(alignment: .leading, spacing: 4) {
            Text("333")
              .font(.titleXL)
              .fontWeight(.bold)
            Text("Total Problems Solved")
              .font(.captionLG)
              .foregroundColor(Color.labelSecondary)
            Text("Top 12% among Indian Students")
              .font(.captionSM)
              .fontWeight(.bold)
              .foregroundColor(Color.brandEmerald)
          }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
        
        VStack(alignment: .leading, spacing: 10) {
          Text("PLATFORMS (2/4)")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          ForEach(platforms) { p in
            HStack {
              VStack(alignment: .leading, spacing: 3) {
                Text(p.platform)
                  .font(.titleSM)
                  .fontWeight(.semibold)
                
                if p.isConnected, let user = p.username {
                  Text("@\(user)")
                    .font(.captionLG)
                    .foregroundColor(Color.brandViolet)
                  Text("\(p.problemsSolved ?? 0) solved • Rating: \(p.rating ?? 0)")
                    .font(.captionSM)
                    .foregroundColor(Color.labelSecondary)
                } else {
                  Text("Not connected yet")
                    .font(.captionSM)
                    .foregroundColor(Color.labelTertiary)
                }
              }
              
              Spacer()
              
              if p.isConnected {
                ScoreRingView(score: min(100, (p.problemsSolved ?? 0) / 3), size: 52)
              } else {
                Button("Connect") {}
                  .font(.captionLG)
                  .fontWeight(.bold)
                  .foregroundColor(.white)
                  .padding(.horizontal, 14)
                  .padding(.vertical, 8)
                  .background(Color.brandViolet)
                  .clipShape(RoundedRectangle(cornerRadius: 12))
              }
            }
            .padding(16)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
          }
        }
      }
      .padding(16)
    }
    .navigationTitle("Coding Profiles 💻")
    .navigationBarTitleDisplayMode(.inline)
  }
}

struct GitHubIntelligenceView: View {
  let repos = [
    ("PrioryxAI", "AI academic & career command center for students.", "TypeScript", 18, 95),
    ("distributed-cache-go", "LRU cache with consistent hashing and Raft.", "Go", 8, 82),
    ("neural-style-transfer", "PyTorch implementation of Gatys style transfer.", "Python", 4, 70)
  ]
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        // GitHub Profile
        HStack(spacing: 14) {
          Text("🐙").font(.system(size: 36))
          VStack(alignment: .leading, spacing: 2) {
            Text("@codewithyug06")
              .font(.titleMD)
              .fontWeight(.bold)
            Text("Verified Developer Profile")
              .font(.captionLG)
              .foregroundColor(Color.brandViolet)
          }
          Spacer()
        }
        .padding(18)
        .background(Color.surface1)
        .clipShape(RoundedRectangle(cornerRadius: 22))
        
        ContributionGraphView(streakDays: 14)
        
        VStack(alignment: .leading, spacing: 10) {
          Text("TOP REPOSITORIES HEALTH (3)")
            .font(.captionSM)
            .fontWeight(.bold)
            .foregroundColor(Color.labelSecondary)
          
          ForEach(repos, id: \.0) { repo in
            HStack {
              VStack(alignment: .leading, spacing: 4) {
                Text(repo.0)
                  .font(.titleSM)
                  .fontWeight(.semibold)
                Text(repo.1)
                  .font(.captionLG)
                  .foregroundColor(Color.labelSecondary)
                  .lineLimit(2)
                
                HStack(spacing: 8) {
                  PXBadge(text: repo.2, style: .brand)
                  Text("★ \(repo.3) stars")
                    .font(.captionSM)
                    .foregroundColor(Color.labelTertiary)
                }
                .padding(.top, 4)
              }
              
              Spacer()
              
              ScoreRingView(score: repo.4, size: 52)
            }
            .padding(16)
            .background(Color.surface1)
            .clipShape(RoundedRectangle(cornerRadius: 20))
          }
        }
      }
      .padding(16)
    }
    .navigationTitle("GitHub Intelligence 🔑")
    .navigationBarTitleDisplayMode(.inline)
  }
}

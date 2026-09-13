import SwiftUI

struct WeekStats {
  var pending: Int = 4
  var completed: Int = 8
  var overdue: Int = 1
  var streak: Int = 14
}

struct ThisWeekStats: View {
  var stats: WeekStats = WeekStats()
  var isPro: Bool = false
  
  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      Text("THIS WEEK")
        .font(.captionSM)
        .fontWeight(.bold)
        .foregroundColor(Color.labelSecondary)
      
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 12) {
          StatCard(emoji: "⏳", value: "\(stats.pending)", label: "Pending")
          StatCard(emoji: "✅", value: "\(stats.completed)", label: "Done this week", isHighlight: true)
          StatCard(emoji: "⚠️", value: "\(stats.overdue)", label: "Overdue")
          StatCard(emoji: "🔥", value: isPro ? "\(stats.streak)d" : "Pro ✦", label: "GitHub Streak")
        }
      }
    }
  }
}

struct StatCard: View {
  let emoji: String
  let value: String
  let label: String
  var isHighlight: Bool = false
  
  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text(emoji).font(.system(size: 20))
        Spacer()
        Text(value)
          .font(.titleMD)
          .fontWeight(.bold)
          .foregroundColor(Color.labelPrimary)
      }
      
      Text(label)
        .font(.captionSM)
        .foregroundColor(Color.labelSecondary)
    }
    .padding(14)
    .frame(width: 130)
    .background(Color.surface1)
    .clipShape(RoundedRectangle(cornerRadius: 18))
    .overlay(
      RoundedRectangle(cornerRadius: 18)
        .stroke(isHighlight ? Color.brandViolet.opacity(0.3) : Color.separator, lineWidth: isHighlight ? 1.5 : 1)
    )
    .shadow(color: Color.black.opacity(0.04), radius: 6, x: 0, y: 2)
  }
}

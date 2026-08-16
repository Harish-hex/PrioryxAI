import Foundation

struct Profile: Codable, Identifiable {
  let id: UUID
  var fullName: String?
  var name: String?
  var username: String?
  var email: String?
  var college: String?
  var semester: Int?
  var cgpa: Double?
  var targetRole: String?
  var githubUsername: String?
  var subscriptionStatus: String?
  var placementScore: Int?
  var avatarURL: String?
  var githubStreakDays: Int?
  var githubHealthScore: Int?
  
  var displayName: String {
    fullName ?? name ?? username ?? "Student"
  }
  
  var initials: String {
    let parts = displayName.split(separator: " ")
    if parts.count >= 2 {
      return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
    }
    return String(displayName.prefix(2)).uppercased()
  }
  
  var isPro: Bool {
    subscriptionStatus == "pro"
  }
  
  enum CodingKeys: String, CodingKey {
    case id, email, college, semester, cgpa, name, username
    case fullName = "full_name"
    case targetRole = "target_role"
    case githubUsername = "github_username"
    case subscriptionStatus = "subscription_status"
    case placementScore = "placement_score"
    case avatarURL = "avatar_url"
    case githubStreakDays = "github_streak_days"
    case githubHealthScore = "github_health_score"
  }
}

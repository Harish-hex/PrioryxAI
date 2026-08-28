import Foundation

/// Mirrors the `profile` object returned by `GET /api/user/profile`
/// (src/app/api/user/profile/route.ts `SELF_FIELDS` + computed fields).
/// Note the route wraps its response as `{ profile: {...} }` — see
/// `ProfileEnvelope` below, used only at the decode boundary.
struct Profile: Codable, Identifiable {
  let id: String
  var name: String? = nil
  var username: String? = nil
  var email: String? = nil
  var college: String? = nil
  var semester: Int? = nil
  var cgpa: Double? = nil
  var githubUsername: String? = nil
  var avatarURL: String? = nil
  var proStatus: Bool? = nil
  var proExpiresAt: Date? = nil
  var githubStreakDays: Int? = nil
  var githubHealthScore: Int? = nil
  var totalTasks: Int? = nil
  var completedTasks: Int? = nil

  var displayName: String {
    name ?? username ?? "Student"
  }

  var initials: String {
    let parts = displayName.split(separator: " ")
    if parts.count >= 2 {
      return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
    }
    return String(displayName.prefix(2)).uppercased()
  }

  var isPro: Bool {
    guard proStatus == true else { return false }
    guard let proExpiresAt else { return true } // no expiry = lifetime/active
    return proExpiresAt > Date()
  }

  enum CodingKeys: String, CodingKey {
    case id, email, college, semester, cgpa, name, username
    case githubUsername = "github_username"
    case avatarURL = "avatar_url"
    case proStatus = "pro_status"
    case proExpiresAt = "pro_expires_at"
    case githubStreakDays = "github_streak_days"
    case githubHealthScore = "github_health_score"
    case totalTasks = "total_tasks"
    case completedTasks = "completed_tasks"
  }
}

/// `GET /api/user/profile` wraps the profile in an envelope — decode this,
/// then use `.profile`, rather than decoding `Profile` directly.
struct ProfileEnvelope: Decodable {
  let profile: Profile
}

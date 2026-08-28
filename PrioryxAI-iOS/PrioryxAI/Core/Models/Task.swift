import SwiftUI

/// Mirrors one item of the `feed` array returned by `GET /api/feed`
/// (see src/lib/data/feed.ts `getFeedData` — spreads the raw `tasks` row
/// plus a computed `score`/`reason`). There is no `GET /tasks` endpoint;
/// the dashboard's task list always comes from `/feed`.
struct TaskItem: Codable, Identifiable {
  let id: String
  var userId: String? = nil
  var title: String
  var type: String? = nil
  var subject: String? = nil
  var priority: Priority? = nil
  var dueAt: Date? = nil
  var deadline: Date? = nil
  var weightage: Double? = nil
  var completed: Bool = false
  var reason: String? = nil
  var score: Double? = nil
  var createdAt: Date? = nil

  enum Priority: String, Codable, CaseIterable {
    case urgent, high, medium, low

    var color: Color {
      switch self {
      case .urgent: return .brandRed
      case .high:   return Color(hex: "#F97316")
      case .medium: return Color(hex: "#EAB308")
      case .low:    return .brandEmerald
      }
    }

    var label: String { rawValue.capitalized }
  }

  enum CodingKeys: String, CodingKey {
    case id, title, type, subject, priority, deadline, completed, reason, score
    case userId = "user_id"
    case dueAt = "due_at"
    case weightage
    case createdAt = "created_at"
  }

  /// The web app derives a priority color from `due_at` when the row has no
  /// explicit `priority` (see derivePriority() in dashboard-view.tsx) — mirror
  /// that here so cards still get a sensible color for AI/system-generated tasks.
  var effectivePriority: Priority {
    if let priority { return priority }
    guard let dueAt else { return .low }
    let hoursLeft = dueAt.timeIntervalSinceNow / 3600
    if hoursLeft < 24 { return .urgent }
    if hoursLeft < 72 { return .high }
    return .low
  }
}

/// Convenience initializer for locally-created tasks (e.g. the "Add Task"
/// sheet before the server has assigned a real id) — not Codable-relevant.
extension TaskItem {
  init(id: String = UUID().uuidString, title: String, type: String = "manual", subject: String? = nil, priority: Priority? = .medium, dueAt: Date? = nil) {
    self.id = id
    self.userId = nil
    self.title = title
    self.type = type
    self.subject = subject
    self.priority = priority
    self.dueAt = dueAt
    self.deadline = nil
    self.weightage = nil
    self.completed = false
    self.reason = nil
    self.score = nil
    self.createdAt = nil
  }
}

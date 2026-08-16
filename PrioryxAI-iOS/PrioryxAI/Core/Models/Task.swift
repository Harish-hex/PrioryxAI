import SwiftUI

struct TaskItem: Codable, Identifiable {
  let id: UUID
  var userId: UUID?
  var title: String
  var description: String?
  var priority: Priority
  var status: Status
  var deadline: Date?
  var dueAt: Date?
  var estimatedHours: Double?
  var category: String?
  var source: String?
  var createdAt: Date?
  
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
  
  enum Status: String, Codable {
    case pending, done
  }
  
  enum CodingKeys: String, CodingKey {
    case id, title, description, priority, status, deadline, category, source
    case userId = "user_id"
    case dueAt = "due_at"
    case estimatedHours = "estimated_hours"
    case createdAt = "created_at"
  }
}

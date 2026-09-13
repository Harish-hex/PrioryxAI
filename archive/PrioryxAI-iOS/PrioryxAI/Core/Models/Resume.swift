import Foundation

struct ResumeAnalysis: Codable, Identifiable {
  let id: UUID
  var atsScore: Int
  var extractedSkills: [String]
  var missingSkills: [String]
  var strengths: [String]
  var weaknesses: [String]
  var analyzedAt: Date?
  
  enum CodingKeys: String, CodingKey {
    case id, strengths, weaknesses
    case atsScore = "ats_score"
    case extractedSkills = "extracted_skills"
    case missingSkills = "missing_skills"
    case analyzedAt = "analyzed_at"
  }
}

struct Project: Codable, Identifiable {
  let id: UUID
  var title: String
  var description: String
  var tier: String
  var techStack: [String]
  var currentPhase: Int?
  var totalPhases: Int?
  
  enum CodingKeys: String, CodingKey {
    case id, title, description, tier
    case techStack = "tech_stack"
    case currentPhase = "current_phase"
    case totalPhases = "total_phases"
  }
}

struct Job: Codable, Identifiable {
  let id: UUID
  var role: String
  var company: String
  var location: String
  var stipendOrCtc: String
  var matchScore: Int
  var skillsRequired: [String]
  var applyURL: String?
  var isBookmarked: Bool?
  
  enum CodingKeys: String, CodingKey {
    case id, role, company, location
    case stipendOrCtc = "stipend_or_ctc"
    case matchScore = "match_score"
    case skillsRequired = "skills_required"
    case applyURL = "apply_url"
    case isBookmarked = "is_bookmarked"
  }
}

struct Message: Codable, Identifiable {
  let id: UUID
  var role: String // "user" or "assistant"
  var content: String
  var createdAt: Date
  
  var isUser: Bool {
    role == "user"
  }
}

struct CodingProfile: Codable, Identifiable {
  var id: String { platform }
  var platform: String // LeetCode, CodeChef, HackerRank, Codeforces
  var username: String?
  var problemsSolved: Int?
  var rating: Int?
  var isConnected: Bool
  
  enum CodingKeys: String, CodingKey {
    case platform, username, rating
    case problemsSolved = "problems_solved"
    case isConnected = "is_connected"
  }
}

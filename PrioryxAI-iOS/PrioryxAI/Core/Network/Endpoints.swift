import Foundation

struct Endpoints {
  static let baseURL = "https://www.prioryxai.in/api"

  // Auth / profile
  static let userProfile = "/user/profile"
  static let userStatus = "/user/status"
  static let authLogout = "/auth/logout"

  // Dashboard — there is no GET /tasks; the task list + stats come from
  // /feed and /stats respectively (matches the web app's dashboard fetch).
  // POST /tasks (structured create) does exist and is used by Add Task.
  static let tasks = "/tasks"
  static let feed = "/feed"
  static let stats = "/stats"
  static let ingestManual = "/ingest/manual" // POST { text } — AI-parses a plain-English task
  static func taskComplete(_ id: String) -> String { "/tasks/\(id)/complete" } // PATCH
  static func taskDelete(_ id: String) -> String { "/tasks/\(id)" } // DELETE
  static func taskSnooze(_ id: String) -> String { "/tasks/\(id)/snooze" } // POST { hours }

  static let priority = "/priority"
  static let assistant = "/assistant"
  static let resumeUpload = "/career/resume/upload"
  static let resumeSwot = "/career/resume/swot"
  static let foundryIdeas = "/projects/ideas"
  static let codingUnified = "/platforms/unified"
  static let githubAnalyze = "/github/analyse"
  static let jobs = "/career/market/jobs"
  static let mobileBootstrap = "/mobile/bootstrap"
  static let userContext = "/user/context"
  static let feedback = "/feedback"
  static let opportunities = "/opportunities"
  static let skillGaps = "/skills/gaps"
  static let planningOverview = "/planning/overview"
  static let collabFriends = "/career/collab/friends"
  static let paymentsSubscribe = "/payments/subscribe"
}
